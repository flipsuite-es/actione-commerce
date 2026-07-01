# Action-commerce — Playbook de ejecución (bajo coste, sin riesgo de baneo, aislado)

Este repositorio contiene **el plan concreto para ejecutar un e-commerce con el ADN de Action**
(oportunidad de compra + rotación + sensación de chollo + operación simple), diseñado bajo tres
restricciones no negociables que tú marcaste:

1. **Muy poca inversión inicial.** Arranque real desde 0–200 €, primer lote serio con 1.000–2.500 €.
2. **Cero riesgo de baneo de pasarelas de pago** (Stripe/PayPal/Bizum).
3. **Aislamiento total.** Nada de este proyecto puede afectarte a ti ni a tus otros proyectos:
   ni legal, ni fiscal, ni financiera, ni reputacionalmente, ni por "baneo en cascada".

> Este playbook **no** es el documento de análisis de Action. Ese análisis describe *cómo funciona
> Action* y *qué es replicable*. Aquí se toma una decisión y se detalla **cómo ejecutarla paso a paso**
> optimizando tus tres restricciones.

---

## La decisión en una frase

**Vende primero en marketplaces (Wallapop, eBay, Amazon, Vinted) con stock propio de overstock/liquidación
europeo, dentro de una entidad separada, con cuentas, banco, dispositivo y marca 100 % dedicados. La
tienda propia con pasarela llega después, ya blindada.**

Motivo: en un marketplace **tú nunca tocas la pasarela de pago** (cobra el marketplace y te liquida). Eso
elimina de raíz el riesgo de baneo Stripe/PayPal durante la fase más peligrosa: la del historial cero.
Cuando abras pasarela propia, ya lo harás con reputación, procesos y aislamiento probados.

---

## Cómo leer este repo

| Documento | Qué resuelve |
|---|---|
| [`docs/00-decision-estrategica.md`](docs/00-decision-estrategica.md) | Qué modelo exacto ejecutar y por qué, frente a las alternativas. |
| [`docs/01-blindaje-pasarelas-y-baneos.md`](docs/01-blindaje-pasarelas-y-baneos.md) | **Tu restricción #2.** Cómo no ser baneado nunca por Stripe/PayPal. |
| [`docs/02-aislamiento-y-proteccion.md`](docs/02-aislamiento-y-proteccion.md) | **Tu restricción #3.** Cómo blindar tus otros proyectos y tu patrimonio. |
| [`docs/03-plan-arranque-90-dias.md`](docs/03-plan-arranque-90-dias.md) | **Tu restricción #1.** Plan día a día con presupuesto real. |
| [`docs/04-cumplimiento-legal-fiscal.md`](docs/04-cumplimiento-legal-fiscal.md) | GPSR, DAC7, IVA/recargo, RGPD, desistimiento. |
| [`docs/05-operativa-sourcing-pricing-kpis.md`](docs/05-operativa-sourcing-pricing-kpis.md) | Compra de lotes, cálculo de margen real, hoja de control, KPIs de corte. |
| [`docs/06-stack-tecnico-y-costes.md`](docs/06-stack-tecnico-y-costes.md) | Herramientas concretas y coste mensual mínimo. |

---

## Las 5 reglas que hacen que esto no te haga daño

1. **Entidad y marca separadas.** Este negocio no comparte nombre, dominio, banco, correo, teléfono ni
   pasarela con ningún otro proyecto tuyo. (Ver `docs/02`.)
2. **Marketplace primero, pasarela después.** No abras Stripe/PayPal hasta tener rotación validada. (Ver `docs/01`.)
3. **Solo producto legal y trazable.** GPSR + CE + factura de compra o no se vende. (Ver `docs/04`.)
4. **Margen real antes de comprar.** Si no puedes calcular el margen neto de un lote, no lo compras. (Ver `docs/05`.)
5. **Historial limpio > crecimiento rápido.** Disputas < 0,5 %, envíos en 24–72 h, descripción honesta. (Ver `docs/01`.)

> **Aviso.** Este material es una guía operativa, no asesoramiento legal ni fiscal. Los pasos de
> constitución de entidad, IVA/recargo de equivalencia y contratos deben validarse con una gestoría y,
> si aplica, un abogado antes de ejecutarlos.
