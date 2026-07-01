# 06 · Stack técnico y costes mínimos

Filosofía: **empezar con casi nada, añadir herramienta solo cuando un cuello de botella lo justifique.**
Nada de plataformas enterprise al inicio.

## Por fase

| Fase | Necesitas | Herramienta recomendada | Coste |
|---|---|---|---|
| 0 | Vender sin web | Wallapop, eBay, Vinted (apps gratis) | 0 € (solo comisiones por venta) |
| 0 | Fotos | Móvil + luz natural + fondo neutro | 0 € |
| 0–1 | Control de lotes | Google Sheets / LibreOffice ([plantilla incluida](../plantillas/hoja-control-lotes.csv)) | 0 € |
| 1 | Etiquetas/envíos | Correos / transportista con tarifa e-commerce | por envío |
| 2 | Tienda propia | **Shopify** (rápido) o **WooCommerce** (control, +barato a largo plazo) | Shopify ~30–40 €/mes · Woo: hosting ~10–20 €/mes |
| 2 | Dominio | Registrador estándar (dedicado a esta marca) | ~10–15 €/año |
| 2 | Pagos | Stripe/Shopify Payments + PayPal + Bizum | % por transacción |
| 2 | Email/lista | Brevo/Mailchimp (plan gratis inicial) + WhatsApp/Telegram | 0 € al inicio |
| 3 | Inventario/SKUs | ERP ligero o el propio panel de Shopify/Woo | bajo |
| 4 | Escala | Amazon FBA (solo producto validado) | variable |

## Coste mensual recurrente mínimo (Fase 2)

| Concepto | Coste |
|---|---:|
| Plataforma tienda | 10–40 €/mes |
| Dominio | ~1 €/mes prorrateado |
| Email marketing | 0 € (plan gratis) → escalar luego |
| Gestoría | 50–90 €/mes |
| **Total** | **~65–130 €/mes** + comisiones por venta |

## Shopify vs WooCommerce (decisión rápida)

- **Shopify** si priorizas **velocidad de lanzamiento** y que "funcione solo". Pagas cuota mensual.
- **WooCommerce (WordPress)** si priorizas **control y coste bajo a largo plazo** y no te asusta gestionar
  hosting/actualizaciones.

Para el arranque **la tienda ni siquiera es urgente**: los marketplaces son el motor de caja de las Fases
0–1. Monta la tienda en Fase 2, sin prisa y bien blindada (`docs/01`).

## Reglas de aislamiento aplicadas al stack (recordatorio de `docs/02`)

- Cuentas de todas estas herramientas con **email dedicado** de este negocio.
- Pagos a nombre de **la entidad separada**, con **banco dedicado**.
- Gestión desde **perfil de navegador separado** (o dispositivo distinto) para no vincular fingerprints.
- Nada compartido con tus otros proyectos.
