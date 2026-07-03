import "server-only";
import type { AiResult } from "@/lib/ai";

/**
 * Edición de imagen por IA (quitar reflejos de la joya pulida).
 *
 * Claude es de visión (no genera píxeles), así que el borrado de reflejos usa
 * un servicio de edición externo vía **fal.ai** (por defecto Gemini 2.5 Flash
 * Image "nano-banana"). Se activa con `FAL_KEY` en el servidor.
 *
 * Reparto de responsabilidades (anti-publicidad-engañosa): el EDITOR es audaz
 * con el reflejo (es el objetivo del cambio) y la AUDITORÍA de `cleanupPhoto`
 * es quien garantiza la fidelidad al producto real, rechazando cualquier
 * exceso (idealización, cambio de forma/color/acabado). Quien llama a esto
 * SIEMPRE debe auditar el resultado antes de usarlo.
 */

export function imageEditConfigured(): boolean {
  return !!process.env.FAL_KEY;
}

// Modelo de edición. Por defecto Gemini 2.5 Flash Image ("nano-banana"): rápido
// y fiable (no da timeouts). Gemini 3 Pro da algo más de calidad pero es lento y
// puede pasarse del límite de tiempo (Load failed). Override con FAL_IMAGE_MODEL
// (p. ej. "fal-ai/gemini-3-pro-image-preview/edit" si tu plan permite funciones largas).
const FAL_MODEL =
  process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-25-flash-image/edit";

/* --- Sistema de prompts -----------------------------------------------------
 * Lección aprendida (probada con fotos reales): si el prompt acumula demasiadas
 * cláusulas de "NO CAMBIES nada", el editor elige lo seguro y devuelve la foto
 * casi igual (reflejo intacto). La arquitectura correcta: el EDITOR debe ser
 * AUDAZ con el reflejo — la fidelidad la vigila la AUDITORÍA, que rechaza los
 * excesos. Por eso: (1) el objetivo del cambio va primero y con fuerza, (2) la
 * identidad del producto se expresa compacta y sin legalismos amenazantes,
 * (3) dos ESTRATEGIAS de formulación alternan entre intentos, y (4) un nivel de
 * AUDACIA escala automáticamente cuando los intentos salen tímidos. --------- */

/** Estrategia A — «cubo blanco»: re-iluminar la escena como si la foto se
 *  hubiera hecho dentro de una caja de luz blanca. */
const STRATEGY_WHITE_CUBE =
  "TASK: make this exact product photo look like it was taken inside a seamless WHITE photography lightbox (a 'white cube'). The jewelry's polished metal currently mirrors the photographer and the room; inside the white cube it would mirror ONLY white panels, soft neutral gradients and bright softbox highlights. Repaint ALL reflections on the metal accordingly — the reflected person, phone, hands and room must completely disappear. This is a LARGE, REQUIRED change to what appears on the metal surfaces: if a person or the room is still recognisable in the reflections, the edit has FAILED.";

/** Estrategia B — «sustitución quirúrgica»: reemplazar el contenido reflejado. */
const STRATEGY_SURGICAL =
  "TASK: on every polished metal surface of this jewelry, REPLACE the mirrored environment (the person taking the photo, their phone and hands, walls, furniture, windows, warm room tones) with the reflection of an empty white photo studio: white panels, soft neutral gradients, bright white highlights — like catalogue jewelry photography. Repaint those reflected areas boldly: a big, visible change on the metal is expected and required. Even faint leftover traces of the person or the room count as failure.";

/** Identidad del producto y de la escena (común a ambas estrategias). */
const SHARED_IDENTITY =
  "KEEP THE SAME REAL OBJECT AND SCENE: the piece keeps its exact contour, size, proportions and position; its physical surface details (facets, hammered marks, flat spots, dents, scratches) stay as in the original — do not beautify, smooth or symmetrise it, do not hide imperfections, do not add gemstones. (Note: the light pattern REFLECTED on the metal will change a lot — that is required; the piece's physical shape and details must not.) The metal keeps the same colour tone and stays glossy and mirror-bright: a mirror reflecting a white studio still shows strong contrast between bright white highlights and the metal's own tone — never matte, dull, darker, greyer or greener. Fastening parts (posts, butterfly backs, clasps), cast shadows, the prop or surface the piece sits on (with its exact texture and wrinkles), the background, the framing and the camera angle all stay identical. Do not add or remove any object. Photorealistic result.";

/** Escalada de audacia cuando los intentos anteriores salieron tímidos. */
const BOLDNESS_SUFFIXES = [
  "",
  "\n\nNOTE: a previous attempt changed too little — the person and the room were still reflected on the metal. Be BOLDER on the reflected content this time: repaint the metal's reflections completely instead of copying them from the original.",
  "\n\nCRITICAL: previous attempts kept returning the reflections almost unchanged — that output is useless. The mirrored person/phone/room MUST be gone. Aggressively repaint EVERY reflection on ALL metal surfaces as clean white-studio content (while keeping the piece's shape, physical details, colour and glossiness). Prioritise removing the reflections.",
];

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `seed`: en FLUX se envía como seed real; en Gemini (que no acepta seed)
 *  selecciona la ESTRATEGIA de formulación (A/B), de modo que los reintentos
 *  nunca sean peticiones idénticas.
 *  `extra`: ajuste TEMPORAL de instrucción para ESTE intento (viene de la
 *  auditoría). NO modifica los prompts base: se concatena solo en esta llamada.
 *  `boldness` (0-2): escalada automática cuando los intentos previos salieron
 *  tímidos (fidelidad alta pero reflejo intacto). */
export async function removeReflection(
  imageUrl: string,
  opts: { seed?: number; extra?: string; boldness?: number } = {},
): Promise<AiResult<string>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  const isGemini = FAL_MODEL.includes("gemini");
  const seed = opts.seed ?? 0;
  const strategy = seed % 2 === 0 ? STRATEGY_WHITE_CUBE : STRATEGY_SURGICAL;
  const boldness =
    BOLDNESS_SUFFIXES[Math.max(0, Math.min(BOLDNESS_SUFFIXES.length - 1, opts.boldness ?? 0))];
  const prompt =
    strategy +
    "\n\n" +
    SHARED_IDENTITY +
    boldness +
    (opts.extra ? `\n\nAlso, fix this specifically in this attempt: ${opts.extra}` : "");
  // Gemini ("nano-banana") usa image_urls[]; FLUX Kontext usa image_url + params.
  const body = isGemini
    ? { prompt, image_urls: [imageUrl] }
    : {
        prompt,
        image_url: imageUrl,
        guidance_scale: 3.5,
        num_inference_steps: 32,
        safety_tolerance: "2",
        output_format: "jpeg",
        ...(opts.seed != null ? { seed: opts.seed } : {}),
      };
  try {
    const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Key ${key}`,
      },
      body: JSON.stringify(body),
      // Timeout propio: error claro en vez de agotar los 60 s de la función.
      signal: AbortSignal.timeout(32_000),
    });
    if (!res.ok) {
      if (res.status === 429) {
        return {
          ok: false,
          error: "El editor de imagen está saturado (límite de peticiones). Espera unos segundos y reintenta.",
        };
      }
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        error: `El editor de imagen no respondió (${res.status}). ${detail.slice(0, 180)}`,
      };
    }
    const data = (await res.json()) as {
      images?: { url?: string }[];
      image?: { url?: string };
      description?: string;
    };
    const url = data.images?.[0]?.url || data.image?.url;
    if (!url) {
      // Gemini puede rechazar la edición devolviendo 200 con images:[] y el
      // motivo en `description` — lo mostramos en vez de un error genérico.
      const why = String(data.description || "").slice(0, 160);
      return {
        ok: false,
        error: why
          ? `El editor rechazó la edición: ${why}`
          : "El editor no devolvió ninguna imagen.",
      };
    }
    return { ok: true, data: url };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "El editor de imagen tardó demasiado. Reintenta." };
    }
    return { ok: false, error: err?.message || "Error al llamar al editor de imagen." };
  }
}
