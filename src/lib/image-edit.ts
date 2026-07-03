import "server-only";
import type { AiResult } from "@/lib/ai";

/**
 * Edición de imagen por IA (quitar reflejos de la joya pulida).
 *
 * Claude es de visión (no genera píxeles), así que el borrado de reflejos usa
 * un servicio de edición externo: **fal.ai** con FLUX.1 Kontext (edición por
 * instrucción que preserva el sujeto). Se activa con `FAL_KEY` en el servidor.
 *
 * MUY IMPORTANTE (anti-publicidad-engañosa): la instrucción es conservadora —
 * solo se sustituye el CONTENIDO del reflejo (que se vea un estudio neutro en
 * vez de una persona), manteniendo idénticos forma, tamaño, color y tipo de
 * acabado, sin añadir gemas ni ocultar defectos reales. Además, quien llama a
 * esto debe auditar el resultado (comparar original vs editada) antes de usarlo.
 */

export function imageEditConfigured(): boolean {
  return !!process.env.FAL_KEY;
}

// Modelo de edición. Por defecto Gemini 2.5 Flash Image ("nano-banana"), muy
// bueno quitando personas/reflejos manteniendo el sujeto. Override: FAL_IMAGE_MODEL
// (p. ej. "fal-ai/flux-pro/kontext/max").
const FAL_MODEL = process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-25-flash-image/edit";

const REFLECTION_PROMPT =
  "Edit this product photo of shiny gold-tone metal jewelry. COMPLETELY REMOVE every reflection of the person, photographer, hands, phone, camera and the room from the polished metal surfaces. Replace those reflections with the clean, smooth reflection of a plain white photo studio — soft white with gentle warm highlights — exactly as if the jewelry had been photographed inside a white light tent surrounded by plain white cards. There must be NO recognisable person or object reflected anywhere on the metal. " +
  "Keep the jewelry itself 100% identical: same shape, size, proportions and position, and the SAME bright, warm, glossy mirror gold-tone (or silver-tone) finish. Do NOT make the metal duller, darker, greyer, greener, browner or matte; do NOT change its colour; keep it looking like clean shiny polished metal with crisp highlights. " +
  "Keep the white pillow and background clean and bright. Do NOT add gemstones and do NOT hide real scratches or dents on the piece. Photorealistic result.";

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `seed`: varíala entre reintentos para resultados distintos.
 *  `extra`: ajuste TEMPORAL de instrucción para ESTE intento (viene de la
 *  auditoría, para afinar). NO modifica `REFLECTION_PROMPT` (el prompt base
 *  guardado): se concatena solo para esta llamada. */
export async function removeReflection(
  imageUrl: string,
  opts: { seed?: number; extra?: string } = {},
): Promise<AiResult<string>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  const prompt = opts.extra
    ? `${REFLECTION_PROMPT}\n\nAlso, fix this specifically in this attempt: ${opts.extra}`
    : REFLECTION_PROMPT;
  const isGemini = FAL_MODEL.includes("gemini");
  // Gemini ("nano-banana") usa image_urls[]; FLUX Kontext usa image_url + params.
  const body = isGemini
    ? { prompt, image_urls: [imageUrl], num_images: 1 }
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
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        error: `El editor de imagen no respondió (${res.status}). ${detail.slice(0, 180)}`,
      };
    }
    const data = (await res.json()) as {
      images?: { url?: string }[];
      image?: { url?: string };
    };
    const url = data.images?.[0]?.url || data.image?.url;
    if (!url) return { ok: false, error: "El editor no devolvió ninguna imagen." };
    return { ok: true, data: url };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Error al llamar al editor de imagen." };
  }
}
