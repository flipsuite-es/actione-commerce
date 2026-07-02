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
  "Remove the reflection of the person, the photographer, hands, phone or camera from the polished metal jewelry surface. Make the metal reflect a clean, neutral, softly-lit studio instead (subtle white and light-grey gradients). " +
  "CRITICAL — keep the jewelry piece EXACTLY the same real object: identical shape, size and proportions; the same metallic tone and finish (do NOT turn a gold-tone finish into brighter real gold, do NOT change a silver tone); do NOT add gemstones; do NOT remove or hide real scratches, dents or imperfections on the metal; keep the same surface it rests on. Only replace the mirror-reflection content. Keep it photorealistic, as if it were the same photograph taken in a clean studio.";

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo. */
export async function removeReflection(imageUrl: string): Promise<AiResult<string>> {
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
        guidance_scale: 3.5,
        num_inference_steps: 30,
        safety_tolerance: "2",
        output_format: "jpeg",
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
