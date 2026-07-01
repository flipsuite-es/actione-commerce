# 07 · Fuentes y verificación (datos sensibles al tiempo)

Los datos normativos usados en este playbook se verificaron con búsqueda web en julio de 2026. Deben
reconfirmarse con gestoría/abogado antes de ejecutar, ya que normativa y políticas de plataforma cambian.

## GPSR — Reglamento (UE) 2023/988, en vigor desde el 13/12/2024
Obliga a que cualquiera que venda a consumidores en la UE (incluidos vendedores en marketplaces, aunque no
sean fabricantes) garantice seguridad y **trazabilidad** del producto, con registro y datos de
fabricante/responsable UE.
- https://www.confianzaonline.es/noticias/a-partir-del-13-de-diciembre-entran-en-vigor-los-requisitos-del-reglamento-general-de-seguridad-de-los-productos-gspr/
- https://delvy.es/nuevo-reglamento-europeo-gpsr/
- https://www.wannme.com/cumplir-gpsr-seguridad-productos-marketplaces/

## DAC7 — reporte de marketplaces a Hacienda (desde 2024)
Wallapop, Vinted, eBay, Amazon, etc. reportan a la AEAT a los vendedores que superan **30 operaciones/año
O 2.000 €/año**. Si la plataforma pide datos fiscales y no respondes en plazo, puede **bloquear** la cuenta.
- https://taxdown.es/blog/dac7-hacienda-wallapop-vinted-ebay
- https://www.in-diem.com/abogados/fiscalidad/dac7-espana-plataformas-digitales-obligaciones-fiscales-2

## Baneos y "cascada" en Stripe / PayPal
Ambas plataformas vinculan cuentas por titular, banco, email/teléfono, IP, tarjeta y **fingerprint de
dispositivo**; un cierre puede arrastrar cuentas asociadas. De ahí la necesidad de **aislamiento real**
(entidad/banco/email/dispositivo separados) y de empezar en marketplaces, donde no expones pasarela propia.
- https://support.stripe.com/questions/platform-controls-for-connected-accounts
- https://docs.stripe.com/get-started/account/linked-external-accounts
- https://gologin.com/blog/paypal-account-suspended/

> Nota: algunas fuentes sobre vinculación de cuentas provienen de foros. Se usan solo para entender **cómo
> detectan** las plataformas, con el fin de operar de forma **legítima y separada**, nunca para evadir
> identidad. El objetivo es tener cuentas realmente independientes, no ocultas.
