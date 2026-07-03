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

// DOS motores de edición vía cola de fal:
//  - "fast": Gemini 2.5 Flash — cola de segundos, barato; con la composición
//    por máscara protegiendo la escena es el motor por defecto.
//  - "strong": Gemini 3 Pro — más capaz pero su cola puede saturarse durante
//    minutos; se usa como ESCALADA cuando el rápido se muestra tímido.
// Override del fuerte con FAL_IMAGE_MODEL.
const FAL_MODEL_FAST = "fal-ai/gemini-25-flash-image/edit";
const FAL_MODEL_STRONG =
  process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-3-pro-image-preview/edit";

export type EditEngine = "fast" | "strong";

function modelFor(engine: EditEngine): string {
  return engine === "strong" ? FAL_MODEL_STRONG : FAL_MODEL_FAST;
}

/* --- ARQUITECTURA "IA SOLO DONDE ES IMPRESCINDIBLE" --------------------------
 * La IA edita la imagen entera pero SOLO SE USA SU METAL: `pollCleanup`
 * segmenta la joya (SAM 3) y compone el metal editado sobre la foto ORIGINAL
 * píxel a píxel (fidelidad de escena matemática, no prometida por prompt), y
 * el ambiente blanco se logra con balance de blancos determinista (sharp).
 * Por eso el prompt del editor es UNO y corto: metal → estudio blanco. ------- */

const METAL_PROMPT =
  "Retouch the polished metal jewelry in this product photo.\n\n" +
  "PROBLEM: the mirror-polished metal currently reflects the photographer (person, phone, hands) and the room (dark warm, olive or brown patches and recognisable shapes).\n\n" +
  "TASK: repaint ONLY the reflections on the metal, so the piece looks like it was photographed inside a professional white softbox lightbox. IMPORTANT — polished gold inside a white lightbox does NOT look white or pale: it looks RICH, warm, saturated gold. Its surface shows smooth elegant gradients: large soft white-gold highlight bands from the softbox, blending into medium golden tones, with deeper amber-gold shading along the curved edges. No recognisable shapes, no human silhouette, no phone, no dark olive or brown room patches — just clean abstract gold-and-soft-white gradients, exactly like luxury jewelry catalogue photography. (If the metal is silver-tone, the same applies with silver: rich bright silver with soft white highlight bands, never flat grey.)\n\n" +
  "KEEP EXACTLY: the piece's silhouette, size, position and orientation; every dent, hammered facet and surface irregularity; the earring posts and clasps; the metal's warm rich COLOUR — do not desaturate it, do not make it pale, whitish, silvery or washed out; the glossy mirror finish. Keep the cushion, shadow, background and framing untouched.\n\n" +
  "The result must look like the SAME photograph of the SAME jewel, only with clean studio reflections.";

export interface EditPromptOpts {
  seed?: number;
  extra?: string;
  boldness?: number;
}

function buildMetalPrompt(opts: EditPromptOpts): string {
  const boldness =
    BOLDNESS_SUFFIXES[
      Math.max(0, Math.min(BOLDNESS_SUFFIXES.length - 1, opts.boldness ?? 0))
    ];
  return (
    METAL_PROMPT +
    boldness +
    (opts.extra ? `\n\nAlso fix specifically: ${opts.extra}` : "")
  );
}

/** Escalada de audacia cuando los intentos anteriores salieron tímidos (corta:
 *  una línea; los párrafos de presión largos paralizaban al modelo). */
const BOLDNESS_SUFFIXES = [
  "",
  "\n\nA previous attempt left the reflections unchanged — this time repaint them completely (rich gold with soft white-gold highlight bands).",
  "\n\nIMPORTANT: previous attempts barely changed the reflections. The mirrored person and room MUST be gone this time — repaint every reflection on the metal as rich gold with soft white-gold studio highlights (never pale or washed out).",
];

/** [LEGADO — el flujo principal usa la cola; queda como vía síncrona de
 *  reserva.] Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `extra`: ajuste TEMPORAL para ESTE intento (no toca el prompt base).
 *  `boldness` (0-2): coletilla corta de presión. `seed`: solo rama FLUX. */
export async function removeReflection(
  imageUrl: string,
  opts: EditPromptOpts = {},
): Promise<AiResult<string>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  const isGemini = FAL_MODEL_FAST.includes("gemini");
  const prompt = buildMetalPrompt(opts);
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
    const res = await fetch(`https://fal.run/${FAL_MODEL_FAST}`, {
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

/* --- Cola asíncrona de fal ---------------------------------------------------
 * El modelo Pro tarda más de lo que permite una función (60 s), así que se usa
 * la cola: `submitReflectionEdit` encarga la edición y devuelve un ticket; el
 * cliente pregunta cada pocos segundos con `checkReflectionEdit` hasta que está
 * lista. Sin límite de tiempo y sin "Load failed". --------------------------- */

export interface QueueTicket {
  statusUrl: string;
  responseUrl: string;
}

/** Guardia anti-SSRF: los tickets viajan por el cliente y vuelven; solo se
 *  aceptan URLs de la cola de fal. */
export function isFalQueueUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "queue.fal.run";
  } catch {
    return false;
  }
}

function buildEditBody(imageUrl: string, opts: EditPromptOpts, model: string) {
  const isGemini = model.includes("gemini");
  const prompt = buildMetalPrompt(opts);
  return isGemini
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
}

/** Encarga la edición a la cola de fal. Vuelve al instante con el ticket. */
export async function submitReflectionEdit(
  imageUrl: string,
  opts: EditPromptOpts = {},
  engine: EditEngine = "fast",
): Promise<AiResult<QueueTicket>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  const model = modelFor(engine);
  try {
    const res = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Key ${key}`,
      },
      body: JSON.stringify(buildEditBody(imageUrl, opts, model)),
      signal: AbortSignal.timeout(15_000),
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
        error: `No se pudo encargar la edición (${res.status}). ${detail.slice(0, 160)}`,
      };
    }
    const data = (await res.json()) as {
      status_url?: string;
      response_url?: string;
    };
    if (!data.status_url || !data.response_url || !isFalQueueUrl(data.status_url) || !isFalQueueUrl(data.response_url)) {
      return { ok: false, error: "La cola del editor no devolvió un ticket válido." };
    }
    return { ok: true, data: { statusUrl: data.status_url, responseUrl: data.response_url } };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "La cola del editor tardó demasiado en responder. Reintenta." };
    }
    return { ok: false, error: err?.message || "Error al encargar la edición." };
  }
}

/** Comprueba el ticket: pendiente, o lista (con la URL temporal del resultado). */
export async function checkReflectionEdit(
  ticket: QueueTicket,
): Promise<AiResult<{ done: boolean; imageUrl?: string }>> {
  const key = process.env.FAL_KEY;
  if (!key) return { ok: false, error: "Falta FAL_KEY en el servidor." };
  if (!isFalQueueUrl(ticket.statusUrl) || !isFalQueueUrl(ticket.responseUrl)) {
    return { ok: false, error: "Ticket de edición no válido." };
  }
  try {
    const st = await fetch(ticket.statusUrl, {
      headers: { authorization: `Key ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!st.ok) {
      return { ok: false, error: `Estado de la edición no disponible (${st.status}).` };
    }
    const sdata = (await st.json()) as { status?: string };
    const status = String(sdata.status || "").toUpperCase();
    if (status === "IN_QUEUE" || status === "IN_PROGRESS") {
      return { ok: true, data: { done: false } };
    }
    if (status !== "COMPLETED") {
      return { ok: false, error: `La edición falló en el editor (${status || "estado desconocido"}).` };
    }
    const rs = await fetch(ticket.responseUrl, {
      headers: { authorization: `Key ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!rs.ok) {
      return { ok: false, error: `No se pudo recoger el resultado (${rs.status}).` };
    }
    const data = (await rs.json()) as {
      images?: { url?: string }[];
      image?: { url?: string };
      description?: string;
    };
    const url = data.images?.[0]?.url || data.image?.url;
    if (!url) {
      const why = String(data.description || "").slice(0, 160);
      return {
        ok: false,
        error: why
          ? `El editor rechazó la edición: ${why}`
          : "El editor no devolvió ninguna imagen.",
      };
    }
    return { ok: true, data: { done: true, imageUrl: url } };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "La consulta del estado tardó demasiado. Se reintentará." };
    }
    return { ok: false, error: err?.message || "Error consultando la edición." };
  }
}

/* --- Segmentación de la joya (SAM 3, prompt de texto) ------------------------
 * Devuelve las URLs de las máscaras binarias (blanco = joya) para que
 * `pollCleanup` componga el metal editado sobre la foto original. ----------- */

export async function segmentJewelry(
  imageUrl: string,
): Promise<AiResult<string[]>> {
  const key = process.env.FAL_KEY;
  if (!key) return { ok: false, error: "Falta FAL_KEY en el servidor." };
  try {
    const res = await fetch("https://fal.run/fal-ai/sam-3/image", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: "jewelry",
        apply_mask: false,
        output_format: "png",
        max_masks: 4,
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        error: `La segmentación de la joya falló (${res.status}). ${detail.slice(0, 120)}`,
      };
    }
    const data = (await res.json()) as { masks?: { url?: string }[] };
    const urls = (data.masks ?? [])
      .map((m) => m.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    if (!urls.length) {
      return { ok: false, error: "La segmentación no encontró la joya en la foto." };
    }
    return { ok: true, data: urls };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "La segmentación tardó demasiado." };
    }
    return { ok: false, error: err?.message || "Error en la segmentación." };
  }
}
