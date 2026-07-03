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

// Modelo de edición. Por defecto Gemini 3 Pro Image ("nano-banana Pro"), el más
// potente para edición por instrucción. Override: FAL_IMAGE_MODEL (p. ej.
// "fal-ai/gemini-25-flash-image/edit" o "fal-ai/flux-pro/kontext/max").
const FAL_MODEL =
  process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-3-pro-image-preview/edit";

const REFLECTION_PROMPT =
  "You are editing a product photo of gold-tone jewelry that is so polished it acts like a mirror. Right now the metal is MIRRORING the person taking the photo — a human body, face, arms and a phone are clearly visible reflected on the gold surface. " +
  "Your task: change ONLY what is REFLECTED on the metal (the environment it mirrors), NOT the jewelry object itself. Replace EVERYTHING reflected — the person, hands, phone, AND the whole room (walls, floor, furniture, windows, and any warm beige or coloured tones from the surroundings) — with the smooth, clean reflection of an empty, bright, plain WHITE photo studio: only soft white and neutral light-grey/white gradients. " +
  "After the edit, the metal must reflect ONLY clean white — there must be NO recognisable person, face, hand, phone, room, wall or warm-coloured environment reflected anywhere. Imagine the jewelry sitting inside a pure white box with nothing else around it. " +
  "Keep the jewelry object EXACTLY the same: same gold colour of the metal itself, same bright glossy MIRROR finish (it must still look highly reflective and shiny, NOT matte, NOT duller, NOT darker, NOT greyer/greener), same shape, size, proportions and position. You are only changing the reflected scenery, not the material. " +
  "TOP PRIORITY: in the original photo the darker warm / olive / beige / brownish patches on the metal are the REFLECTED ROOM — turn ALL of those into bright, clean white reflections. The finished metal must look like polished gold mirroring a pure white studio: bright white highlights and clean light-gold tones, with NO dark warm patches, NO olive/greenish tones and NO room shapes anywhere on the surface. " +
  "Keep the white pillow and background clean and bright. Do NOT add gemstones and do NOT hide real scratches. Photorealistic result.";

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
