# ESTADO — estado técnico completo

> Mantener actualizado en cada sesión. Última actualización: sesión de construcción inicial.

## Resumen
Oucy Studios: tienda de joyería (acero dorado) construida con Next.js 14 + Supabase,
desplegada en Vercel, en **pre-lanzamiento** (muro con código). Marca, tienda y
backoffice completos y funcionando.

## Repositorio
- GitHub: `flipsuite-es/actione-commerce`
- Rama de trabajo: `claude/ecommerce-low-investment-model-ru62lb` (única rama; es la de producción en Vercel)
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
- **Migración pendiente:** `supabase/migrations/002_backoffice.sql` (settings de contenido, orders.tracking/discount/coupon_code, tablas `coupons` y `pages`). La app funciona sin ella (degrada), pero hasta aplicarla NO hay cupones, páginas editables, ni contenido/redes editables, ni seguimiento de pedidos.
- Usuario admin: creado por el usuario en Authentication (email + contraseña propios). Entra en `/admin`.
- Bucket de imágenes: `product-images` (público).

## Vercel
- Team: `flipsuite-es' projects` (id `team_Z3rTsOhJJI24bIJ67MmXAkiH`).
- Proyecto: **`oucystudios`** · Producción: https://oucystudios.vercel.app
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET=product-images`.
  (Recomendado añadir `NEXT_PUBLIC_SITE_URL=https://oucystudios.com` cuando se conecte el dominio, para SEO/OG/sitemap.)
- **Auto-deploy:** cada push a la rama de trabajo dispara un deploy. Root Directory = raíz (app en raíz).
- Dominio `oucystudios.com`: registrado; **pendiente** conectarlo en Vercel → Domains.

## Estructura de la app (rutas)
Storefront (grupo `(store)`, tras el muro):
- `/` portada editorial · `/tienda` (buscador+filtros+orden) · `/producto/[slug]` (galería, cantidad, favorito, relacionados)
- `/favoritos` · `/carrito` (checkout + cupón) · `/pagina/[slug]` (contenido) · `/acceso` (muro)
Backoffice (`/admin`, Supabase Auth):
- `/admin` panel con métricas · `/admin/productos` (+ nuevo/[id]) · `/admin/categorias` · `/admin/pedidos` (+ [id]) · `/admin/cupones` · `/admin/paginas` (+ nueva/[id]) · `/admin/ajustes`
SEO: `/sitemap.xml`, `/robots.txt`, metadata + OG por producto.

## Modelo de datos (resumen)
- `products` (name, slug, description, price, compare_at_price, stock, sku, material, category_id, images[], status active/draft, featured, sort)
- `categories` (name, slug, sort)
- `orders` (name, email, phone, items jsonb, subtotal, shipping, discount*, coupon_code*, total, status pending/paid/shipped/cancelled, tracking*, note) — (*) tras migración 002
- `settings` (fila única: shop_name, tagline, announcement, prelaunch_enabled, access_code, free_ship_threshold, shipping_flat + contenido* : instagram_url, tiktok_url, whatsapp_url, contact_email, hero_subtitle, story_text)
- `coupons`* (code, kind percent/fixed, value, min_subtotal, active)
- `pages`* (slug, title, body, published, sort)
RLS: público solo lee lo publicado/activo; el admin autenticado gestiona todo.

## Cómo desplegar cambios
Editar → `npm run build` (verificar verde) → commit → push a la rama → Vercel redespliega solo.
Verificar diseño localmente con capturas: arrancar `npm run start` en un puerto y usar Chromium headless
en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (el sandbox bloquea la red externa, así que para
ver la tienda con datos se usa un modo de previsualización TEMPORAL en `src/lib/data.ts` y luego se restaura).

## Limitaciones del entorno (para no chocar de nuevo)
1. **Supabase MCP** autorizado solo para la org `flipsuite` → sin permiso sobre el proyecto de Oucy
   (`get_project`/`apply_migration` devuelven "no permission"). **Solución para que Claude gestione la DB:**
   el usuario reautoriza el conector de Supabase incluyendo la org **Oucy Studios** (o "todas") y abre una
   **sesión NUEVA**; entonces Claude puede ejecutar migraciones y SQL con `project_id=jedyummyygniixuyzbck`.
2. **Red del sandbox:** bloquea salidas HTTPS a `supabase.co` y `vercel.app` (proxy con lista blanca). Por eso
   Claude no puede arrancar la app contra la DB real ni hacer capturas en vivo del sitio publicado; sí puede
   compilar, y verificar Vercel vía las herramientas MCP de Vercel (logs, deployments).
