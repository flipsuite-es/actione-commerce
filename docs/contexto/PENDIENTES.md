# PENDIENTES — tareas y siguiente paso

> Lista viva. Marcar [x] al completar y AÑADIR lo nuevo. Actualizar y hacer push
> en cada sesión. Última actualización: sesión de construcción inicial.

## ⏳ RECORDAR AL USUARIO cuando pueda ponerse (config externa; Claude no puede hacerla)
- [ ] **Vercel → `VAULT_KEY`** + redeploy → cifrado fuerte del gestor de contraseñas. (Instrucciones dadas 2026-07-02.)
- [x] ✅ **Cuentas de cliente FUNCIONANDO** (2026-07-02): SMTP con **Brevo** + Redirect URLs configurados. Probado:
      registro → correo de confirmación → enlace → sesión iniciada. (Remitente actual = Gmail del usuario; opcional
      pasar a `hola@oucystudios.com` autenticando el dominio en Brevo más adelante.)
- [ ] **Mejoras de cuenta** (cuando retomemos): favoritos en la cuenta, autorrelleno en checkout, direcciones de envío.
- [x] Ajustes revisados (`/admin/ajustes`) — hecho por el usuario 2026-07-02.
- [x] Dominio `oucystudios.com` conectado — hecho por el usuario 2026-07-02.
- [x] Repunte a `main` — el usuario indica que ya está en main (2026-07-02).
- [x] Correo a Smile Joyas — enviado por el usuario 2026-07-02.

## 🔴 Bloqueante / siguiente paso
- [x] ✅ **Migración `002_backoffice.sql` APLICADA** (2026-07-02) vía Supabase MCP (conector ya autorizado
      para la org Oucy). Verificado: settings +6 cols, orders +3 cols, tablas coupons y pages (4 páginas).
- [ ] **SIGUIENTE:** cargar catálogo real por `/admin` → primero **categorías**, luego **productos** con fotos.
      (Requiere que el usuario entre en `/admin` con su email/contraseña de Supabase Auth.)

## 🟠 Cuentas de cliente — pendiente de config en Supabase (importante)
- [ ] **Email de confirmación:** el registro usa el correo de confirmación de Supabase. Sin SMTP propio, esos
      correos salen del servidor compartido de Supabase (limitado, puede caer en spam). Para producción: configurar
      **SMTP** en Supabase → Auth → SMTP (Brevo/Resend), o **desactivar "Confirm email"** en Auth → Providers → Email
      si se quiere alta instantánea (menos seguro).
- [ ] **Redirect URLs:** en Supabase → Auth → URL Configuration, añadir el **Site URL** y las **Redirect URLs**
      (p. ej. `https://oucystudios.vercel.app/auth/callback` y luego el dominio real) para que el enlace de
      confirmación funcione.
- [ ] Para hacer admin a otra persona: `update public.profiles set role='admin' where email='…';` (por SQL/MCP).
- [ ] **Gestor de contraseñas — `VAULT_KEY`:** añadir en Vercel → Settings → Environment Variables una `VAULT_KEY`
      (30+ caracteres aleatorios) y redeploy, para cifrado fuerte de la bóveda. OJO: si se cambia la `VAULT_KEY`
      después de guardar entradas, las ya guardadas dejarán de descifrarse (habría que reintroducirlas).

## 🟠 Config de plataformas (deploy YA resuelto por sincronización)
- [x] ✅ **Deploy funcionando** (2026-07-02): la rama de producción `claude/ecommerce-low-investment-model-ru62lb`
      (la que Vercel vigila) se sincronizó por *fast-forward* con `main`. Ambas apuntan al mismo commit, así que
      Vercel redespliega solo. **Regla de trabajo hasta migrar del todo:** hacer push a `main` Y sincronizar la
      rama de producción (`git push origin main:claude/ecommerce-low-investment-model-ru62lb`) para que despliegue.
- [x] **Repunte a `main`**: el usuario indica (2026-07-02) que ya está en main. PENDIENTE confirmar si la
      **Production Branch de Vercel** apunta a `main`; si es así, se puede **dejar de sincronizar** la rama antigua
      y **borrar** `claude/…`. Mientras no se confirme, seguir con la doble-push por seguridad.

## 🟡 Para lanzar de verdad
- [ ] **(POSPUESTO por el usuario)** Subir **productos reales** por `/admin/productos` + crear **categorías**
      (Anillos, Pendientes, Colgantes…) en `/admin/categorias`. Es el paso que desbloquea el lanzamiento.
- [ ] **(POSPUESTO hasta lanzamiento)** Quitar el **muro de pre-lanzamiento** (Ajustes → `prelaunch_enabled` off).
- [x] Ajustes revisados · [x] Dominio conectado (2026-07-02, por el usuario).
- [ ] Con la respuesta de **Smile Joyas** (informe de materiales/níquel), afinar claims de calidad.

## 🟢 Mejoras / Fase 2
- [ ] **(RECORDAR al usuario)** Mejoras de cuenta cliente: sincronizar **favoritos** con la cuenta (ahora son
      localStorage), **autorrellenar** datos en el checkout si está logueado, y sección de **direcciones de envío**.
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
      **4 plantillas** a elegir (Clásica, Centrada, Compacta, Con botón CTA); logo opcional en todas.
- [x] **Cuentas de cliente** (2026-07-02): migración 007 (profiles + rol + is_admin). Login/registro en `/entrar`,
      área `/cuenta` (perfil editable + historial de pedidos + salir), pedidos enlazados al usuario, icono de cuenta
      en la cabecera. Panel `/admin` protegido por rol admin. RLS reescrita para separar admin de cliente.
- [x] **Textos de marca** (2026-07-02): copy reorientado a marca (no producto), sin publicidad engañosa (proveedor
      Smile Joyas; sin "oro/dorado/baño" salvo color por pieza), ancho completo + 100% responsive móvil.
