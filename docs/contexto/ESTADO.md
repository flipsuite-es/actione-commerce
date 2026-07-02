# ESTADO — estado técnico completo

> Mantener actualizado en cada sesión. Última actualización: sesión de construcción inicial.

## Resumen
Oucy Studios: tienda de joyería (acero dorado) construida con Next.js 14 + Supabase,
desplegada en Vercel, en **pre-lanzamiento** (muro con código). Marca, tienda y
backoffice completos y funcionando.

## Repositorio
- GitHub: `flipsuite-es/actione-commerce`
- Rama de trabajo: `main` (única rama; es la de producción en Vercel). Unificación hecha el 2026-07-02: las ramas antiguas `claude/ecommerce-low-investment-model-ru62lb` y `claude/oucy-studios-context-review-vef7e0` se consolidaron en `main` (historial lineal, sin pérdidas).
- La **aplicación Next.js está en la RAÍZ** del repo (se movió desde `web/` para que Vercel la construyera sin "Root Directory").
- Documentación de estrategia/negocio: `docs/00-*.md … docs/19-*.md` + `docs/despliegue-app.md`.

## Stack
- Next.js 14.2.35 (App Router, TypeScript), Tailwind, Supabase JS + @supabase/ssr.
- Fuentes: Cormorant Garamond (serif display) + Jost (sans), vía Google Fonts.
- Sin dependencias pesadas; animaciones con CSS + IntersectionObserver.

## Supabase
- Cuenta: `flipsuite.gestion@gmail.com` · Organización: **Oucy Studios** (plan Free, 1 proyecto NANO).
- Proyecto: ref **`jedyummyygniixuyzbck`** · URL: `https://jedyummyygniixuyzbck.supabase.co` · Región eu-west.
- Claves: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pública) configuradas en Vercel. **No** se usa service_role (el backoffice escribe con la sesión del admin vía RLS).
- Esquema aplicado: `supabase/schema.sql` (categories, products, orders, settings + RLS + bucket `product-images`).
- **Migración 002 APLICADA** (2026-07-02): `supabase/migrations/002_backoffice.sql`. Añadidas 6 columnas de contenido a `settings` (instagram_url, tiktok_url, whatsapp_url, contact_email, hero_subtitle, story_text), 3 columnas a `orders` (tracking, discount, coupon_code), y las tablas `coupons` y `pages` (con RLS + 4 páginas iniciales: envios, devoluciones, cuidado, privacidad). Ya funcionan cupones, páginas editables, contenido/redes editables y seguimiento de pedidos.
- **Migración 008 APLICADA** (2026-07-02): `supabase/migrations/008_vault.sql` — **gestor de contraseñas** del backoffice (`/admin/vault`). Tabla `vault_entries` (RLS solo `is_admin`). La contraseña se cifra en la app con **AES-256-GCM** (`src/lib/crypto.ts`) antes de guardarse; la DB solo ve el texto cifrado. Clave desde env **`VAULT_KEY`** (recomendado configurarla en Vercel; si no, usa un pepper de la app). Incluye **generador** de contraseñas (cliente, `crypto.getRandomValues`).
- **Migración 007 APLICADA** (2026-07-02): `supabase/migrations/007_cuentas.sql` — **cuentas de cliente**. Tabla `profiles` (1:1 con `auth.users`, con `role` customer/admin), trigger `handle_new_user` de alta, `is_admin()` y `update_my_profile()` (SECURITY DEFINER). **IMPORTANTE:** se reescribieron TODAS las políticas que daban acceso total a cualquier `authenticated` para exigir `is_admin()` (productos, categorías, pedidos, ajustes, cupones, páginas, tickets, notificaciones, reseñas, suscriptores y storage) — si no, los clientes heredarían el backoffice. `orders.user_id` + política de lectura del cliente (sus pedidos por user_id o email). El admin (`abraham.e.c.2004@gmail.com`) tiene role='admin'. El panel `/admin` ahora exige role admin (si no, redirige a `/cuenta`).
- **Migración 006 APLICADA** (2026-07-02): `supabase/migrations/006_seguimiento_pedido.sql` — función SECURITY DEFINER `order_status(ref, email)` (ref = 8 primeros del id) para que el cliente consulte el estado de su pedido en `/pedido`. La confirmación del checkout muestra la referencia.
- **Migración 005 APLICADA** (2026-07-02): `supabase/migrations/005_resenas_suscriptores.sql` — **reseñas** (`reviews`: product_id, name, rating 1-5, body, approved; RLS público lee solo aprobadas; función SECURITY DEFINER `submit_review` fuerza approved=false; trigger genera notificación `review_new`) y **suscriptores** (`subscribers`: email único, source; alta pública vía `subscribe_email` con dedupe; solo admin lee).
- **Migración 004 APLICADA** (2026-07-02): `supabase/migrations/004_notificaciones.sql` — **notificaciones internas**. Tabla `notifications` (kind ticket_new/ticket_reply/order_new, title, body, url, read) con RLS solo-admin. Triggers `after insert` en `tickets`, `ticket_messages` (solo respuestas de cliente, no la apertura) y `orders` insertan avisos vía funciones SECURITY DEFINER. La campanita del panel los muestra (contador de no leídos, sondeo cada 30 s, marcar leídas). Sin correos externos.
- **Migración 003 APLICADA** (2026-07-02): `supabase/migrations/003_soporte.sql` — **sistema de tickets de soporte**. Tablas `tickets` (ref único OUCY-XXXXXX, name, email, subject, order_ref, status open/pending/answered/closed, priority) y `ticket_messages` (author customer/admin, body). El público NO lee/escribe directo: opera vía 3 funciones **SECURITY DEFINER** (`open_ticket`, `ticket_thread`, `reply_ticket`) que validan ref+email y tienen `search_path` fijado; el admin autenticado gestiona todo por RLS. Advisors: los WARN `anon/authenticated_security_definer_function_executable` sobre esas 3 funciones son **intencionales** (el cliente anónimo debe poder llamarlas).
  - Verificación advisors (seguridad): solo WARN esperados — las políticas `*_admin_all ... using(true)` para el admin autenticado son **por diseño** (ver DECISIONES: el admin gestiona todo vía su sesión RLS); `function_search_path_mutable` en `touch_updated_at` y `auth_leaked_password_protection` son WARN menores no bloqueantes.
- Usuario admin: creado por el usuario en Authentication (email + contraseña propios). Entra en `/admin`.
- Bucket de imágenes: `product-images` (público).
- **Procesado automático de fotos al subir** (`uploadImage` en `admin/actions.ts`, con `sharp`): endereza (EXIF),
  recorta **cuadrado 1400×1400** y optimiza a **WebP** (q82). Si `sharp` fallara, sube el original. `sharp` es
  dependencia real (package.json) y va en `experimental.serverComponentsExternalPackages` para Vercel. NO hace
  recorte de fondo (eso requeriría IA/servicio de pago); el fondo lo pone la foto original.
- **Sugerencias de ficha con IA (visión)** (`suggestProduct` en `admin/actions.ts` + `ProductForm.tsx`): al subir la
  **primera** foto de un producto (si el nombre está vacío) se llama a Claude visión (`claude-opus-4-8`) para proponer
  **nombre, descripción, material, categoría y precio** (precio de venta orientativo + «precio antes» opcional); los
  campos quedan controlados y editables (el admin revisa y guarda). También hay botón manual «✨ Sugerir ficha con IA».
  La llamada es `fetch` directo a la API de Anthropic (sin SDK nuevo) con un *system prompt* que impone las reglas de
  marca: material siempre "Acero inoxidable", color plata/dorado como acabado (NUNCA oro/baño/chapado/plata de ley), sin
  "hipoalergénico". **Requiere `ANTHROPIC_API_KEY` en Vercel**; si falta, devuelve un aviso y la ficha se rellena a mano
  igual que antes (no bloquea).
- **Coste + PVP realista** (migración **012**, columna `products.cost`): la ficha guarda el **coste** de compra
  (interno, no se muestra en tienda). Botones **×3 ×4 ×5 ×6 ×8** calculan el PVP = coste × N redondeado a ,95, y se
  muestra el **margen** (€ y multiplicador) en vivo. La sugerencia de precio de la IA se bajó a un rango **realista**
  para acero de moda de marca nueva (9,95–19,95 €, apuntando a 12,95–15,95) y **nunca** rellena "precio antes"
  (`compare_at_price` siempre null; solo se pone a mano en rebajas reales, por la Directiva Omnibus). Coste típico de
  compra del usuario: **1–4 €**.
- **SKU automático (control propio)** (migración **010** + `saveProduct`): el SKU lo asigna el sistema, no se teclea.
  Al crear un producto sin SKU se genera correlativo **`OUCY-0001`, `OUCY-0002`…** (max+1 de los ya existentes con ese
  prefijo). En la ficha el campo SKU es de solo lectura («Se asignará automáticamente»). Al editar se conserva el SKU.
- **Ref. de proveedor** (migración **010**, columna `products.supplier_ref`): campo de la ficha con el código de
  la pieza en el catálogo del proveedor, para reponer stock / hacer nuevos pedidos. Uso interno (no se muestra en
  la tienda). Aparece bajo el nombre en la lista `/admin/productos` (junto al SKU) y el buscador filtra también por él.

## Empresa AI-first (interno) — arquitectura
> Oucy es **AI-first de puertas adentro** (operativa/backoffice), NO en la tienda de cara al cliente. Toda la IA interna
> se apoya en una capa común y respeta las reglas de marca/honestidad.
- **Capa de IA central** (`src/lib/ai.ts`): único punto para el modelo (`claude-opus-4-8`), la clave, el manejo de
  errores y la extracción de JSON. Expone `askText`, `askJSON`, `imageBlock`, `aiConfigured()` y **`BRAND_RULES`** (las
  reglas de honestidad/marca que hereda cualquier texto público). Llama por `fetch` a la API de Anthropic (sin SDK
  nuevo). Requiere **`ANTHROPIC_API_KEY`** en Vercel; si falta, cada función devuelve `{ok:false,error}` y el backoffice
  sigue a mano (nunca bloquea). Añadir nuevas funciones de IA = una función que llama a esta capa.
- **Funciones de IA activas:**
  1. **Ficha de producto desde la foto** (`suggestProduct`): nombre, descripción, material, categoría y precio.
  2. **Asistente de reposición** (`/admin/reposicion` + `draftRestock`): agrupa las piezas con stock bajo por proveedor
     y **redacta el correo de pedido** a cada proveedor; el admin lo edita, copia o abre en el correo (`mailto`).
  3. **Control de calidad de foto** (`checkPhoto` + `ProductForm`): al subir cada foto, Claude visión la revisa y
     **avisa de reflejos** (fotógrafo/móvil/persona en la joya pulida), fondo sucio, desenfoque o mal encuadre, antes de
     publicar. Marca la miniatura con borde rojo + ⚠ y lista los fallos. NO edita la foto (Claude es visión, no genera
     píxeles). Nota de producto: para fotos limpias se recomienda **usar la foto del proveedor** o la técnica de la
     cartulina blanca con agujero para el objetivo.
  4. **Borrado de reflejos con IA + auditoría** (`cleanupPhoto` + `src/lib/image-edit.ts`): edita la foto con un servicio
     externo (**fal.ai / FLUX Kontext**, clave **`FAL_KEY`**) con instrucción conservadora (solo quitar el reflejo;
     mantener forma/tamaño/color/acabado; sin gemas ni ocultar defectos). Guarda la editada en nuestro Storage y luego
     **Claude audita** comparando original vs editada: si detecta que se ha alterado el producto, la marca **no segura**.
     La original NUNCA se borra; en la ficha se muestran las dos lado a lado con el veredicto y **el admin aprueba**
     («Usar la corregida» / «Quedarme con la original»). Anti-publicidad-engañosa por diseño (triple red: instrucción
     estricta + auditoría IA + aprobación humana). Sin `FAL_KEY` el botón no aparece. `maxDuration=60` en las páginas de
     producto (editar+auditar tarda).
- **Multi-proveedor** (migración **011**): tabla `suppliers` (nombre, contacto, email, teléfono, web, notas, plazo,
  pedido mínimo, activo; RLS solo `is_admin`) + `products.supplier_id` (FK). CRUD en **`/admin/proveedores`**. La ficha
  de producto tiene selector de proveedor + ref. Sembrado **Smile Joyas** como proveedor inicial. Pensado para crecer a
  más proveedores sin tocar esquema.
- **Roadmap AI-first** (siguiente, ver PENDIENTES): borrador de respuestas de soporte con IA, copiloto del panel
  (preguntar por stock/pedidos/tareas), resumen diario del negocio, e insights de reseñas.

## Vercel
- Team: `flipsuite-es' projects` (id `team_Z3rTsOhJJI24bIJ67MmXAkiH`).
- Proyecto: **`oucystudios`** · Producción: https://oucystudios.vercel.app
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET=product-images`.
  (Recomendado añadir `NEXT_PUBLIC_SITE_URL=https://oucystudios.com` cuando se conecte el dominio, para SEO/OG/sitemap.)
- **Auto-deploy:** cada push a la rama de trabajo dispara un deploy. Root Directory = raíz (app en raíz).
- Dominio `oucystudios.com`: registrado; **pendiente** conectarlo en Vercel → Domains.
- ⚠️ **OJO conector Vercel MCP:** en esta sesión el conector de Vercel SOLO expone el OTRO proyecto del usuario (no Oucy), así que Claude **NO puede inspeccionar ni verificar el proyecto `oucystudios`** por MCP. La verificación del deploy de Oucy (Production Branch, estado) la hace el usuario en su panel. No usar herramientas de Vercel sobre el otro proyecto (aislamiento).

## Estructura de la app (rutas)
Storefront (grupo `(store)`, tras el muro):
- `/` portada editorial · `/tienda` (buscador+filtros+orden) · `/producto/[slug]` (galería, cantidad, favorito, relacionados)
- `/favoritos` · `/carrito` (checkout + cupón) · `/pagina/[slug]` · `/soporte` (tickets) · `/pedido` (seguimiento) · `/entrar` (login/registro cliente) · `/cuenta` (perfil + historial de pedidos + salir) · `/acceso` (muro)
Backoffice (`/admin`, Supabase Auth):
- `/admin` panel con métricas (incl. tickets por responder) · `/admin/productos` (+ nuevo/[id]) · `/admin/categorias` · `/admin/pedidos` (+ [id]) · `/admin/soporte` (+ [id], hilo + responder + estado/prioridad) · `/admin/cupones` · `/admin/paginas` (+ nueva/[id]) · `/admin/ajustes`
SEO: `/sitemap.xml`, `/robots.txt`, metadata + OG por producto + **JSON-LD (schema.org/Product)** con precio/stock/marca.
Legal/UX: **banner de cookies RGPD** (`CookieConsent`, guarda aceptación en localStorage, enlaza a /pagina/privacidad).
Backoffice extra: **exportar pedidos a CSV** (`/admin/pedidos/export`, con BOM para Excel) · **buscador+filtros** (activos/borradores/stock bajo) en la lista de productos · **moderación de reseñas** (`/admin/resenas`) · **suscriptores** (`/admin/suscriptores` + export CSV) · **generador de firmas de email** (`/admin/firma`): herramienta para que el equipo cree su firma brandeada (tablas + estilos en línea, web-safe) y la copie a Gmail/Outlook/Apple Mail. **4 plantillas** (Clásica, Centrada, Compacta, Con botón CTA) + opciones (eslogan, aviso legal, logo). Sin DB.
Reseñas: en la ficha de producto (estrellas junto al título + sección de opiniones con formulario; `aggregateRating` en el JSON-LD). Newsletter: captura real de correos (guarda en `subscribers`).
Favicon propio y cuadrado (`src/app/icon.svg` — anillo dorado con destello) + `apple-icon.png` + `manifest.webmanifest` (PWA instalable) + **OG image de marca** (`public/og.png`, 1200×630) para previsualización al compartir.
Favoritos **sincronizados con la cuenta** (migración 009 `wishlist_items`, RLS por usuario; el provider mezcla local+servidor al iniciar sesión). Checkout **autorrellena** datos si hay sesión. Esqueletos de carga en tienda y ficha. Enlace "saltar al contenido" (a11y).

## Modelo de datos (resumen)
- `products` (name, slug, description, price, compare_at_price, stock, sku, material, category_id, images[], status active/draft, featured, sort)
- `categories` (name, slug, sort)
- `orders` (name, email, phone, items jsonb, subtotal, shipping, discount*, coupon_code*, total, status pending/paid/shipped/cancelled, tracking*, note) — (*) tras migración 002
- `settings` (fila única: shop_name, tagline, announcement, prelaunch_enabled, access_code, free_ship_threshold, shipping_flat + contenido* : instagram_url, tiktok_url, whatsapp_url, contact_email, hero_subtitle, story_text)
- `coupons`* (code, kind percent/fixed, value, min_subtotal, active)
- `pages`* (slug, title, body, published, sort)
- `tickets`** (ref, name, email, subject, order_ref, status, priority, last_message_at) + `ticket_messages`** (ticket_id, author, body) — (**) migración 003
- `notifications` (kind, title, body, url, read) — migración 004
- `reviews` (product_id, name, rating, body, approved) + `subscribers` (email, source) — migración 005
RLS: público solo lee lo publicado/activo; el admin autenticado gestiona todo. Tickets: el público solo opera vía funciones SECURITY DEFINER (open_ticket/ticket_thread/reply_ticket).

## Cómo desplegar cambios
Editar → `npm run build` (verificar verde) → commit → push a la rama → Vercel redespliega solo.
Verificar diseño localmente con capturas: arrancar `npm run start` en un puerto y usar Chromium headless
en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (el sandbox bloquea la red externa, así que para
ver la tienda con datos se usa un modo de previsualización TEMPORAL en `src/lib/data.ts` y luego se restaura).

## Limitaciones del entorno (para no chocar de nuevo)
1. **Supabase MCP: RESUELTO** — el conector ya está autorizado para la org **Oucy Studios**; Claude gestiona la DB
   con `project_id=jedyummyygniixuyzbck` (list_migrations, apply_migration, execute_sql, get_advisors funcionan).
2. **Red del sandbox:** bloquea salidas HTTPS a `supabase.co` y `vercel.app` (proxy con lista blanca). Por eso
   Claude no puede arrancar la app contra la DB real ni hacer capturas en vivo del sitio publicado; sí puede
   compilar, y verificar Vercel vía las herramientas MCP de Vercel (logs, deployments).
