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

const FAL_MODEL = "fal-ai/flux-pro/kontext";

const REFLECTION_PROMPT =
  "Retouch this jewelry product photo so it looks as if it was shot inside a clean white light tent, with large plain white cards all around the front. The polished metal should therefore reflect ONLY smooth, clean, pure WHITE and soft warm highlights — as if everything in front of the piece were a plain white surface. " +
  "This means: wherever the metal currently shows a reflection of a person, photographer, hands, phone, camera or the room, replace that reflected content with clean white / soft warm-white studio reflection. Keep natural bright specular highlights. " +
  "CRITICAL — keep the metal itself EXACTLY the same: a bright, warm, highly polished mirror gold-tone (or silver-tone) finish. Do NOT dull, darken, desaturate, matte, tarnish or muddy it; do NOT add green, grey, brown or dirty tones. " +
  "Preserve EXACTLY the piece's shape, size and proportions, the warm sunlight and shadows, and the white pillow and background. Do NOT add gemstones and do NOT hide real scratches or dents. Photorealistic, minimal surgical edit — only the reflected content on the metal becomes clean white.";

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `seed` opcional: varíala entre reintentos para obtener resultados distintos. */
export async function removeReflection(
  imageUrl: string,
  opts: { seed?: number } = {},
): Promise<AiResult<string>> {
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel (Settings → Environment Variables) para activar el borrado de reflejos.",
    };
  }
  try {
    const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        prompt: REFLECTION_PROMPT,
        image_url: imageUrl,
        // Guidance bajo = se mantiene más pegado a la foto original (menos
        // "invención" del acabado, que era lo que apagaba el dorado).
        guidance_scale: 2.5,
        num_inference_steps: 32,
        safety_tolerance: "2",
        output_format: "jpeg",
        ...(opts.seed != null ? { seed: opts.seed } : {}),
      }),
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
