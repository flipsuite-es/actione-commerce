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
- **Migración 007 APLICADA** (2026-07-02): `supabase/migrations/007_cuentas.sql` — **cuentas de cliente**. Tabla `profiles` (1:1 con `auth.users`, con `role` customer/admin), trigger `handle_new_user` de alta, `is_admin()` y `update_my_profile()` (SECURITY DEFINER). **IMPORTANTE:** se reescribieron TODAS las políticas que daban acceso total a cualquier `authenticated` para exigir `is_admin()` (productos, categorías, pedidos, ajustes, cupones, páginas, tickets, notificaciones, reseñas, suscriptores y storage) — si no, los clientes heredarían el backoffice. `orders.user_id` + política de lectura del cliente (sus pedidos por user_id o email). El admin (`abraham.e.c.2004@gmail.com`) tiene role='admin'. El panel `/admin` ahora exige role admin (si no, redirige a `/cuenta`).
- **Migración 006 APLICADA** (2026-07-02): `supabase/migrations/006_seguimiento_pedido.sql` — función SECURITY DEFINER `order_status(ref, email)` (ref = 8 primeros del id) para que el cliente consulte el estado de su pedido en `/pedido`. La confirmación del checkout muestra la referencia.
- **Migración 005 APLICADA** (2026-07-02): `supabase/migrations/005_resenas_suscriptores.sql` — **reseñas** (`reviews`: product_id, name, rating 1-5, body, approved; RLS público lee solo aprobadas; función SECURITY DEFINER `submit_review` fuerza approved=false; trigger genera notificación `review_new`) y **suscriptores** (`subscribers`: email único, source; alta pública vía `subscribe_email` con dedupe; solo admin lee).
- **Migración 004 APLICADA** (2026-07-02): `supabase/migrations/004_notificaciones.sql` — **notificaciones internas**. Tabla `notifications` (kind ticket_new/ticket_reply/order_new, title, body, url, read) con RLS solo-admin. Triggers `after insert` en `tickets`, `ticket_messages` (solo respuestas de cliente, no la apertura) y `orders` insertan avisos vía funciones SECURITY DEFINER. La campanita del panel los muestra (contador de no leídos, sondeo cada 30 s, marcar leídas). Sin correos externos.
- **Migración 003 APLICADA** (2026-07-02): `supabase/migrations/003_soporte.sql` — **sistema de tickets de soporte**. Tablas `tickets` (ref único OUCY-XXXXXX, name, email, subject, order_ref, status open/pending/answered/closed, priority) y `ticket_messages` (author customer/admin, body). El público NO lee/escribe directo: opera vía 3 funciones **SECURITY DEFINER** (`open_ticket`, `ticket_thread`, `reply_ticket`) que validan ref+email y tienen `search_path` fijado; el admin autenticado gestiona todo por RLS. Advisors: los WARN `anon/authenticated_security_definer_function_executable` sobre esas 3 funciones son **intencionales** (el cliente anónimo debe poder llamarlas).
  - Verificación advisors (seguridad): solo WARN esperados — las políticas `*_admin_all ... using(true)` para el admin autenticado son **por diseño** (ver DECISIONES: el admin gestiona todo vía su sesión RLS); `function_search_path_mutable` en `touch_updated_at` y `auth_leaked_password_protection` son WARN menores no bloqueantes.
- Usuario admin: creado por el usuario en Authentication (email + contraseña propios). Entra en `/admin`.
- Bucket de imágenes: `product-images` (público).

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
Favicon propio y cuadrado (`src/app/icon.svg` — anillo dorado con destello) + `apple-icon.png` + `manifest.webmanifest` (PWA instalable).

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
