# Oucy Studios — tienda + backoffice

Tienda de joyería (Next.js 14 + Supabase) con **muro de pre-lanzamiento** y un
**backoffice** para gestionar productos, stock, imágenes, pedidos y ajustes.
Desplegable **gratis** en Vercel + Supabase.

## Qué incluye

- **Storefront** elegante (blanco/oro): portada, tienda, ficha de producto, cesta
  y checkout (registra el pedido; el pago se conecta en Fase 2).
- **Muro de pre-lanzamiento**: la tienda pide un código hasta que la abras. Se
  activa/desactiva y se cambia el código desde el backoffice.
- **Backoffice** en `/admin`: login privado, panel, **CRUD de productos**,
  **control de stock** (± en un clic), subida de imágenes, categorías, pedidos y
  ajustes (envíos, tagline, muro).

## Puesta en marcha (local)

1. **Crea un proyecto Supabase** gratis en https://supabase.com
2. En Supabase → **SQL Editor**, pega y ejecuta `supabase/schema.sql`
   (opcional: `supabase/seed.sql` para datos de ejemplo).
3. En Supabase → **Storage**, comprueba que existe el bucket público
   `product-images` (el schema lo crea).
4. Crea el usuario admin: Supabase → **Authentication → Users → Add user**
   (email + contraseña). Con ese usuario entrarás en `/admin`.
5. Copia `.env.example` a `.env.local` y rellena las claves (Supabase → Settings → API).
6. Instala y arranca:
   ```bash
   npm install
   npm run dev
   ```
7. Abre:
   - Tienda: http://localhost:3000 (código por defecto: `oucy2026`)
   - Backoffice: http://localhost:3000/admin

## Desplegar (gratis)

1. Sube el repo a GitHub (ya está).
2. En **Vercel** → New Project → importa el repo (la app está en la **raíz**, no hace falta tocar Root Directory).
3. Añade las variables de entorno del `.env.example` en Vercel.
4. Deploy. Luego apunta tu dominio `oucystudios.com` en Vercel → Domains.

## Notas

- El pago (Stripe/Bizum) se integra en Fase 2, cuando haya historial y tráfico.
- El logo (`public/logo.png`) es la versión dorada metálica; `logo-original.png`
  es tu dorado original por si lo prefieres.
- La seguridad de datos usa **RLS**: el público solo ve productos `active`; el
  admin (autenticado) gestiona todo. La `service_role` solo se usa en servidor.
