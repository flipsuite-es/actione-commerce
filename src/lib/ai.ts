import "server-only";

/**
 * Capa de IA interna de Oucy Studios (empresa «AI-first» de puertas adentro).
 *
 * TODA llamada a Claude del backoffice pasa por aquí: un único punto para el
 * modelo, la clave, el manejo de errores, la extracción de JSON y —muy
 * importante— las **reglas de marca/honestidad** que cualquier texto de cara al
 * catálogo o al cliente debe respetar (publicidad no engañosa; producto de
 * proveedor). Así añadir nuevas funciones de IA es trivial y siempre coherente.
 *
 * Requiere `ANTHROPIC_API_KEY` en el servidor (Vercel → Environment Variables).
 * Si falta, las funciones devuelven `{ ok:false, error }` con un aviso claro y
 * el backoffice sigue funcionando a mano (nunca bloquea).
 */

export const AI_MODEL = "claude-opus-4-8";

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Reglas innegociables para cualquier texto público (fichas, respuestas…). */
export const BRAND_RULES = `Oucy Studios es una marca de joyería de acero inoxidable: elegante, atemporal, cercana. Tono de marca sobrio y con gusto; español de España.

REGLAS INNEGOCIABLES (publicidad no engañosa — las piezas son de proveedor, NO las fabricamos ni diseñamos nosotros):
- El material es SIEMPRE "Acero inoxidable". Nunca inventes plata de ley, oro, latón, etc.
- El acabado puede describirse como "color plata" o "color dorado" (es solo el color del acero). PROHIBIDO: "oro", "bañado/chapado en oro", "baño de oro", "oro de Xk", "PVD de oro", "plata de ley". Sería falso.
- PROHIBIDO afirmar "hipoalergénico", "apto para piel sensible" o "sin níquel" (no está certificado).
- No digas "diseñado por nosotros", "hecho a mano", "hecho en España" ni nada sobre fabricación propia.
- Nada de spam de características ("no se oxida", "resistente al agua"…). Habla de la pieza y del momento para el que es, con elegancia.`;

export type AiImageBlock = {
  type: "image";
  source:
    | { type: "url"; url: string }
    | { type: "base64"; media_type: string; data: string };
};
export type AiTextBlock = { type: "text"; text: string };
export type AiBlock = AiTextBlock | AiImageBlock;
export type AiMessage = { role: "user" | "assistant"; content: string | AiBlock[] };

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface AskOpts {
  system?: string;
  messages: AiMessage[];
  maxTokens?: number;
}

export function imageBlock(url: string): AiImageBlock {
  return { type: "image", source: { type: "url", url } };
}

/** Imagen embebida en base64: evita que la API tenga que descargar la URL
 *  (menos latencia y un punto de fallo menos). Límite API: ~5 MB por imagen. */
export function imageBlockFromBuffer(
  buf: Buffer,
  mediaType = "image/webp",
): AiImageBlock {
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: buf.toString("base64") },
  };
}

async function callMessages(opts: AskOpts): Promise<AiResult<string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Falta ANTHROPIC_API_KEY en el servidor. Añádela en Vercel (Settings → Environment Variables) para activar las funciones de IA.",
    };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: opts.maxTokens ?? 1024,
        ...(opts.system ? { system: opts.system } : {}),
        messages: opts.messages,
      }),
      // Timeout propio: mejor un error claro que agotar el presupuesto de la
      // función (60 s) y morir con un fallo opaco.
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      if (res.status === 429 || res.status === 529) {
        return {
          ok: false,
          error:
            "La IA está saturada ahora mismo (límite de peticiones). Espera unos segundos y reintenta.",
        };
      }
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        error: `La IA no respondió (${res.status}). ${detail.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text =
      data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text || "")
        .join("")
        .trim() || "";
    if (!text) return { ok: false, error: "La IA devolvió una respuesta vacía." };
    return { ok: true, data: text };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "La IA tardó demasiado en responder. Reintenta." };
    }
    return { ok: false, error: err?.message || "Error al llamar a la IA." };
  }
}

/** Respuesta de texto libre (borradores de correos, respuestas de soporte…). */
export async function askText(opts: AskOpts): Promise<AiResult<string>> {
  return callMessages(opts);
}

/** Extrae el primer objeto JSON balanceado del texto (tolera texto alrededor,
 *  vallas ``` y llaves dentro de strings). */
function extractJsonObject(text: string): string | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

/** Respuesta estructurada: extrae y valida un objeto JSON de la salida. */
export async function askJSON<T>(opts: AskOpts): Promise<AiResult<T>> {
  const r = await callMessages(opts);
  if (!r.ok) return r;
  const jsonStr = extractJsonObject(r.data);
  if (!jsonStr) {
    return { ok: false, error: "La IA no devolvió un formato JSON válido." };
  }
  try {
    return { ok: true, data: JSON.parse(jsonStr) as T };
  } catch {
    return { ok: false, error: "No se pudo interpretar la respuesta de la IA." };
  }
}
