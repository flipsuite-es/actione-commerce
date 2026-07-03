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

// Modelo de edición. Por defecto Gemini 3 Pro ("nano-banana Pro"), el más capaz
// para esta edición. Es lento para el modo síncrono (60 s), así que se usa la
// COLA de fal (submit + poll desde el cliente), sin límite de tiempo.
// Override con FAL_IMAGE_MODEL (p. ej. "fal-ai/gemini-25-flash-image/edit").
const FAL_MODEL =
  process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-3-pro-image-preview/edit";

/* --- PIPELINE POR CAPAS ------------------------------------------------------
 * REGLA EMPÍRICA de esta sesión: el editor clava órdenes CORTAS y únicas, y se
 * paraliza o se pasa con prompts largos multi-objetivo. Por eso: capas. -------
 * Cada capa es UNA orden pequeña y única (lo que este modelo clava); pedirlo
 * todo a la vez hacía que se quedara corto o se pasara. La cadena por ronda:
 *   1) quitar la PERSONA/móvil de los reflejos   (probado: funciona muy bien)
 *   2) quitar la HABITACIÓN (parches cálidos/oliva del metal)
 *   3) balance de blancos del AMBIENTE (cojín/fondo leyéndose blancos)
 * La auditoría final compara SIEMPRE contra la foto ORIGINAL, así la fidelidad
 * queda protegida de punta a punta de la cadena. ----------------------------- */

export const EDIT_STAGES = 3;

const STAGE_PERSON =
  "Edit this product photo of shiny polished metal jewelry. Completely REMOVE the reflection of the person, their phone and hands from the polished metal surfaces; repaint those reflected areas as a clean white photo studio (soft white with gentle highlights). " +
  "Keep everything else EXACTLY as is: the same piece (shape, size, dents, hammered texture, same bright glossy mirror finish and colour), the same cushion, shadow, background, framing and camera angle. Photorealistic — the same photograph.";

const STAGE_ROOM =
  "In this product photo, the polished metal still mirrors parts of the ROOM: the darker warm, olive or brown patches visible on the metal. Repaint ONLY those warm/dark reflected patches as clean white-studio reflection, so the metal shows just bright white highlights and its own clean light tone. " +
  "Touch nothing else: same piece (shape, size, dents, hammered texture, same glossy mirror finish and colour), same cushion, shadow, background, framing and angle. Photorealistic — the same photograph.";

const STAGE_AMBIENT =
  "Apply a gentle white-balance correction to this product photo so the cushion and the background read clean, bright white (remove the warm/grey colour cast). " +
  "Do NOT re-stage anything: exact same camera angle, framing, cushion position and wrinkles, the same cast shadow, and the jewelry completely untouched (same shape, colour and glossy finish). The same real photograph, not a render.";

const STAGE_PROMPTS = [STAGE_PERSON, STAGE_ROOM, STAGE_AMBIENT];

export interface EditPromptOpts {
  seed?: number;
  /** Capa 1..3 (persona / habitación / ambiente). */
  stage?: number;
  extra?: string;
  boldness?: number;
}

function buildStagePrompt(opts: EditPromptOpts): string {
  const idx = Math.max(1, Math.min(EDIT_STAGES, opts.stage ?? 1)) - 1;
  // El feedback/presión solo aplica a la capa de la habitación (la difícil);
  // las otras dos funcionan mejor sin ruido añadido.
  if (idx !== 1) return STAGE_PROMPTS[idx];
  const boldness =
    BOLDNESS_SUFFIXES[
      Math.max(0, Math.min(BOLDNESS_SUFFIXES.length - 1, opts.boldness ?? 0))
    ];
  return (
    STAGE_PROMPTS[idx] +
    boldness +
    (opts.extra ? `\n\nAlso fix specifically: ${opts.extra}` : "")
  );
}

/** Escalada de audacia cuando los intentos anteriores salieron tímidos (corta:
 *  una línea; los párrafos de presión largos paralizaban al modelo). */
const BOLDNESS_SUFFIXES = [
  "",
  "\n\nA previous attempt left the reflections unchanged — this time repaint them completely.",
  "\n\nIMPORTANT: previous attempts barely changed the reflections. The mirrored person and room MUST be gone this time — repaint every reflection on the metal as white studio.",
];

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `strategy`: índice de la formulación a usar (0 = directa probada, 1 = cubo
 *  blanco). Cada ronda lanza ambas en paralelo y la auditoría elige.
 *  `extra`: ajuste TEMPORAL de instrucción para ESTE intento (viene de la
 *  auditoría). NO modifica los prompts base: se concatena solo en esta llamada.
 *  `boldness` (0-2): coletilla corta de presión cuando los intentos previos
 *  salieron tímidos. `seed`: solo lo usa la rama FLUX. */
export async function removeReflection(
  imageUrl: string,
  opts: { seed?: number; strategy?: number; extra?: string; boldness?: number } = {},
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
  const prompt = buildStagePrompt(opts);
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

function buildEditBody(imageUrl: string, opts: EditPromptOpts) {
  const isGemini = FAL_MODEL.includes("gemini");
  const prompt = buildStagePrompt(opts);
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
): Promise<AiResult<QueueTicket>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  try {
    const res = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Key ${key}`,
      },
      body: JSON.stringify(buildEditBody(imageUrl, opts)),
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
