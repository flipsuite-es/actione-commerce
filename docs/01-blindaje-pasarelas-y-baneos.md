# 01 · Blindaje de pasarelas de pago (cero baneos)

> Tu restricción #2 y una parte de la #3. Este documento es el más importante para "que no me pueda
> afectar de forma negativa".

## La idea que resuelve el 90 % del problema

**Durante la fase de historial cero, no toques ninguna pasarela de pago tú mismo.** Vende en marketplaces
(Wallapop, eBay, Amazon, Vinted). En un marketplace, **el que cobra al comprador y asume el riesgo de
chargeback es el marketplace**, y a ti te hace una liquidación (payout) a tu cuenta bancaria. Resultado:

- No hay cuenta Stripe/PayPal tuya que puedan congelar o banear.
- No hay "reserva" que te retenga la caja.
- Aprendes a vender, embalar, describir y atender **antes** de exponer una pasarela.

La pasarela propia (Stripe / Shopify Payments / PayPal / Bizum) llega en Fase 2, **ya con reputación,
procesos y aislamiento**.

## Por qué banean Stripe y PayPal (para no hacerlo)

Los baneos y retenciones casi nunca son por "qué vendes", sino por **cómo lo entregas y cómo gestionas
expectativas**. Lo que dispara disputas y reservas:

1. Envío lento y sin tracking.
2. Producto que no coincide con la descripción.
3. Cliente que no reconoce el cargo (descriptor confuso).
4. Atención lenta → el cliente abre disputa en vez de escribirte.
5. **Pico repentino de ventas sin histórico** (señal de fraude para el sistema).
6. Devoluciones difíciles, reclamos publicitarios exagerados, o venta con problemas de IP.

Umbral de salud: **tasa de disputas < 0,5 %. Nunca acercarse a 0,75 %** (a partir de ~1 % entras en
programas de monitorización y riesgo de cierre).

## El riesgo de "baneo en cascada" (clave para tus otros proyectos)

Stripe y PayPal **vinculan cuentas** por: mismo titular/CIF, mismo banco, mismo email/teléfono, misma IP,
mismo dispositivo (hardware fingerprint) e incluso misma tarjeta. Si una cuenta cae, el sistema puede
**marcar y cerrar las cuentas asociadas** — aunque sean de otro negocio tuyo.

**Consecuencia directa para ti:** si mezclas este proyecto con tus otros proyectos (mismo PayPal, mismo
banco, mismo portátil, mismo correo), un problema aquí **puede arrastrar** las pasarelas de tus otros
negocios. Por eso el aislamiento de `docs/02` no es "buena práctica": es la barrera que impide el efecto
cascada. Se trata de cuentas **legítimamente separadas** (entidad, banco, marca distintos), no de esconder
identidad.

## Reglas de oro de la pasarela (cuando llegue la Fase 2)

**Setup**
- Pasarela dada de alta a nombre de **la entidad separada** (ver `docs/02`), con su CIF, su banco, su
  email y su teléfono. Nunca con datos compartidos con otro proyecto.
- **Descriptor de cobro reconocible**: que en el extracto del cliente aparezca el nombre de la tienda,
  no un nombre críptico. Reduce los "no reconozco el cargo".
- Ten **dos vías de cobro** desde el principio (p. ej. Stripe/Shopify Payments **+** PayPal, y Bizum si
  puedes). Si una te pone problemas, no te quedas a cero.

**Operación (esto es lo que mantiene el historial limpio)**
- Envío en **24–72 h desde España**, siempre con **tracking** cargado en la plataforma.
- **Descripción honesta** del estado (nuevo / devolución / tara / outlet) con fotos reales.
- Política de devoluciones **visible** y fácil; contacto visible.
- **Responde en < 24 h.** Atender rápido antes de que el cliente abra disputa es la palanca nº 1.
- **Crecimiento gradual.** No pases de 0 a 300 pedidos/día. Los picos sin histórico disparan reservas.
- Guarda **prueba de entrega** de cada pedido (para ganar disputas de "no recibido").

**Qué NO hacer**
- No vender falsificaciones, réplicas ni productos con problemas de marca/IP.
- No categorías de alto riesgo de pasarela al inicio (suplementos, etc. — ver `docs/04`).
- No reclamos exagerados ni urgencia falsa ("solo quedan 2" si no es verdad).
- No prometer stock/plazos que no puedes cumplir.

## Semáforo de disputas (revísalo cada semana)

| Métrica | Verde | Ámbar | Rojo (frena y corrige) |
|---|---:|---:|---:|
| Tasa de disputas | < 0,3 % | 0,3–0,5 % | > 0,5 % |
| Devoluciones | < 5 % | 5–8 % | > 10 % |
| Tiempo de envío | 24–72 h | 72 h–5 d | > 5 d sin explicación |
| Reservas/retenciones pasarela | 0 | 1 puntual | recurrentes |

## Plan de contingencia (si aun así te retienen fondos)

1. **No discutas, aporta pruebas**: tracking + prueba de entrega + factura de compra del lote.
2. Ten un **procesador de respaldo** ya activo (por eso dos vías desde el día uno).
3. Mantén **colchón de caja**: nunca dependas de una liquidación concreta para pagar el siguiente lote.
4. Si Stripe abre una "reserva rolling", cúmplela y baja el ritmo de captación unos días; el historial
   limpio la levanta.
