# CLAUDE.md — Memoria del proyecto (léeme SIEMPRE al empezar)

> Este archivo lo carga Claude automáticamente al inicio de cada sesión. Es el
> ancla de contexto. **Al terminar cualquier cambio o decisión, actualiza este
> archivo y los de `docs/contexto/`, y haz commit + push.** Si no, la próxima
> sesión arrancará con contexto incompleto.

## Qué es esto
**Oucy Studios** — tienda de **joyería de acero inoxidable dorado** (elegante,
atemporal, "no se oxida"), modelo e-commerce de baja inversión inspirado en el
ADN de Action. Marca, tienda y backoffice propios.

- **Repo:** `flipsuite-es/actione-commerce` · **Rama de trabajo:** `main` (única rama; es la de producción en Vercel)
- **App:** Next.js 14 (App Router, TS) + Tailwind + Supabase (Postgres/Auth/Storage), **en la RAÍZ del repo**.
- **Estrategia/negocio:** en `docs/00-19*.md` (análisis, nicho, gama, pricing, marca, canales…).
- **Web en vivo (pre-lanzamiento):** https://oucystudios.vercel.app · **Dominio:** oucystudios.com (registrado, sin conectar aún).
- **Muro de pre-lanzamiento:** ACTIVO. Código de acceso: `oucy2026`. Panel: `/admin`.

## Contexto detallado (léelo al arrancar)
1. `docs/contexto/ESTADO.md` — estado técnico completo (infra, DB, deploy, hecho/pendiente).
2. `docs/contexto/PENDIENTES.md` — lista viva de tareas y siguiente paso.
3. `docs/contexto/DECISIONES.md` — decisiones de negocio y de producto ya tomadas.
4. `docs/contexto/PROMPT-NUEVA-SESION.md` — el prompt que el usuario pega para recuperar contexto.

## Reglas permanentes (no romper)
1. **Aislamiento total:** trabaja SOLO en este repo. No toques ni menciones otros proyectos del usuario. Todo (Supabase, Vercel, dominio, cuentas) es dedicado a Oucy.
2. **No hacer pública la tienda** hasta que el usuario lo diga: el muro de pre-lanzamiento se queda ACTIVO.
3. **Trabaja en la rama** `main`. Commit + push con frecuencia. **OJO con el deploy:** Vercel todavía vigila la rama `claude/ecommerce-low-investment-model-ru62lb`, así que para que redespliegue hay que sincronizarla tras cada push a main: `git push origin main:claude/ecommerce-low-investment-model-ru62lb` (es fast-forward, ambas van a la par). Esto se elimina cuando el usuario repunte Vercel/GitHub a `main` (solo puede hacerlo él en los paneles). La rama antigua `claude/oucy-studios-context-review-vef7e0` quedó unificada en `main` el 2026-07-02; no usarla.
4. **Nunca commitear secretos** (service_role, contraseñas, `.env.local`). La anon key es pública y vive en las env de Vercel.
5. **Mantén el contexto al día:** cada vez que cambies algo importante, actualiza `CLAUDE.md` + `docs/contexto/*` y haz push. Es obligatorio.
6. **Honestidad:** reporta fielmente lo hecho y lo pendiente.

## Estado de un vistazo
- ✅ App completa (storefront premium + backoffice) desplegada en Vercel.
- ✅ Supabase base (schema.sql) aplicado. Backoffice básico operativo.
- ✅ **Migración `002_backoffice.sql` APLICADA** (2026-07-02) vía Supabase MCP. Desbloqueado: contenido editable en ajustes, cupones, páginas (4 iniciales sembradas), y descuento/cupón/seguimiento en pedidos.
- ✅ **Sistema de tickets de soporte** (migración `003_soporte.sql` APLICADA): storefront `/soporte` (abrir + consultar/responder con ref+email) y backoffice `/admin/soporte` (lista, hilo, responder, estado/prioridad) + stat en dashboard.
- ✅ **Notificaciones internas** (migración `004_notificaciones.sql` APLICADA): campanita en el panel con contador de no leídos. Triggers de DB generan avisos de nuevo ticket, respuesta de cliente y nuevo pedido. Sin correos externos; sondeo cada 30 s.
- ⏳ Subir productos reales por `/admin`. ⏳ Conectar dominio oucystudios.com. ⏳ Pagos (Fase 2).

## Conector Supabase (ACTUALIZADO)
El conector **Supabase MCP ya está autorizado para la org "Oucy Studios"** (proyecto `jedyummyygniixuyzbck`), así que Claude **sí puede gestionar la base de datos** (migraciones y SQL) desde esta sesión. La red directa a supabase.co sigue bloqueada en el sandbox, pero las operaciones de DB se hacen por las herramientas MCP de Supabase. (Antes solo se veía la org `flipsuite`; ya está resuelto.)
