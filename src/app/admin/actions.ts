"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { encryptSecret } from "@/lib/crypto";
import { askJSON, askText, imageBlock, BRAND_RULES } from "@/lib/ai";
import { removeReflection, imageEditConfigured } from "@/lib/image-edit";
import { getStoreSnapshot } from "@/lib/admin-data";

async function requireAdmin() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

function num(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function refreshStore() {
  revalidatePath("/");
  revalidatePath("/tienda");
}

export async function signOut() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Productos ---------------- */

/** SKU interno correlativo (control propio, no del proveedor): OUCY-0001, 0002…
 *  Se basa en el mayor número ya usado con ese prefijo, +1. */
async function nextSku(
  supabase: Awaited<ReturnType<typeof requireAdmin>>
): Promise<string> {
  const { data } = await supabase
    .from("products")
    .select("sku")
    .ilike("sku", "OUCY-%");
  let max = 0;
  for (const row of (data as { sku: string | null }[]) ?? []) {
    const m = /OUCY-(\d+)/i.exec(row.sku || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `OUCY-${String(max + 1).padStart(4, "0")}`;
}

export async function saveProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug =
    String(formData.get("slug") || "").trim() || slugify(name) || `p-${Date.now()}`;
  const images = JSON.parse(String(formData.get("images") || "[]")) as string[];

  // SKU: lo asignamos nosotros automáticamente para tener control. Se conserva
  // el existente al editar; al crear (o si viniera vacío) se genera correlativo.
  let sku = String(formData.get("sku") || "").trim();
  if (!sku) sku = await nextSku(supabase);

  const record = {
    name,
    slug,
    description: String(formData.get("description") || ""),
    price: num(formData.get("price")),
    compare_at_price: formData.get("compare_at_price") ? num(formData.get("compare_at_price")) : null,
    cost: formData.get("cost") ? num(formData.get("cost")) : null,
    stock: Math.round(num(formData.get("stock"))),
    sku,
    supplier_id: String(formData.get("supplier_id") || "") || null,
    supplier_ref: String(formData.get("supplier_ref") || "").trim() || null,
    material: String(formData.get("material") || "") || null,
    category_id: String(formData.get("category_id") || "") || null,
    images,
    status: String(formData.get("status") || "draft"),
    featured: formData.get("featured") === "on",
    sort: Math.round(num(formData.get("sort"))),
  };

  if (id) {
    const { error } = await supabase.from("products").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(record);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/productos");
  refreshStore();
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function duplicateProduct(id: string) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) return;
  const { id: _id, created_at, updated_at, ...rest } = data as any;
  await supabase.from("products").insert({
    ...rest,
    name: `${rest.name} (copia)`,
    slug: `${rest.slug}-${Date.now().toString(36)}`,
    status: "draft",
  });
  revalidatePath("/admin/productos");
}

export async function adjustStock(id: string, delta: number) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("stock").eq("id", id).single();
  const current = (data?.stock as number) ?? 0;
  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, current + delta) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function toggleProduct(id: string, field: "featured" | "status") {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("products").select("featured,status").eq("id", id).single();
  if (!data) return;
  const patch =
    field === "featured"
      ? { featured: !data.featured }
      : { status: data.status === "active" ? "draft" : "active" };
  await supabase.from("products").update(patch).eq("id", id);
  revalidatePath("/admin/productos");
  refreshStore();
}

export async function uploadImage(formData: FormData): Promise<string> {
  const supabase = await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Sin archivo");

  const original = Buffer.from(await file.arrayBuffer());

  // Procesado automático: endereza (EXIF), recorta cuadrado 1400px y optimiza a
  // WebP. Si sharp fallara, se sube la imagen original tal cual (no bloquea).
  let out = original;
  let ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  let contentType = file.type || "image/jpeg";
  try {
    const sharp = (await import("sharp")).default;
    out = await sharp(original)
      .rotate()
      .resize(1400, 1400, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();
    ext = "webp";
    contentType = "image/webp";
  } catch {
    /* sin procesar: se sube el original */
  }

  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, out, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Sugerencias de ficha a partir de la foto (visión IA).
 *  Devuelve nombre, descripción, material y categoría sugeridos para que el
 *  admin los revise antes de guardar. Atado a las reglas de marca: producto de
 *  acero inoxidable de proveedor; color plata/dorado es acabado, nunca «oro».
 *  Requiere `ANTHROPIC_API_KEY` en el servidor (Vercel). Si falta, devuelve un
 *  aviso claro y la ficha se rellena a mano como siempre. */
export async function suggestProduct(
  imageUrl: string,
  categories: { id: string; name: string }[]
): Promise<
  | {
      ok: true;
      name: string;
      description: string;
      material: string;
      category: string;
      price: number | null;
      compare_at_price: number | null;
    }
  | { ok: false; error: string }
> {
  await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sube una foto primero." };

  const nombresCategorias = categories.map((c) => c.name);
  const system = `${BRAND_RULES}

Eres el asistente de catálogo de Oucy Studios. A partir de una foto de una joya, redactas su ficha.
- No inventes medidas, peso, quilates ni materiales de piedras si no son evidentes. Si hay una circonita claramente visible puedes mencionarla; si dudas, no.
- Nombre corto y bonito (2–4 palabras). Descripción de 1–2 frases.

PRECIO (orientativo, EUROS): son bijouterie de acero inoxidable de coste bajo y la marca es NUEVA (sin recorrido todavía), así que el precio debe ser REALISTA y competitivo, NO de marca consolidada. Rango habitual 9.95–19.95 €; apunta a la parte baja-media (12.95–15.95) salvo que la pieza sea visualmente muy especial (hasta ~22.95). Redondea acabando en .95. NO inventes "precio antes": "compare_at_price" siempre null (solo se usa en rebajas reales).

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown ni texto extra) con esta forma exacta:
{"name":"...","description":"...","material":"Acero inoxidable","category":"...","price":14.95,"compare_at_price":null}
"category" debe ser uno EXACTO de esta lista (o "" si ninguno encaja): ${JSON.stringify(nombresCategorias)}.`;

  const r = await askJSON<{
    name?: string;
    description?: string;
    category?: string;
    price?: number | string | null;
    compare_at_price?: number | string | null;
  }>({
    system,
    maxTokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          imageBlock(imageUrl),
          {
            type: "text",
            text: "Analiza esta joya y devuelve el JSON con la ficha sugerida siguiendo las reglas.",
          },
        ],
      },
    ],
  });
  if (!r.ok) return { ok: false, error: r.error };

  const parsed = r.data;
  const catMatch = categories.find(
    (c) => c.name.toLowerCase() === String(parsed.category || "").toLowerCase()
  );
  const toPrice = (v: unknown): number | null => {
    const n = parseFloat(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  };

  return {
    ok: true,
    name: String(parsed.name || "").trim(),
    description: String(parsed.description || "").trim(),
    material: "Acero inoxidable",
    category: catMatch?.name ?? "",
    price: toPrice(parsed.price),
    // Nunca autorrellenamos "precio antes": solo se pone en una rebaja real
    // (evita anclas de descuento falsas → publicidad engañosa).
    compare_at_price: null,
  };
}

/** Control de calidad de foto de producto (visión IA). Detecta sobre todo
 *  reflejos del fotógrafo/móvil/persona en la joya pulida, y otros fallos que
 *  la harían poco vendible. NO edita la foto: solo avisa antes de publicar. */
export async function checkPhoto(imageUrl: string): Promise<
  | {
      ok: true;
      publishable: boolean;
      reflection: boolean;
      problems: string[];
      note: string;
    }
  | { ok: false; error: string }
> {
  await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sin imagen." };

  const system = `Eres el control de calidad de fotos de producto de una tienda de joyería (Oucy Studios). Te paso UNA foto de producto y detectas problemas que la harían poco vendible o no publicable.
Presta MÁXIMA atención a si se ve REFLEJADA una persona, el fotógrafo, manos o un teléfono/móvil en la joya o en cualquier superficie brillante: es el fallo más común en joyería pulida y hay que avisarlo siempre.
Evalúa también: fondo sucio o desordenado, foto borrosa/desenfocada, mal recorte o encuadre, iluminación muy pobre, dedos u objetos que distraen.
Sé práctico: si la foto es correcta aunque no sea perfecta, márcala publicable.

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown ni texto extra):
{"publishable": true, "reflection": false, "problems": [], "note": "..."}
- "reflection": true SOLO si se ve un reflejo de persona/fotógrafo/móvil.
- "problems": lista corta (máx 4) en español, cada uno una frase muy breve. Vacía si no hay problemas.
- "note": una frase breve de consejo en español (p. ej. usa la foto del proveedor, repite con más luz…).`;

  const r = await askJSON<{
    publishable?: boolean;
    reflection?: boolean;
    problems?: unknown;
    note?: string;
  }>({
    system,
    maxTokens: 500,
    messages: [
      {
        role: "user",
        content: [
          imageBlock(imageUrl),
          { type: "text", text: "Revisa esta foto de producto y devuelve el JSON." },
        ],
      },
    ],
  });
  if (!r.ok) return { ok: false, error: r.error };

  const problems = Array.isArray(r.data.problems)
    ? r.data.problems.map((p) => String(p)).filter(Boolean).slice(0, 4)
    : [];
  return {
    ok: true,
    publishable: r.data.publishable !== false,
    reflection: r.data.reflection === true,
    problems,
    note: String(r.data.note || ""),
  };
}

/** Edita una imagen (quita reflejo) y la guarda en NUESTRO Storage. Un intento.
 *  `extra` = ajuste temporal de instrucción para este intento (de la auditoría). */
async function editAndStore(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  imageUrl: string,
  seed: number,
  extra?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const edited = await removeReflection(imageUrl, { seed, extra });
  if (!edited.ok) return { ok: false, error: edited.error };
  try {
    const resp = await fetch(edited.data);
    if (!resp.ok) return { ok: false, error: `No se pudo descargar la imagen editada (${resp.status}).` };
    const inBuf = Buffer.from(await resp.arrayBuffer());
    let out = inBuf;
    let contentType = "image/jpeg";
    let ext = "jpg";
    try {
      const sharp = (await import("sharp")).default;
      out = await sharp(inBuf)
        .rotate()
        .resize(1400, 1400, { fit: "cover", position: "centre" })
        .webp({ quality: 82 })
        .toBuffer();
      contentType = "image/webp";
      ext = "webp";
    } catch {
      /* sin procesar */
    }
    const path = `products/clean-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, out, { contentType, upsert: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  } catch (err: any) {
    return { ok: false, error: err?.message || "No se pudo guardar la imagen editada." };
  }
}

/** Auditoría doble: mide FIDELIDAD al producto (no engañosa) Y cuánto se ha
 *  ELIMINADO el reflejo, y genera FEEDBACK (en inglés) para afinar el siguiente
 *  intento del editor. Publicable = fiel + reflejo limpio + no engañosa. */
async function auditEdit(
  originalUrl: string,
  editedUrl: string,
): Promise<
  | {
      ok: true;
      publishable: boolean;
      score: number;
      fidelity: number;
      reflectionRemoved: number;
      changes: string[];
      note: string;
      feedback: string;
    }
  | { ok: false; error: string }
> {
  const system = `${BRAND_RULES}

Eres el control de calidad Y anti-publicidad-engañosa de Oucy Studios. Te doy DOS fotos de una joya: la ORIGINAL y una EDITADA por IA cuyo objetivo es que el metal pulido (tipo espejo) refleje solo BLANCO limpio de estudio en vez del fotógrafo/persona/móvil, SIN cambiar el producto.

Evalúa DOS cosas por separado:
1) FIDELIDAD (0-100): 100 = EXACTAMENTE el mismo producto real. Compara con MUCHÍSIMO detalle la FORMA y la SILUETA de cada pieza, las PROPORCIONES, y sobre todo la TEXTURA y el ACABADO de la superficie. Mira si la editada ha ALISADO, IDEALIZADO, SUAVIZADO o hecho MÁS PERFECTA/SIMÉTRICA la pieza: en la original puede haber zonas martelé/facetadas, planos, bollos, pequeñas irregularidades o imperfecciones reales; si en la editada esos detalles han desaparecido, la pieza se ve más lisa/perfecta, o cambia su forma/silueta/proporción, entonces la edición ha FALSEADO el producto → FIDELIDAD MUY BAJA (por debajo de 55) y "misleading": true. Baja mucho también si cambia el color o el acabado. Una foto "más bonita" pero que ya no representa la pieza real es ENGAÑOSA y NO vale.
2) REFLEJO_ELIMINADO (0-100): cuánto se ha limpiado el reflejo del ENTORNO en el metal. 100 = el metal refleja SOLO blanco/estudio limpio (blanco y gradientes neutros), no se distingue NINGUNA persona NI la habitación. 0 = sigue reflejando la persona y/o la habitación como en la original.

FÍJATE MUCHÍSIMO EN EL REFLEJO — es LO MÁS IMPORTANTE de todo. Examina CADA superficie metálica con lupa y compárala con la original: busca (a) siluetas humanas, cara, torso, brazos, manos, móvil/cámara; y (b) la HABITACIÓN reflejada — paredes, suelo, muebles, ventanas o cualquier zona/mancha de tono CÁLIDO, beige, marrón, oliva o verdoso que sea el entorno reflejado.

REGLA DURA: si en la EDITADA se distingue CUALQUIER rastro de una persona, O CUALQUIER zona cálida/oliva/beige/marrón que corresponda a la habitación reflejada (por pequeña o tenue que sea, aunque solo esté en una parte de una gota), entonces REFLEJO_ELIMINADO debe ser MUY BAJO (por debajo de 40) y NO puede considerarse limpio. Sé EXTREMADAMENTE estricto y desconfiado: ante la mínima duda, cuenta como que el reflejo de la habitación SIGUE ahí.

Solo pon REFLEJO_ELIMINADO alto (>=80) si el metal refleja ÚNICAMENTE blanco y gradientes neutros claros y limpios (blancos/grises muy claros), como si estuviera dentro de una caja totalmente blanca, sin una sola zona que delate la habitación. (OJO: el color DORADO/amarillo propio del metal es correcto y NO cuenta como reflejo del entorno; lo que penaliza son las zonas cálidas/oscuras que son la habitación, no el oro en sí.)

"misleading" (bool): true si la edición ha FALSEADO el producto (acabado/color/forma cambiados, manchas nuevas…).

PUBLICABLE = FIDELIDAD >= 90 Y REFLEJO_ELIMINADO >= 80 Y no misleading (la pieza es idéntica a la real, sin idealizar).

"feedback": UNA instrucción BREVE en INGLÉS para el editor de imagen en el PRÓXIMO intento, corrigiendo lo que falle. Ejemplos: "the person's reflection is still clearly visible on the right drop — replace those reflections with clean smooth white, keep the gold bright, glossy and warm, do NOT dull or darken it"; o si se apagó el metal: "keep the gold much brighter and mirror-glossy, do not desaturate".

Devuelve EXCLUSIVAMENTE un JSON:
{"fidelity":90,"reflection_removed":20,"misleading":false,"changes":[],"note":"...","feedback":"..."}
- "changes": diferencias en español que afecten al PRODUCTO (vacía si el producto está intacto).
- "note": frase breve en español para el admin.`;

  const audit = await askJSON<{
    fidelity?: number | string;
    reflection_removed?: number | string;
    misleading?: boolean;
    changes?: unknown;
    note?: string;
    feedback?: string;
  }>({
    system,
    maxTokens: 600,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "ORIGINAL:" },
          imageBlock(originalUrl),
          { type: "text", text: "EDITADA:" },
          imageBlock(editedUrl),
          { type: "text", text: "Devuelve el JSON de auditoría." },
        ],
      },
    ],
  });
  if (!audit.ok) return { ok: false, error: audit.error };

  const clamp = (v: unknown): number => {
    const n = parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  };
  const fidelity = clamp(audit.data.fidelity);
  const reflectionRemoved = clamp(audit.data.reflection_removed);
  const changes = Array.isArray(audit.data.changes)
    ? audit.data.changes.map((c) => String(c)).filter(Boolean).slice(0, 5)
    : [];
  const misleading = audit.data.misleading === true || changes.length > 0;
  const publishable = !misleading && fidelity >= 90 && reflectionRemoved >= 80;
  // Puntuación combinada: si engaña, capada; si no, prioriza el REFLEJO (es el
  // objetivo) sobre la fidelidad.
  const score = misleading
    ? Math.min(fidelity, 30)
    : Math.round(0.35 * fidelity + 0.65 * reflectionRemoved);
  return {
    ok: true,
    publishable,
    score,
    fidelity,
    reflectionRemoved,
    changes,
    note: String(audit.data.note || ""),
    feedback: String(audit.data.feedback || ""),
  };
}

/** Quita el reflejo de una foto con IA y AUDITA el resultado (anti-publicidad
 *  engañosa). REINTENTA automáticamente (hasta `MAX_ATTEMPTS`) hasta que la
 *  auditoría confirme que es fiel; si ninguno pasa, devuelve el último con
 *  `safe=false` y recomienda usar la original. La original NUNCA se borra. */
type CleanupBest = {
  cleanedUrl: string;
  safe: boolean; // publicable (fiel + reflejo limpio + no engañosa)
  score: number;
  fidelity?: number;
  reflectionRemoved?: number;
  changes: string[];
  note: string;
  feedback?: string; // ajuste transitorio para el siguiente intento
};

export async function cleanupPhoto(
  imageUrl: string,
  prevBest?: CleanupBest | null,
): Promise<
  | (CleanupBest & { ok: true; attempts: number })
  | { ok: false; error: string }
> {
  const supabase = await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sin imagen." };
  if (!imageEditConfigured()) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel para activar el borrado de reflejos.",
    };
  }

  const MAX_ATTEMPTS = 1; // 1 edición + auditoría por petición (modelo Pro lento); el cliente encadena hasta AUTO_CAP
  let best: CleanupBest | null = prevBest ?? null;
  // Ajuste temporal de instrucción que arrastramos entre intentos (NO toca el
  // prompt base guardado). Arranca del feedback previo si venimos de otra tanda.
  let extra = prevBest?.feedback ?? "";
  let done = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const stored = await editAndStore(supabase, imageUrl, seed, extra || undefined);
    if (!stored.ok) {
      if (best) break; // conservamos el mejor que tuviéramos
      return { ok: false, error: stored.error };
    }
    done = attempt;

    const audit = await auditEdit(imageUrl, stored.url);
    // Sin auditoría (falta ANTHROPIC_API_KEY) no podemos puntuar ni verificar.
    if (!audit.ok) {
      return {
        ok: true,
        cleanedUrl: stored.url,
        safe: false,
        score: 0,
        changes: ["No se pudo auditar automáticamente (falta ANTHROPIC_API_KEY); compárala tú."],
        note: "",
        attempts: attempt,
      };
    }

    const candidate: CleanupBest = {
      cleanedUrl: stored.url,
      safe: audit.publishable,
      score: audit.score,
      fidelity: audit.fidelity,
      reflectionRemoved: audit.reflectionRemoved,
      changes: audit.changes,
      note: audit.note,
      feedback: audit.feedback,
    };
    if (!best || candidate.score > best.score) best = candidate;

    // La IA reajusta la instrucción para el SIGUIENTE intento (transitorio).
    if (audit.feedback) extra = audit.feedback;

    if (audit.publishable) {
      best = candidate; // devolvemos la publicable
      break;
    }
  }

  if (!best) return { ok: false, error: "No se pudo generar ninguna versión." };

  const note = best.safe
    ? best.note || "Publicable: producto fiel y reflejo limpio."
    : (best.reflectionRemoved ?? 0) < 60
      ? "La IA aún no ha quitado bien el reflejo. Sigue probando o usa la foto original."
      : best.changes.length > 0
        ? "Casi: el reflejo mejora pero la auditoría ve algún cambio en el producto. Sigue probando."
        : "Muy cerca. Sigue probando para afinar el reflejo.";

  return { ok: true, ...best, note, attempts: done };
}

/** Copiloto interno del panel: responde sobre el estado de la tienda y redacta
 *  textos/correos con el tono de marca. Solo CONSULTA (no ejecuta cambios). */
export async function askAssistant(
  history: { role: "user" | "assistant"; content: string }[],
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!history.length) return { ok: false, error: "Sin pregunta." };

  const snapshot = await getStoreSnapshot();
  const system = `${BRAND_RULES}

Eres el COPILOTO interno de Oucy Studios (empresa AI-first de puertas adentro). Ayudas al fundador a gestionar la tienda: respondes sobre el estado del negocio, priorizas tareas y redactas textos/correos (a proveedores, clientes, marketing) respetando SIEMPRE las reglas de marca de arriba.
- Español de España, claro, directo y con datos concretos del contexto.
- Solo CONSULTAS datos (te paso un resumen del backoffice); NO ejecutas cambios. Si algo hay que hacer en el panel, indícalo con la sección (p. ej. /admin/reposicion, /admin/productos, /admin/proveedores).
- Pricing: el coste de compra es 1–4 €/pieza y el PVP realista es ~10–20 € (punto dulce 12,95–15,95). No infles precios.
- Si un dato no está en el contexto, dilo en vez de inventarlo.

RESUMEN ACTUAL DEL BACKOFFICE (JSON):
${JSON.stringify(snapshot)}`;

  const msgs = history
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  const r = await askText({ system, maxTokens: 1400, messages: msgs });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, text: r.data };
}

/** Mejora la CALIDAD de la foto sin tocar el producto: ajustes globales de luz,
 *  contraste, nitidez y un punto de color (como el "editar" del móvil). Es
 *  procesado determinista (sharp), NO IA generativa: no inventa píxeles ni
 *  cambia forma/color/acabado → nunca es publicidad engañosa. Sin claves. */
export async function enhancePhoto(
  imageUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sin imagen." };
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return { ok: false, error: `No se pudo leer la imagen (${resp.status}).` };
    const inBuf = Buffer.from(await resp.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const out = await sharp(inBuf)
      .rotate()
      .resize(1400, 1400, { fit: "cover", position: "centre" })
      // Ajustes GLOBALES (no cambian el producto): un poco más de luz, algo de
      // contraste, un toque de saturación y nitidez.
      .modulate({ brightness: 1.06, saturation: 1.05 })
      .linear(1.08, -10)
      .sharpen()
      .webp({ quality: 88 })
      .toBuffer();
    const path = `products/enh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, out, { contentType: "image/webp", upsert: false });
    if (error) return { ok: false, error: error.message };
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return { ok: true, url };
  } catch (err: any) {
    return { ok: false, error: err?.message || "No se pudo mejorar la foto." };
  }
}

/* ---------------- Proveedores ---------------- */

export async function saveSupplier(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const numOrNull = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const record = {
    name,
    contact_name: String(formData.get("contact_name") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    lead_time_days: numOrNull(formData.get("lead_time_days")),
    min_order: numOrNull(formData.get("min_order")),
    active: formData.get("active") === "on",
  };
  if (id) {
    const { error } = await supabase.from("suppliers").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("suppliers").insert(record);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}

export async function deleteSupplier(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proveedores");
}

/** Redacta con IA un correo de reposición para un proveedor a partir de las
 *  piezas con stock bajo. El admin lo revisa/copia y lo envía. */
export async function draftRestock(input: {
  supplierName: string;
  contactName?: string | null;
  items: { name: string; ref: string | null; stock: number }[];
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!input.items.length) return { ok: false, error: "No hay piezas que reponer." };

  const list = input.items
    .map(
      (i) =>
        `- ${i.name}${i.ref ? ` (ref. ${i.ref})` : ""} — quedan ${i.stock} uds`
    )
    .join("\n");
  const contact = input.contactName ? ` (contacto: ${input.contactName})` : "";

  const system = `Eres el equipo de compras de Oucy Studios, una marca de joyería. Redactas un correo BREVE, cordial y profesional a un PROVEEDOR para reponer stock (nuevo pedido). Español de España.
- Preséntate como "Oucy Studios". Firma como "Un saludo,\\nEquipo de Oucy Studios".
- Empieza con "Asunto: ..." en la primera línea.
- Pide disponibilidad, precio actualizado y plazo de entrega de las piezas listadas. No inventes cantidades exactas si no se indican; puedes proponer reponer la pieza y preguntar por mínimos.
- Tono humano y directo, sin florituras. Devuelve SOLO el texto del correo (sin comillas ni explicación).`;

  const r = await askText({
    system,
    maxTokens: 700,
    messages: [
      {
        role: "user",
        content: `Proveedor: ${input.supplierName}${contact}.\nPiezas con stock bajo a reponer:\n${list}`,
      },
    ],
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, text: r.data };
}

/* ---------------- Categorías ---------------- */

export async function saveCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const record = { name, slug: slugify(name), sort: Math.round(num(formData.get("sort"))) };
  if (id) await supabase.from("categories").update(record).eq("id", id);
  else await supabase.from("categories").insert(record);
  revalidatePath("/admin/categorias");
  refreshStore();
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categorias");
  refreshStore();
}

export async function moveCategory(id: string, dir: -1 | 1) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("categories").select("sort").eq("id", id).single();
  const sort = (data?.sort as number) ?? 0;
  await supabase.from("categories").update({ sort: sort + dir }).eq("id", id);
  revalidatePath("/admin/categorias");
  refreshStore();
}

/* ---------------- Pedidos ---------------- */

export async function updateOrder(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const base: any = { status: String(formData.get("status") || "pending") };
  // Campos que dependen de la migración 002 → intento por separado.
  const extra = {
    ...base,
    tracking: String(formData.get("tracking") || "") || null,
    note: String(formData.get("note") || "") || null,
  };
  const { error } = await supabase.from("orders").update(extra).eq("id", id);
  if (error) {
    // Si aún no está la migración (tracking), guarda al menos el estado.
    await supabase.from("orders").update(base).eq("id", id);
  }
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}

/* ---------------- Cupones ---------------- */

export async function saveCoupon(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const record = {
    code: String(formData.get("code") || "").trim().toUpperCase(),
    kind: String(formData.get("kind") || "percent"),
    value: num(formData.get("value")),
    min_subtotal: num(formData.get("min_subtotal")),
    active: formData.get("active") === "on",
  };
  if (!record.code) return;
  if (id) await supabase.from("coupons").update(record).eq("id", id);
  else await supabase.from("coupons").insert(record);
  revalidatePath("/admin/cupones");
}

export async function deleteCoupon(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/cupones");
}

/* ---------------- Páginas ---------------- */

export async function savePage(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const record = {
    title,
    slug: String(formData.get("slug") || "").trim() || slugify(title),
    body: String(formData.get("body") || ""),
    published: formData.get("published") === "on",
    sort: Math.round(num(formData.get("sort"))),
  };
  if (id) await supabase.from("pages").update(record).eq("id", id);
  else await supabase.from("pages").insert(record);
  revalidatePath("/admin/paginas");
  redirect("/admin/paginas");
}

export async function deletePage(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("pages").delete().eq("id", id);
  revalidatePath("/admin/paginas");
}

/* ---------------- Ajustes ---------------- */

export async function saveSettings(formData: FormData) {
  const supabase = await requireAdmin();
  const base = {
    shop_name: String(formData.get("shop_name") || "Oucy Studios"),
    tagline: String(formData.get("tagline") || ""),
    announcement: String(formData.get("announcement") || ""),
    prelaunch_enabled: formData.get("prelaunch_enabled") === "on",
    access_code: String(formData.get("access_code") || "oucy2026"),
    free_ship_threshold: num(formData.get("free_ship_threshold")),
    shipping_flat: num(formData.get("shipping_flat")),
  };
  const { error } = await supabase.from("settings").update(base).eq("id", 1);
  if (error) throw new Error(error.message);

  // Contenido (migración 002) — se guarda aparte para no romper si aún no existe.
  const content = {
    instagram_url: String(formData.get("instagram_url") || ""),
    tiktok_url: String(formData.get("tiktok_url") || ""),
    whatsapp_url: String(formData.get("whatsapp_url") || ""),
    contact_email: String(formData.get("contact_email") || ""),
    hero_subtitle: String(formData.get("hero_subtitle") || ""),
    story_text: String(formData.get("story_text") || ""),
  };
  await supabase.from("settings").update(content).eq("id", 1);

  revalidatePath("/admin/ajustes");
  refreshStore();
}

/* ---------------- Soporte / Tickets ---------------- */

export async function replyTicket(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!id || !body) return;
  const { error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: id, author: "admin", body });
  if (error) throw new Error(error.message);
  await supabase
    .from("tickets")
    .update({ status: "answered", last_message_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/soporte");
  revalidatePath(`/admin/soporte/${id}`);
}

export async function updateTicketMeta(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase
    .from("tickets")
    .update({
      status: String(formData.get("status") || "open"),
      priority: String(formData.get("priority") || "normal"),
    })
    .eq("id", id);
  revalidatePath("/admin/soporte");
  revalidatePath(`/admin/soporte/${id}`);
}

export async function deleteTicket(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("tickets").delete().eq("id", id);
  revalidatePath("/admin/soporte");
  redirect("/admin/soporte");
}

/* ---------------- Notificaciones (campanita) ---------------- */

export async function loadNotifications(): Promise<{
  items: import("@/lib/types").Notification[];
  unread: number;
}> {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  const items = (data as import("@/lib/types").Notification[]) ?? [];
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);
  return { items, unread: count ?? 0 };
}

export async function markNotificationRead(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

/* ---------------- Bóveda de contraseñas ---------------- */

export async function saveVaultEntry(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const record = {
    title,
    url: String(formData.get("url") || "").trim() || null,
    username: String(formData.get("username") || "").trim() || null,
    secret_enc: encryptSecret(String(formData.get("password") || "")),
    notes: String(formData.get("notes") || "").trim() || null,
  };
  if (id) {
    const { error } = await supabase.from("vault_entries").update(record).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("vault_entries").insert(record);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/vault");
}

export async function deleteVaultEntry(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("vault_entries").delete().eq("id", id);
  revalidatePath("/admin/vault");
}

export async function markAllNotificationsRead() {
  const supabase = await requireAdmin();
  await supabase.from("notifications").update({ read: true }).eq("read", false);
}

/* ---------------- Reseñas ---------------- */

export async function setReviewApproved(id: string, approved: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("reviews").update({ approved }).eq("id", id);
  revalidatePath("/admin/resenas");
  refreshStore();
}

export async function deleteReview(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("reviews").delete().eq("id", id);
  revalidatePath("/admin/resenas");
  refreshStore();
}
