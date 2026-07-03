import "server-only";

/**
 * Comparación determinista de dos imágenes (sin IA) para el control del
 * borrado de reflejos. Su papel: detectar al instante el fallo más común del
 * editor generativo — devolver la imagen prácticamente igual (el reflejo sigue
 * ahí) — sin gastar una auditoría de visión, y con feedback específico para el
 * siguiente intento.
 *
 * Método: 192×192 en gris + blur(1) para tolerar la micro-desalineación de la
 * re-síntesis generativa, y normalización de brillo global (los editores suelen
 * desplazar el tono general sin que ello sea un cambio real). Calibrado con
 * casos sintéticos: idéntica+recompresión → ~0 %, edición local real del
 * reflejo → ~1 %, por eso el umbral de "no-change" va en 0,4 %.
 *
 * OJO: NO se usa para detectar "escena regenerada" — con la normalización esa
 * señal es ambigua; de eso se encarga la auditoría semántica (checklist de
 * fondo/silueta/sombras).
 */

export interface DiffStats {
  /** % de píxeles (gris 192×192, blur, brillo normalizado) con diff > 16/255. */
  changedPct: number;
  /** Diferencia media absoluta 0–255 tras normalizar brillo. */
  meanDiff: number;
}

async function prep(buf: Buffer) {
  const sharp = (await import("sharp")).default;
  const size = 192;
  const raw = await sharp(buf)
    .resize(size, size, { fit: "fill" })
    .greyscale()
    .blur(1)
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 0; i < raw.length; i++) sum += raw[i];
  return { raw, mean: sum / raw.length };
}

export async function pixelDiffStats(a: Buffer, b: Buffer): Promise<DiffStats> {
  const [pa, pb] = await Promise.all([prep(a), prep(b)]);
  const shift = pa.mean - pb.mean;
  const n = Math.min(pa.raw.length, pb.raw.length);
  if (n === 0) return { changedPct: 100, meanDiff: 255 };
  let changed = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(pa.raw[i] - (pb.raw[i] + shift));
    total += d;
    if (d > 16) changed++;
  }
  return { changedPct: (changed / n) * 100, meanDiff: total / n };
}

/** La edición se considera "sin cambios reales" por debajo de AMBOS umbrales. */
export const DIFF_NO_CHANGE_PCT = 0.4;
export const DIFF_NO_CHANGE_MEAN = 0.6;

export function isNoChange(d: DiffStats): boolean {
  return d.changedPct < DIFF_NO_CHANGE_PCT && d.meanDiff < DIFF_NO_CHANGE_MEAN;
}
