# DECISIONES — decisiones ya tomadas (no re-litigar sin motivo)

> Resumen de las decisiones de negocio/producto. El detalle y el porqué están en `docs/00-19`.

## Negocio
- **Modelo:** e-commerce de baja inversión con ADN de Action (oportunidad de compra, rotación, drops,
  comunidad, reinvertir), pero aplicado a un producto donde se puede ganar por **marca y margen**.
- **Capital:** ~0 €. No tocar ahorros. Reinvertir el 100 % (hay ingresos fuera del negocio).
- **Aislamiento:** todo dedicado a Oucy, separado de los otros proyectos del usuario.

## Producto y posicionamiento
- **Nicho/producto:** joyería de **acero inoxidable dorado** (el usuario ya tiene stock y proveedor).
- **Gama:** **asequible** ahora (acero, ~10–18 €), escalar a **demi-fine** con caja. NO ir a fina/cara
  (capital, contraste, chargebacks). Ver `docs/17`.
- **Posicionamiento:** *quiet luxury* asequible — "joyas doradas elegantes y atemporales que no se oxidan,
  para el día a día y para regalar". El "no se oxida/hipoalergénico" es **garantía**, no el eslogan; el
  wedge real es estética + historia + comunidad + calidad honesta. Ver `docs/16`.
- **Público:** mujer 25–45 que se autorregala y regala.

## Marca
- **Nombre:** **Oucy Studios** · **Dominio:** `oucystudios.com` (`.com` propio; se descartaron nombres
  cuyo `.com` no era del usuario). Estética blanco/ivory + oro, serif elegante.
- **Tagline:** "Joyas para cada día." (descartadas: "Joyas que duran, no se oxidan" —suena a producto— y "Oro para cada día" —FALSO: es acero inoxidable, no oro, y no todo es dorado—).
- **Tono de voz (2026-07-02):** **de MARCA**, no de producto ni de "todo a 100". Aspiracional, elegante, **material-neutro**: se habla de estilo, atemporalidad, día a día, el estudio y regalar. **NO anclar la identidad en "oro/dorado"** (es acero inoxidable y no todas las piezas son doradas) ni en features ("no se oxida", "hipoalergénico/níquel"). Los datos técnicos salen **solo lo mínimo y necesario**: ficha (Materiales y cuidado, con el acabado real por producto) y página `/cuidado`. (Petición explícita del usuario.)
- **Material por defecto de producto:** "Acero inoxidable" (neutro); el admin especifica el acabado (dorado/plateado/…) por pieza. Nunca decir "oro" a secas.
- **Reglas de honestidad:** perlas = "sintéticas"; el material real (acero, baño/acabado) se dice en la ficha, nunca "oro" a secas; nada de copias/IP.

## Canales (ver `docs/19`)
- **Descubrir:** Instagram + TikTok (contenido diario, formato *antes/después* y try-on).
- **Cobrar al principio:** marketplaces (Etsy + Wallapop) → cobran ellos, sin exponer pasarela.
- **Tienda propia:** oucystudios.com — se construyó ya; se abre como canal principal con historial + tráfico.
- **Pre-lanzamiento:** la web tiene muro con código; no pública hasta decisión del usuario.

## Técnicas
- **Stack:** Next.js + Supabase + Vercel (todo gratis, propio, aislado).
- **Sin service_role en la app:** el admin escribe con su sesión (RLS). Más seguro.
- **App en la raíz del repo** (para que Vercel despliegue sin Root Directory).
