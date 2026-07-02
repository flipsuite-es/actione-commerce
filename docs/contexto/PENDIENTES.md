# PENDIENTES — tareas y siguiente paso

> Lista viva. Marcar [x] al completar y AÑADIR lo nuevo. Actualizar y hacer push
> en cada sesión. Última actualización: sesión de construcción inicial.

## 🔴 Bloqueante / siguiente paso
- [x] ✅ **Migración `002_backoffice.sql` APLICADA** (2026-07-02) vía Supabase MCP (conector ya autorizado
      para la org Oucy). Verificado: settings +6 cols, orders +3 cols, tablas coupons y pages (4 páginas).
- [ ] **SIGUIENTE:** cargar catálogo real por `/admin` → primero **categorías**, luego **productos** con fotos.
      (Requiere que el usuario entre en `/admin` con su email/contraseña de Supabase Auth.)

## 🟡 Para lanzar de verdad
- [ ] Subir **productos reales** por `/admin/productos` (fotos ya en poder del usuario).
- [ ] Crear **categorías** (Anillos, Pendientes, Colgantes…) en `/admin/categorias`.
- [ ] Revisar/editar **ajustes** (redes reales, contacto, textos) en `/admin/ajustes`.
- [ ] Conectar el **dominio oucystudios.com** en Vercel → Project → Domains (+ DNS).
      Luego añadir env `NEXT_PUBLIC_SITE_URL=https://oucystudios.com` y redeploy.
- [ ] Pedir al proveedor el **informe del acero** (níquel/316L) para respaldar el claim "hipoalergénico".

## 🟢 Mejoras / Fase 2
- [ ] **Pagos** (Stripe/Shopify Payments + PayPal + Bizum) cuando haya tráfico/historial (ver `docs/01`, `docs/03`).
- [ ] Captura de email real (Formspree/Mailchimp/Brevo) para newsletter y muro.
- [ ] Reseñas gestionables desde el panel (ahora los testimonios son fijos).
- [ ] Reordenar productos por arrastre; variantes (tallas de anillo) si se necesita.
- [ ] Analítica (Vercel Analytics) y píxeles de TikTok/Meta.

## Hecho (histórico breve)
- [x] Estrategia completa de negocio (`docs/00-19`).
- [x] Marca **Oucy Studios**, dominio `oucystudios.com`, logo procesado (transparente + dorado metálico).
- [x] App Next.js + Supabase: storefront premium + backoffice.
- [x] Deploy en Vercel (auto-deploy por push). App movida a la raíz del repo.
- [x] Backoffice ampliado: dashboard con métricas, pedidos con estados, categorías, cupones, páginas, ajustes de contenido.
- [x] Sistema de contexto/recuperación (`CLAUDE.md` + `docs/contexto/`).
