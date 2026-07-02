# PENDIENTES — tareas y siguiente paso

> Lista viva. Marcar [x] al completar y AÑADIR lo nuevo. Actualizar y hacer push
> en cada sesión. Última actualización: sesión de construcción inicial.

## 🔴 Bloqueante / siguiente paso
- [x] ✅ **Migración `002_backoffice.sql` APLICADA** (2026-07-02) vía Supabase MCP (conector ya autorizado
      para la org Oucy). Verificado: settings +6 cols, orders +3 cols, tablas coupons y pages (4 páginas).
- [ ] **SIGUIENTE:** cargar catálogo real por `/admin` → primero **categorías**, luego **productos** con fotos.
      (Requiere que el usuario entre en `/admin` con su email/contraseña de Supabase Auth.)

## 🟠 Config de plataformas (deploy YA resuelto por sincronización)
- [x] ✅ **Deploy funcionando** (2026-07-02): la rama de producción `claude/ecommerce-low-investment-model-ru62lb`
      (la que Vercel vigila) se sincronizó por *fast-forward* con `main`. Ambas apuntan al mismo commit, así que
      Vercel redespliega solo. **Regla de trabajo hasta migrar del todo:** hacer push a `main` Y sincronizar la
      rama de producción (`git push origin main:claude/ecommerce-low-investment-model-ru62lb`) para que despliegue.
- [ ] (Opcional, cosmético) **Repuntar Vercel/GitHub a `main`** para no depender de la doble-push: los ajustes de
      panel (Vercel → Settings → Git → Production Branch = `main`; GitHub → Settings → Default branch = `main`) SOLO
      los puede cambiar el usuario. Claude no tiene herramientas para tocar esos settings. Tras cambiarlos, avisar a
      Claude para **borrar las ramas antiguas** y quedarnos solo con `main`.

## 🟡 Para lanzar de verdad
- [ ] Subir **productos reales** por `/admin/productos` (fotos ya en poder del usuario).
- [ ] Crear **categorías** (Anillos, Pendientes, Colgantes…) en `/admin/categorias`.
- [ ] Revisar/editar **ajustes** (redes reales, contacto, textos) en `/admin/ajustes`.
- [ ] Conectar el **dominio oucystudios.com** en Vercel → Project → Domains (+ DNS).
      Luego añadir env `NEXT_PUBLIC_SITE_URL=https://oucystudios.com` y redeploy.
- [ ] Pedir al proveedor el **informe del acero** (níquel/316L) para respaldar el claim "hipoalergénico".

## 🟢 Mejoras / Fase 2
- [ ] (Opcional) Avisar al **cliente por email** cuando el admin responde su ticket. Los avisos del ADMIN
      ya son internos (campanita); esto sería solo para el cliente, si se quiere. Requiere Resend/Brevo.
- [ ] Anti-spam en el formulario de soporte (rate-limit o captcha) si llega abuso.
- [ ] **Pagos** (Stripe/Shopify Payments + PayPal + Bizum) cuando haya tráfico/historial (ver `docs/01`, `docs/03`).
- [ ] Sincronizar los `subscribers` con Mailchimp/Brevo para enviar campañas (ahora se guardan en la DB y se exportan a CSV).
- [ ] Reordenar productos por arrastre; variantes (tallas de anillo) si se necesita.
- [ ] Analítica (Vercel Analytics) y píxeles de TikTok/Meta.

## Hecho (histórico breve)
- [x] Estrategia completa de negocio (`docs/00-19`).
- [x] Marca **Oucy Studios**, dominio `oucystudios.com`, logo procesado (transparente + dorado metálico).
- [x] App Next.js + Supabase: storefront premium + backoffice.
- [x] Deploy en Vercel (auto-deploy por push). App movida a la raíz del repo.
- [x] Backoffice ampliado: dashboard con métricas, pedidos con estados, categorías, cupones, páginas, ajustes de contenido.
- [x] Sistema de contexto/recuperación (`CLAUDE.md` + `docs/contexto/`).
- [x] **Sistema de tickets de soporte** (2026-07-02): migración 003 + página `/soporte` (abrir y consultar/responder
      con ref+email) + panel `/admin/soporte` (lista con filtros, hilo, responder, estado/prioridad) + stat en dashboard.
- [x] **Notificaciones internas** (2026-07-02): migración 004 + campanita en el panel (nuevo ticket, respuesta de
      cliente, nuevo pedido) con contador de no leídos, sondeo cada 30 s y marcar leídas. Todo interno, sin emails.
- [x] **Pulido general** (2026-07-02): JSON-LD de producto (SEO), banner de cookies RGPD, exportar pedidos a CSV
      y buscador/filtros en la lista de productos del panel.
- [x] **Reseñas de producto** (2026-07-02): migración 005 + estrellas + sección de opiniones con formulario en la
      ficha + `aggregateRating` (SEO) + moderación en `/admin/resenas` + aviso en la campanita.
- [x] **Captura real de correos** (2026-07-02): newsletter guarda en `subscribers` (dedupe) + `/admin/suscriptores`
      con export CSV.
- [x] **Favicon cuadrado propio** + corazón de favoritos simétrico + PWA (manifest, theme-color) (2026-07-02).
- [x] **Seguimiento de pedido** para el cliente (2026-07-02): migración 006 + página `/pedido` (ref+email → línea
      de estado + nº de seguimiento); la confirmación del checkout muestra la referencia. Testimonios de la home
      ahora se nutren de reseñas reales aprobadas (con fallback). Dashboard con más indicadores.
- [x] **Opción de regalo en el checkout** (2026-07-02): marca "Es un regalo" + mensaje para la tarjeta; llega al
      admin en la nota del pedido.
- [x] **Generador de firmas de email** (2026-07-02): `/admin/firma`, herramienta para que el equipo cree su firma
      brandeada y elegante (tablas + estilos en línea, web-safe), con vista previa y copiar a Gmail/Outlook. Sin DB.
      **4 plantillas** a elegir (Clásica, Centrada, Compacta, Con botón CTA); verificadas por render headless.
