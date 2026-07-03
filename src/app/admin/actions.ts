"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { encryptSecret } from "@/lib/crypto";
import {
  aiConfigured,
  askJSON,
  askText,
  imageBlock,
  imageBlockFromBuffer,
  BRAND_RULES,
  type AiImageBlock,
} from "@/lib/ai";
import {
  submitReflectionEdit,
  checkReflectionEdit,
  segmentJewelry,
  imageEditConfigured,
  type QueueTicket,
} from "@/lib/image-edit";
import { pixelDiffStats, isNoChange } from "@/lib/image-diff";
import { getStoreSnapshot } from "@/lib/admin-data";

async function requireAdmin() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  // Rol de verdad, no solo sesión: un cliente logueado NO debe poder invocar
  // estas acciones (las de IA gastan crédito aunque RLS proteja los datos).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("No autorizado");
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
    // Sin procesar: solo se sube el original si es un formato apto para web.
    // (Un HEIC de iPhone sin convertir no se vería en la tienda ni lo puede
    // leer la IA de visión.)
    const webSafe = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!webSafe.includes(contentType)) {
      throw new Error(
        "Formato de imagen no compatible. Exporta la foto como JPG o PNG y vuelve a subirla.",
      );
    }
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

/* --- Auditoría por CHECKLIST (anti-ruido) ---------------------------------
 * Antes se pedían números 0–100 libres a un LLM de visión: demasiado ruidoso
 * (dio fidelidad 90 a una pieza idealizada y reflejo 35 a una sin tocar).
 * Ahora el auditor responde CATEGORÍAS cerradas y los números, el veredicto
 * "publicable" y "engañosa" se calculan EN CÓDIGO. Se lanzan DOS auditores en
 * paralelo con lentes distintas (reflejos / fidelidad) y se fusionan de forma
 * PESIMISTA (por campo, gana el peor). ------------------------------------ */

const AUDIT_ENUMS = {
  person_reflection: ["none", "faint", "clear"],
  room_reflection: ["none", "faint", "clear"],
  silhouette: ["identical", "minor_change", "changed"],
  surface_details: ["preserved", "partially_lost", "lost"],
  metal_finish: ["same", "slightly_duller", "matte_or_dull"],
  metal_color: ["same", "shifted"],
  fastening_parts: ["same", "changed_or_missing"],
  scene: ["same", "slightly_changed", "changed"],
} as const;

type AuditFields = {
  [K in keyof typeof AUDIT_ENUMS]: (typeof AUDIT_ENUMS)[K][number];
} & {
  elements_added_or_removed: boolean;
  note_es: string;
  feedback_en: string;
};

/** Normaliza un valor del checklist; desconocido → opción prudente (índice 1),
 *  que bloquea "publicable" sin envenenar el resto (falla seguro). */
function normEnum<K extends keyof typeof AUDIT_ENUMS>(
  key: K,
  v: unknown,
): AuditFields[K] {
  const opts = AUDIT_ENUMS[key] as readonly string[];
  const s = String(v ?? "").toLowerCase().trim();
  if (opts.includes(s)) return s as AuditFields[K];
  return opts[Math.min(1, opts.length - 1)] as AuditFields[K];
}

function worseOf<K extends keyof typeof AUDIT_ENUMS>(
  key: K,
  a: AuditFields[K],
  b: AuditFields[K],
): AuditFields[K] {
  const opts = AUDIT_ENUMS[key] as readonly string[];
  return opts.indexOf(a) >= opts.indexOf(b) ? a : b;
}

async function auditEditOnce(
  originalImg: AiImageBlock,
  editedImg: AiImageBlock,
  persona: string,
  order: "orig-first" | "edited-first" = "orig-first",
): Promise<{ ok: true; data: AuditFields } | { ok: false; error: string }> {
  const system = `${BRAND_RULES}

${persona}

Te doy DOS fotos de la MISMA joya de metal pulido tipo espejo: la ORIGINAL y una EDITADA por IA. El objetivo legítimo de la edición era UNO SOLO: que el metal refleje un estudio blanco limpio en vez del fotógrafo y su habitación. Cualquier otro cambio en el producto sería publicidad engañosa.

CLAVES PARA JUZGAR BIEN (importantes):
- El reflejo cambia el "dibujo" que se ve SOBRE el metal; que ese dibujo sea distinto NO es perder textura. Juzga forma/textura por: el CONTORNO y proporciones de cada pieza, las líneas de faceta o martelé visibles en los BORDES, bollos o planos físicos, y los cierres/postes. Si las piezas se ven más HINCHADAS, redondeadas, regordetas o "más perfectas" que en la original → silhouette mínimo "minor_change" (y "changed" si es evidente).
- El tono DORADO cálido propio del metal es correcto y NO es "habitación". "Reflejo de habitación" = formas reconocibles del entorno o manchas oscuras cálidas/oliva/beige/marrones que claramente son el entorno reflejado. REGLA PRÁCTICA: el oro limpio reflejando estudio blanco se ve como tono dorado CLARO y uniforme con brillos blancos; si en la EDITADA quedan parches notablemente MÁS OSCUROS de tono cálido/oliva/marrón sobre el metal (que no sean la línea de contacto/sombra propia de la pieza), cuéntalos como habitación reflejada: mínimo "faint".
- MUY IMPORTANTE: una pieza pulida reflejando un estudio BLANCO se ve GLOBALMENTE más clara y luminosa que la misma pieza reflejando una habitación oscura — ese aclarado general es EL OBJETIVO de la edición y NO cuenta como "metal_color shifted" ni como cambio de acabado. Marca "shifted" solo si el TONO propio del metal ha virado (p. ej. de dorado a pálido/verdoso/rosado/gris), y "matte_or_dull" solo si ha perdido los brillos especulares (ya no parece espejo).
- "faint" = cualquier rastro tenue o dudoso (ante la duda, marca faint, no none); "clear" = se reconoce sin esfuerzo.
- Examina CADA superficie metálica con lupa, zona a zona, comparando ambas fotos.

Rellena este checklist EXACTO. Devuelve SOLO el JSON, sin texto extra:
{
 "person_reflection": "none|faint|clear",
 "room_reflection": "none|faint|clear",
 "silhouette": "identical|minor_change|changed",
 "surface_details": "preserved|partially_lost|lost",
 "metal_finish": "same|slightly_duller|matte_or_dull",
 "metal_color": "same|shifted",
 "fastening_parts": "same|changed_or_missing",
 "scene": "same|slightly_changed|changed",
 "elements_added_or_removed": false,
 "note_es": "una frase breve en español para el admin",
 "feedback_en": "one short instruction in ENGLISH for the image editor's NEXT attempt fixing what failed, or empty if nothing failed. IMPORTANT: the editor will re-edit the ORIGINAL photo from scratch (not the edited one), so phrase it about the original (e.g. 'the reflection on the left drop must become clean white; keep the gold bright and glossy')"
}
Significado: person_reflection = ¿en la EDITADA se ve persona/cara/brazos/manos/móvil reflejados en el metal? · room_reflection = ¿se ve la habitación/entorno reflejado (paredes, muebles, ventanas, manchas cálidas del entorno)? · silhouette = contorno/proporciones de cada pieza vs original · surface_details = facetas/martelé/bollos FÍSICOS conservados (según las claves de arriba) · metal_finish = ¿sigue siendo espejo brillante o se ha apagado/mateado? · metal_color = ¿el tono del oro es el mismo o ha virado? Cuenta como "shifted" también si sale notablemente más PÁLIDO, LAVADO, desaturado o blanquecino/plateado que el oro original — el dorado debe seguir siendo rico y cálido · fastening_parts = postes/cierres/mariposas iguales · scene = ¿es la MISMA fotografía? Compara con lupa el ÁNGULO de cámara, el encuadre, la posición/orientación del cojín, sus arrugas y la sombra de la pieza. Si el encuadre/ángulo ha cambiado, el cojín está girado o recolocado, la composición es otra, o la imagen parece re-escenificada o un render sintético → "changed" (NO publicable). El aclarado/neutralizado del color ambiente (cojín y fondo más blancos, mismas arrugas pero más claras) SÍ es el objetivo y NO penaliza · elements_added_or_removed = ¿se añadió o quitó algo (gemas, piezas, objetos)?`;

  const blocks =
    order === "orig-first"
      ? [
          { type: "text" as const, text: "ORIGINAL:" },
          originalImg,
          { type: "text" as const, text: "EDITADA:" },
          editedImg,
        ]
      : [
          { type: "text" as const, text: "EDITADA:" },
          editedImg,
          { type: "text" as const, text: "ORIGINAL:" },
          originalImg,
        ];
  const r = await askJSON<Record<string, unknown>>({
    system,
    maxTokens: 700,
    messages: [
      {
        role: "user",
        content: [...blocks, { type: "text", text: "Rellena el checklist JSON." }],
      },
    ],
  });
  if (!r.ok) return r;
  const d = r.data;
  // Booleano robusto: los LLM a veces devuelven "true"/"yes" como string.
  const rawBool = String(d.elements_added_or_removed ?? "").toLowerCase().trim();
  const elements =
    d.elements_added_or_removed === true ||
    rawBool === "true" ||
    rawBool === "yes" ||
    rawBool === "1";
  return {
    ok: true,
    data: {
      person_reflection: normEnum("person_reflection", d.person_reflection),
      room_reflection: normEnum("room_reflection", d.room_reflection),
      silhouette: normEnum("silhouette", d.silhouette),
      surface_details: normEnum("surface_details", d.surface_details),
      metal_finish: normEnum("metal_finish", d.metal_finish),
      metal_color: normEnum("metal_color", d.metal_color),
      fastening_parts: normEnum("fastening_parts", d.fastening_parts),
      scene: normEnum("scene", d.scene),
      elements_added_or_removed: elements,
      note_es: String(d.note_es ?? "").slice(0, 200),
      feedback_en: String(d.feedback_en ?? "").slice(0, 400),
    },
  };
}

function mergeAudits(a: AuditFields, b: AuditFields): AuditFields {
  return {
    person_reflection: worseOf("person_reflection", a.person_reflection, b.person_reflection),
    room_reflection: worseOf("room_reflection", a.room_reflection, b.room_reflection),
    silhouette: worseOf("silhouette", a.silhouette, b.silhouette),
    surface_details: worseOf("surface_details", a.surface_details, b.surface_details),
    metal_finish: worseOf("metal_finish", a.metal_finish, b.metal_finish),
    metal_color: worseOf("metal_color", a.metal_color, b.metal_color),
    fastening_parts: worseOf("fastening_parts", a.fastening_parts, b.fastening_parts),
    scene: worseOf("scene", a.scene, b.scene),
    elements_added_or_removed: a.elements_added_or_removed || b.elements_added_or_removed,
    note_es: [a.note_es, b.note_es].filter(Boolean).join(" · ").slice(0, 300),
    feedback_en: [a.feedback_en, b.feedback_en].filter(Boolean).join(" Also: ").slice(0, 500),
  };
}

interface AuditResult {
  publishable: boolean;
  score: number;
  fidelity: number;
  reflectionRemoved: number;
  changes: string[];
  note: string;
  feedback: string;
}

/** Números y veredicto calculados en código a partir del checklist. */
function scoreAudit(f: AuditFields): AuditResult {
  const refl =
    f.person_reflection === "clear" || f.room_reflection === "clear"
      ? 10
      : f.person_reflection === "faint"
        ? 35
        : f.room_reflection === "faint"
          ? 60
          : 100;

  let fid = 100;
  if (f.silhouette === "minor_change") fid -= 20;
  else if (f.silhouette === "changed") fid -= 55;
  if (f.surface_details === "partially_lost") fid -= 20;
  else if (f.surface_details === "lost") fid -= 50;
  if (f.metal_finish === "slightly_duller") fid -= 12;
  else if (f.metal_finish === "matte_or_dull") fid -= 45;
  if (f.metal_color === "shifted") fid -= 40;
  if (f.fastening_parts === "changed_or_missing") fid -= 35;
  if (f.scene === "slightly_changed") fid -= 5;
  else if (f.scene === "changed") fid -= 20;
  if (f.elements_added_or_removed) fid -= 60;
  fid = Math.max(0, fid);

  const misleading =
    f.silhouette === "changed" ||
    f.surface_details === "lost" ||
    f.metal_finish === "matte_or_dull" ||
    f.metal_color === "shifted" ||
    f.fastening_parts === "changed_or_missing" ||
    f.elements_added_or_removed;

  const publishable =
    !misleading &&
    f.person_reflection === "none" &&
    f.room_reflection === "none" &&
    f.silhouette === "identical" &&
    f.surface_details === "preserved" &&
    f.metal_finish === "same" &&
    f.metal_color === "same" &&
    f.fastening_parts === "same" &&
    f.scene !== "changed";

  // Cualquier distorsión del producto (aunque no llegue a "engañosa") capa la
  // puntuación: el "mejor intento" nunca debe preferir una pieza idealizada
  // sobre una honesta con algo de reflejo. Cero-engaño manda sobre estética.
  const distorted =
    f.silhouette !== "identical" ||
    f.surface_details !== "preserved" ||
    f.metal_finish !== "same" ||
    f.metal_color !== "same" ||
    f.fastening_parts !== "same";
  const score = misleading
    ? Math.min(30, fid)
    : Math.min(
        distorted ? 55 : 100,
        Math.round(0.35 * fid + 0.65 * refl),
      );

  const changes: string[] = [];
  if (f.person_reflection !== "none")
    changes.push(
      f.person_reflection === "clear"
        ? "Se sigue viendo a la persona/móvil reflejada"
        : "Queda un rastro tenue de la persona reflejada",
    );
  if (f.room_reflection !== "none")
    changes.push(
      f.room_reflection === "clear"
        ? "Se sigue viendo la habitación reflejada"
        : "Queda un rastro tenue de la habitación reflejada",
    );
  if (f.silhouette !== "identical") changes.push("La forma/silueta de la pieza ha cambiado");
  if (f.surface_details !== "preserved")
    changes.push("Se han perdido detalles reales de la superficie (facetas/martelé)");
  if (f.metal_finish !== "same") changes.push("El acabado se ha apagado (menos espejo)");
  if (f.metal_color !== "same") changes.push("El tono del metal ha virado");
  if (f.fastening_parts !== "same") changes.push("Los cierres/postes han cambiado o faltan");
  if (f.scene === "changed") changes.push("La escena (cojín/sombras/encuadre) ha cambiado");
  if (f.elements_added_or_removed) changes.push("Se han añadido o quitado elementos");

  return {
    publishable,
    score,
    fidelity: fid,
    reflectionRemoved: refl,
    changes,
    note: f.note_es,
    feedback: f.feedback_en,
  };
}

/** Auditoría doble en paralelo (inspector de reflejos + inspector de
 *  fidelidad), fusión pesimista y puntuación en código. Si hay buffers en
 *  memoria se pasan en base64 (evita que la API re-descargue las URLs). */
async function auditEdit(
  originalUrl: string,
  editedUrl: string,
  bufs?: {
    orig?: { buf: Buffer; type: string } | null;
    edited?: { buf: Buffer; type: string } | null;
  },
): Promise<{ ok: true; data: AuditResult } | { ok: false; error: string }> {
  const MAX_B64 = 3_500_000; // margen bajo el límite de ~5 MB/imagen de la API
  const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const origImg =
    bufs?.orig && bufs.orig.buf.length < MAX_B64 && okTypes.includes(bufs.orig.type)
      ? imageBlockFromBuffer(bufs.orig.buf, bufs.orig.type)
      : imageBlock(originalUrl);
  const editedImg =
    bufs?.edited && bufs.edited.buf.length < MAX_B64 && okTypes.includes(bufs.edited.type)
      ? imageBlockFromBuffer(bufs.edited.buf, bufs.edited.type)
      : imageBlock(editedUrl);
  const [a, b] = await Promise.all([
    auditEditOnce(
      origImg,
      editedImg,
      "Eres un INSPECTOR DE REFLEJOS obsesivo de Oucy Studios: tu misión principal es encontrar cualquier rastro del fotógrafo, de personas o de la habitación reflejado en el metal (aunque rellenas el checklist completo).",
      "orig-first",
    ),
    auditEditOnce(
      origImg,
      editedImg,
      "Eres un INSPECTOR DE FIDELIDAD DE PRODUCTO obsesivo de Oucy Studios: tu misión principal es detectar si la pieza editada ya no es idéntica a la real — forma, textura física, acabado, color, cierres, escena (aunque rellenas el checklist completo).",
      "edited-first",
    ),
  ]);
  if (!a.ok && !b.ok) return { ok: false, error: a.error };
  const fields =
    a.ok && b.ok ? mergeAudits(a.data, b.data) : a.ok ? a.data : (b as { ok: true; data: AuditFields }).data;
  return { ok: true, data: scoreAudit(fields) };
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

const BOLDER_FEEDBACK =
  "The previous attempt changed nothing — the person and room are still reflected. Repaint the metal's reflections completely this time.";

function betterOf(a: CleanupBest | null, b: CleanupBest): CleanupBest {
  if (!a) return b;
  return b.score > a.score ? b : a;
}

/** [LEGADO] Stub para pestañas que aún tengan cargada la versión anterior. */
export async function cleanupPhoto(): Promise<{ ok: false; error: string }> {
  await requireAdmin();
  return {
    ok: false,
    error: "La app se ha actualizado. Recarga la página para usar el nuevo editor.",
  };
}

/** Paso 1: encarga la edición del METAL a la cola de fal y devuelve el ticket
 *  al instante. El feedback y la presión salen del mejor intento previo. */
export async function startCleanup(
  imageUrl: string,
  prevBest?: CleanupBest | null,
  nextHint?: string,
): Promise<{ ok: true; ticket: QueueTicket } | { ok: false; error: string }> {
  await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sin imagen." };
  if (!imageEditConfigured()) {
    return {
      ok: false,
      error:
        "Falta FAL_KEY en el servidor. Créala en fal.ai y añádela en Vercel para activar el borrado de reflejos.",
    };
  }
  // Corto a propósito: los prompts largos paralizan al editor.
  const extra = String(nextHint || prevBest?.feedback || "").slice(0, 300);
  const prevRefl = prevBest?.reflectionRemoved;
  const boldness =
    prevRefl == null ? 0 : prevRefl <= 35 ? 2 : prevRefl <= 60 ? 1 : 0;
  // Motor: el rápido por defecto (cola de segundos; la composición protege la
  // escena). Se ESCALA al fuerte solo si el rápido se mostró tímido — su cola
  // puede tardar minutos, y para eso está la reanudación de ticket.
  const engine = boldness >= 2 ? "strong" : "fast";
  const sub = await submitReflectionEdit(
    imageUrl,
    { extra: extra || undefined, boldness },
    engine,
  );
  if (!sub.ok) return sub;
  return { ok: true, ticket: sub.data };
}

/* --- Utilidades del pipeline de composición (receta validada con test) ------ */

const CANVAS = 1400;

async function downloadBuf(url: string, ms: number): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

async function normalizeCanvas(buf: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(buf)
    .rotate()
    .resize(CANVAS, CANVAS, { fit: "cover", position: "centre" })
    .webp({ quality: 88 })
    .toBuffer();
}

/** Compone el METAL editado sobre la foto ORIGINAL usando la máscara de la
 *  joya (SAM 3): fuera del metal, la escena es la original píxel a píxel —
 *  fidelidad matemática, no prometida por prompt. Devuelve null si la máscara
 *  no es sensata (cobertura <0,5 % o >45 % del encuadre). */
async function compositeJewelry(
  origBuf: Buffer,
  editedBuf: Buffer,
  maskBufs: Buffer[],
): Promise<Buffer | null> {
  const sharp = (await import("sharp")).default;
  const greys = await Promise.all(
    maskBufs.map((m) =>
      sharp(m).resize(CANVAS, CANVAS, { fit: "fill" }).greyscale().png().toBuffer(),
    ),
  );
  let union = greys[0];
  if (greys.length > 1) {
    union = await sharp(greys[0])
      .composite(greys.slice(1).map((input: Buffer) => ({ input, blend: "lighten" as const })))
      .png()
      .toBuffer();
  }
  const unionRaw = await sharp(union).greyscale().toColourspace("b-w").raw().toBuffer();
  let on = 0;
  for (let i = 0; i < unionRaw.length; i++) if (unionRaw[i] > 128) on++;
  const coverage = on / unionRaw.length;
  if (coverage < 0.005 || coverage > 0.45) return null;

  // Expansión morfológica (+3 px por lado) + feather: cubre el filo del metal
  // original (reflejo viejo) aunque la máscara venga al ras o la pieza se
  // desplace 1-2 px en la edición. OJO semántica de sharp/libvips: erode()
  // EXPANDE el blanco y dilate() lo encoge (verificado con test).
  const featherRaw = await sharp(union)
    .greyscale()
    .erode(3)
    .blur(1.5)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const editedRGB = await sharp(editedBuf).removeAlpha().raw().toBuffer();
  const cutRaw = await sharp(editedRGB, { raw: { width: CANVAS, height: CANVAS, channels: 3 } })
    .joinChannel(featherRaw, { raw: { width: CANVAS, height: CANVAS, channels: 1 } })
    .raw()
    .toBuffer();
  return sharp(origBuf)
    .composite([{ input: cutRaw, raw: { width: CANVAS, height: CANVAS, channels: 4 } }])
    .webp({ quality: 88 })
    .toBuffer();
}

/** «Cubo blanco» determinista (sin IA, no puede re-escenificar): balance de
 *  blancos por canal calculado del marco exterior, con topes anti-quemado. */
async function whiteAmbient(buf: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const s = 96;
  const raw = await sharp(buf).resize(s, s, { fit: "fill" }).removeAlpha().raw().toBuffer();
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  const m = Math.round(s * 0.12);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      if (x < m || x >= s - m || y < m || y >= s - m) {
        const i = (y * s + x) * 3;
        r += raw[i];
        g += raw[i + 1];
        b += raw[i + 2];
        n++;
      }
    }
  }
  r /= n;
  g /= n;
  b /= n;
  const target = 234;
  const cl = (v: number) => Math.max(0.94, Math.min(1.22, target / Math.max(1, v)));
  const gr = cl(r),
    gg = cl(g),
    gb = cl(b);
  if (Math.abs(gr - 1) < 0.02 && Math.abs(gg - 1) < 0.02 && Math.abs(gb - 1) < 0.02) {
    return buf;
  }
  return sharp(buf).linear([gr, gg, gb], [0, 0, 0]).webp({ quality: 88 }).toBuffer();
}

async function storeFinal(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  buf: Buffer,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const path = `products/clean-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "image/webp", upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Paso 2 (repetible desde el cliente): consulta el ticket. Pendiente →
 *  {pending:true}. Lista → descarga editada + original + máscara SAM 3 en
 *  paralelo, COMPONE el metal editado sobre la original, aplica el «cubo
 *  blanco» determinista, guarda, y audita (doble) contra la ORIGINAL. */
export async function pollCleanup(
  imageUrl: string,
  ticket: QueueTicket,
  prevBest?: CleanupBest | null,
): Promise<
  | { ok: true; pending: true }
  | (CleanupBest & {
      ok: true;
      pending: false;
      attempts: number;
      lastFeedback: string;
      round: { score: number; fidelity?: number; reflectionRemoved?: number };
    })
  | { ok: false; error: string }
> {
  const supabase = await requireAdmin();
  if (!imageUrl) return { ok: false, error: "Sin imagen." };
  const best: CleanupBest | null = prevBest ?? null;

  const chk = await checkReflectionEdit(ticket);
  if (!chk.ok) return { ok: false, error: chk.error };
  if (!chk.data.done) return { ok: true, pending: true };

  // Descargas en paralelo: editada (fal), original y máscara de la joya (SAM 3).
  const [editedRawBuf, origRawBuf, masksRes] = await Promise.all([
    downloadBuf(chk.data.imageUrl!, 20_000),
    downloadBuf(imageUrl, 15_000),
    segmentJewelry(imageUrl),
  ]);
  if (!editedRawBuf) {
    return { ok: false, error: "No se pudo descargar la imagen editada." };
  }
  let editedBuf: Buffer;
  try {
    editedBuf = await normalizeCanvas(editedRawBuf);
  } catch {
    editedBuf = editedRawBuf;
  }
  let originalBuf: Buffer | null = null;
  if (origRawBuf) {
    try {
      originalBuf = await normalizeCanvas(origRawBuf);
    } catch {
      originalBuf = null; // sin canvas normalizado no hay composición fiable
    }
  }

  // Gate (sin IA), ANTES de componer: ¿el editor devolvió lo mismo? → presión.
  if (originalBuf) {
    try {
      const diff = await pixelDiffStats(originalBuf, editedBuf);
      if (isNoChange(diff)) {
        const up = await storeFinal(supabase, editedBuf);
        const candidate: CleanupBest = {
          cleanedUrl: up.ok ? up.url : imageUrl,
          safe: false,
          score: 5,
          fidelity: 100,
          reflectionRemoved: 0,
          changes: ["La edición no cambió nada visible: el reflejo sigue igual."],
          note: "El editor devolvió la imagen casi idéntica; la siguiente ronda irá con más presión.",
          feedback: BOLDER_FEEDBACK,
        };
        return {
          ok: true,
          pending: false,
          ...betterOf(best, candidate),
          attempts: 1,
          lastFeedback: BOLDER_FEEDBACK,
          round: { score: 5, fidelity: 100, reflectionRemoved: 0 },
        };
      }
    } catch {
      /* gate no disponible */
    }
  }

  // COMPOSICIÓN: solo el metal viene de la IA; la escena es la original.
  let finalBuf = editedBuf;
  let composed = false;
  if (originalBuf && masksRes.ok) {
    try {
      const maskBufs = (
        await Promise.all(masksRes.data.slice(0, 4).map((u) => downloadBuf(u, 10_000)))
      ).filter((b): b is Buffer => !!b);
      if (maskBufs.length) {
        // El «cubo blanco» se aplica SOLO a la escena (base original), ANTES de
        // pegar la joya: así el oro conserva exactamente el tono que pintó el
        // editor y no palidece con el aclarado del ambiente.
        let base = originalBuf;
        try {
          base = await whiteAmbient(originalBuf);
        } catch {
          /* escena sin aclarar */
        }
        const comp = await compositeJewelry(base, editedBuf, maskBufs);
        if (comp) {
          finalBuf = comp;
          composed = true;
        }
      }
    } catch {
      /* sin composición: se usa la edición completa */
    }
  }

  // Sin composición: ambiente «cubo blanco» sobre la imagen completa.
  if (!composed) {
    try {
      finalBuf = await whiteAmbient(finalBuf);
    } catch {
      /* sin ajuste de ambiente */
    }
  }

  const up = await storeFinal(supabase, finalBuf);
  if (!up.ok) return { ok: false, error: up.error };
  const cleanedUrl = up.url;

  // Auditoría doble contra la ORIGINAL (reintento único ante fallo transitorio).
  const auditBufs = {
    orig: originalBuf ? { buf: originalBuf, type: "image/webp" } : null,
    edited: { buf: finalBuf, type: "image/webp" },
  };
  let audit = await auditEdit(imageUrl, cleanedUrl, auditBufs);
  if (!audit.ok && aiConfigured()) {
    await new Promise((r) => setTimeout(r, 1200));
    audit = await auditEdit(imageUrl, cleanedUrl, auditBufs);
  }
  if (!audit.ok) {
    const cause = aiConfigured()
      ? `La auditoría falló en este intento (${audit.error.slice(0, 140)}).`
      : "No se pudo auditar (falta ANTHROPIC_API_KEY en Vercel); compárala tú antes de usarla.";
    const candidate: CleanupBest = {
      cleanedUrl,
      safe: false,
      score: 0,
      changes: [cause],
      note: cause,
      feedback: "",
    };
    return {
      ok: true,
      pending: false,
      ...betterOf(best, candidate),
      note: cause,
      attempts: 1,
      lastFeedback: "",
      round: { score: 0 },
    };
  }

  const d = audit.data;
  const noCompositeNote = composed
    ? ""
    : " · Sin máscara de composición en esta ronda: revisa también el fondo.";
  const candidate: CleanupBest = {
    cleanedUrl,
    safe: d.publishable,
    score: d.score,
    fidelity: d.fidelity,
    reflectionRemoved: d.reflectionRemoved,
    changes: d.changes,
    note: (d.note || "") + noCompositeNote,
    feedback: d.feedback,
  };
  const result = candidate.safe ? candidate : betterOf(best, candidate);

  const note = result.safe
    ? result.note || "Publicable: producto fiel y reflejo limpio."
    : (result.reflectionRemoved ?? 0) < 60
      ? result.note ||
        "La IA aún no ha quitado bien el reflejo. Sigue probando o usa la foto original."
      : result.changes.length > 0
        ? "Casi: reflejo mejor, pero la auditoría aún ve diferencias. Sigue probando."
        : "Muy cerca. Sigue probando para afinar.";

  return {
    ok: true,
    pending: false,
    ...result,
    note,
    attempts: 1,
    lastFeedback: d.feedback || "",
    round: { score: d.score, fidelity: d.fidelity, reflectionRemoved: d.reflectionRemoved },
  };
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
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

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
    const resp = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
    if (!resp.ok) return { ok: false, error: `No se pudo leer la imagen (${resp.status}).` };
    const inBuf = Buffer.from(await resp.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const out = await sharp(inBuf)
      .rotate()
      .resize(1400, 1400, { fit: "cover", position: "centre" })
      // Ajustes GLOBALES (no cambian el producto): un poco más de luz, algo de
      // contraste, un toque de saturación y nitidez. Suaves para no quemar los
      // blancos (cojín/fondo suelen estar ya muy claros).
      .modulate({ brightness: 1.04, saturation: 1.04 })
      .linear(1.05, -6)
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
