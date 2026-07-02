# CLAUDE.md — Memoria del proyecto (léeme SIEMPRE al empezar)

> Este archivo lo carga Claude automáticamente al inicio de cada sesión. Es el
> ancla de contexto. **Al terminar cualquier cambio o decisión, actualiza este
> archivo y los de `docs/contexto/`, y haz commit + push.** Si no, la próxima
> sesión arrancará con contexto incompleto.

## Qué es esto
**Oucy Studios** — tienda de **joyería de acero inoxidable dorado** (elegante,
atemporal, "no se oxida"), modelo e-commerce de baja inversión inspirado en el
ADN de Action. Marca, tienda y backoffice propios.

- **Repo:** `flipsuite-es/actione-commerce` · **Rama de trabajo:** `claude/ecommerce-low-investment-model-ru62lb`
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
3. **Trabaja en la rama** `claude/ecommerce-low-investment-model-ru62lb`. Commit + push con frecuencia (Vercel redespliega solo).
4. **Nunca commitear secretos** (service_role, contraseñas, `.env.local`). La anon key es pública y vive en las env de Vercel.
5. **Mantén el contexto al día:** cada vez que cambies algo importante, actualiza `CLAUDE.md` + `docs/contexto/*` y haz push. Es obligatorio.
6. **Honestidad:** reporta fielmente lo hecho y lo pendiente.

## Estado de un vistazo
- ✅ App completa (storefront premium + backoffice) desplegada en Vercel.
- ✅ Supabase base (schema.sql) aplicado. Backoffice básico operativo.
- ⏳ **Migración `supabase/migrations/002_backoffice.sql` PENDIENTE** de ejecutar (desbloquea: contenido editable, cupones, páginas, seguimiento de pedidos). La app degrada con elegancia si no está.
- ⏳ Subir productos reales por `/admin`. ⏳ Conectar dominio oucystudios.com. ⏳ Pagos (Fase 2).

## Limitación conocida (importante)
El conector **Supabase MCP** está autorizado solo para la organización `flipsuite`, no para la org **Oucy Studios** (misma cuenta `flipsuite.gestion@gmail.com`), así que Claude **no puede tocar la base de datos de Oucy** salvo que el usuario **reautorice el MCP incluyendo la org Oucy** y abra una **sesión nueva**. El sandbox además bloquea la red directa a supabase.co. Detalle y solución en `docs/contexto/ESTADO.md`.
