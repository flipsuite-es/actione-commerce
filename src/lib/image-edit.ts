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

// Modelo de edición. Por defecto Gemini 2.5 Flash Image ("nano-banana"): rápido
// y fiable (no da timeouts). Gemini 3 Pro da algo más de calidad pero es lento y
// puede pasarse del límite de tiempo (Load failed). Override con FAL_IMAGE_MODEL
// (p. ej. "fal-ai/gemini-3-pro-image-preview/edit" si tu plan permite funciones largas).
const FAL_MODEL =
  process.env.FAL_IMAGE_MODEL || "fal-ai/gemini-25-flash-image/edit";

const REFLECTION_PROMPT =
  "You are retouching a professional product photo of polished metal jewelry (gold-tone or silver-tone). The metal is mirror-polished, so its surface currently REFLECTS the photographer's environment: often the person taking the photo, their hands or phone, and the room — visible as recognisable shapes or as darker warm/olive/beige patches on the metal. " +
  "YOUR ONLY TASK: change what the metal REFLECTS, nothing else. Repaint ALL reflected environment content on every metal surface — person, face, hands, phone, and the entire room (walls, floor, furniture, windows, warm-coloured surroundings) — so the metal instead reflects a bright, seamless, professional WHITE photo studio: clean white softbox highlights and soft neutral gradients, exactly like catalogue jewelry photography. Even FAINT traces count as failure: after the edit, nothing of the person or the room may be recognisable anywhere on the metal. " +
  "IMPORTANT — a polished metal piece reflecting a white studio still looks SHINY, with strong contrast: bright white highlights blending into the metal's own colour in smooth glossy gradients. So keep the SAME metal colour and the SAME bright mirror finish; do NOT make it matte, flat, dull, darker, greyer or greener. " +
  "WHAT MUST NOT CHANGE (this is a real product listing — altering the product is illegal false advertising): the piece's exact silhouette, size, proportions and position; every physical detail (hammered or faceted areas, flat spots, dents, bumps, scratches) exactly as in the original — do NOT smooth, reshape, symmetrise, beautify or idealise the piece, and do NOT hide real imperfections or add gemstones. " +
  "ALSO PRESERVE EXACTLY: fastening parts (posts, butterfly backs, clasps) and their position, the cast shadows, the prop or surface the piece sits on (with its exact texture and wrinkles), the background, the framing, the camera angle and the composition (same crop, same subject size and position). Do NOT re-stage or re-render the scene. " +
  "Photorealistic result: it must look like the SAME photograph, simply shot inside a clean white studio.";

/** Devuelve la URL (temporal, de fal) de la imagen sin reflejo.
 *  `seed`: en FLUX se envía como seed real; en Gemini (que no acepta seed)
 *  selecciona una coletilla de variación del prompt para que los reintentos
 *  no sean peticiones idénticas.
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
  const isGemini = FAL_MODEL.includes("gemini");
  // Gemini NO acepta `seed` (solo la rama FLUX lo envía). Para que dos
  // reintentos no manden un body byte-idéntico, la seed selecciona una
  // coletilla de variación que además REFUERZA la instrucción clave.
  const VARIATION_SUFFIXES = [
    "",
    " Re-check: every warm/olive/beige patch on the metal is reflected room — repaint it as clean white studio reflection.",
    " Double-check the largest metal surfaces: only white-studio tones may remain there, no warm or dark reflected patches.",
    " Inspect the edges and curved areas of the metal where room reflections persist; they must reflect only the white studio.",
  ];
  const variation =
    isGemini && opts.seed != null
      ? VARIATION_SUFFIXES[opts.seed % VARIATION_SUFFIXES.length]
      : "";
  const prompt =
    (opts.extra
      ? `${REFLECTION_PROMPT}\n\nAlso, fix this specifically in this attempt: ${opts.extra}`
      : REFLECTION_PROMPT) + variation;
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
