# 10 · Modelo de venta y fulfillment — ¿con stock o sin stock?

> Nicho bloqueado: **organización y almacenaje del hogar/cocina** (`docs/09`).
> Este documento decide **cómo vendemos físicamente**: quién tiene el producto, quién lo envía, cómo, en
> cuánto tiempo, y cómo escala. Es la respuesta directa a "¿con stock o sin stock?".

## La respuesta corta

**Con stock propio ligero como núcleo (≈80 %), validando la demanda ANTES de comprar en profundidad, y
vendiendo primero en marketplaces.** El "sin stock" (dropshipping) solo se usa como *test* puntual de
productos nuevos, con proveedor **europeo**, y **nunca** como corazón del negocio.

Por qué: el stock propio es lo que te da **envío rápido + descripción honesta + control**, y eso es
exactamente lo que mantiene **disputas bajas y la pasarela sana** (tu restricción #2). El dropshipping
chino es lo contrario: envíos lentos, calidad variable, disputas → **es la vía más rápida a un baneo**.
En online, el equivalente sano de Action no es AliExpress: es *stock propio + entrega rápida*.

---

## Los 3 modos de venta (y cuándo usar cada uno)

Trabajamos con tres modos. La gracia es empezar por los de **menor riesgo de capital** y pasar a stock en
profundidad **solo cuando hay señal de demanda**.

### 🟢 Modo A — Stock propio (NÚCLEO, ~80 %)
Compras un lote de overstock/liquidación, lo tienes en casa, y **envías tú en 24-72 h**.
- **Ventaja:** control total, envío rápido, descripción real, márgenes buenos, disputas bajas.
- **Cuándo:** para todo producto **ya validado** que rota.
- **Es el modo que copia la lógica económica de Action** (comprar barato por oportunidad + rotar).

### 🟡 Modo B — Pre-venta / drop bajo demanda (para LANZAR sin arriesgar capital)
Anuncias un producto o un "drop" a tu lista/marketplace, **recoges pedidos** y luego compras/envías.
- **Ventaja:** cero capital inmovilizado; validas demanda real antes de comprar el lote entero.
- **Regla de honestidad:** el plazo tiene que ser **corto y real** (p. ej. "envío en 3-5 días, es
  preventa") y **comunicado claramente**. Nunca prometas 24 h si es preventa. (Protege la pasarela.)
- **Cuándo:** para **testear un SKU nuevo** o medir el interés de un drop antes de comprometer caja.

### 🔴 Modo C — Dropshipping SOLO UE (COMPLEMENTO, <20 %, jamás núcleo)
Un proveedor **europeo** envía por ti. Solo para **probar demanda** de un producto nuevo sin comprar lote.
- **Requisitos innegociables:** proveedor UE, envío 2-5 días, **tracking real**, producto legal en UE
  (CE/GPSR), política de devolución clara, producto **probado antes** por ti.
- **Prohibido:** AliExpress / dropshipping chino como base. (Envíos lentos + disputas = baneo asegurado.)
- **Cuándo:** test rápido. Si el producto funciona → se pasa a **Modo A** (comprar el lote y tenerlo tú).

### El árbol de decisión

```
¿Tengo señal de que este producto se vende (contenido viral / preguntas / preventa)?
│
├─ NO  →  Testear barato:  Modo B (preventa)  o  Modo C (dropship UE, 1 SKU)
│         └─ ¿Rota?  ── NO → descartar el SKU
│                      └─ SÍ ↓
└─ SÍ  →  Comprar lote de overstock y pasar a  Modo A (stock propio en profundidad)
```

**Resumen:** el riesgo se toma **después** de la señal, no antes. Compramos en profundidad lo que ya
demostró que rota. Eso es "arrasar" sin arriesgar.

---

## ¿Dónde se guarda el stock? (empezar en casa)

| Fase | Dónde | Coste |
|---|---|---|
| Arranque | **Casa** (una habitación/trastero) con estanterías | ~0 € |
| Crecimiento | **Trastero/mini-almacén** en alquiler (5-15 m²) | ~50-150 €/mes |
| Escala | **3PL** (logística externa) o **Amazon FBA** solo para winners | variable |

Sistema mínimo desde el día 1: **estanterías + ubicaciones simples** (A1, A2, B1…) y cada SKU con su hueco.
Un móvil y una hoja de control (`docs/05`) bastan. No hace falta almacén "de verdad" hasta que el volumen
lo exija (regla de `docs/03`: no montar infraestructura por adelantado).

## ¿Cómo se envía? (rápido y con tracking siempre)

- **Transportistas:** Correos / Correos Express / GLS / SEUR con **tarifa e-commerce**. Para conseguir esas
  tarifas y generar tracking automático, usa un **agregador de envíos** (tipo Packlink / Sendcloud): eliges
  el transportista más barato por paquete y la etiqueta + seguimiento se generan solos.
- **Plazo objetivo:** **24-72 h desde España**, con **tracking cargado siempre** en la plataforma. Esto es
  innegociable: es la palanca nº1 de salud de pasarela (`docs/01`).
- **Embalaje:** sobre acolchado o caja pequeña, protección suficiente para que no llegue roto (roturas =
  disputas). Marca simple impresa/pegatina. Coste de embalaje **contado en el margen** (`docs/05`).
- **Descriptor y comunicación:** email/mensaje automático de "pedido enviado + tracking". Reduce el "no sé
  nada de mi pedido" que acaba en disputa.

## ¿Cómo se gestionan las devoluciones?

- **Desistimiento 14 días** (B2C online) visible y fácil (`docs/04`).
- Al recibir una devolución: revisar → si está perfecta, vuelve a stock A; si tiene tara, stock B con tara
  informada; si no, stock C (liquidar).
- Responder **rápido y bien** antes de que el cliente abra disputa. Una devolución bien gestionada = cliente
  que repite; una mal gestionada = disputa que daña la pasarela.

---

## ¿Por qué canal cobramos? (blindaje de pago — recordatorio de `docs/01`)

El **modo de venta** (stock/sin stock) es independiente del **canal de cobro**. Secuencia:

1. **Marketplaces primero** (Wallapop, eBay, Amazon): **el marketplace cobra al cliente y te liquida a ti**
   → tú **no expones ninguna pasarela** → cero riesgo de baneo durante el historial cero.
2. **Tienda propia después** (Fase 2, `docs/03`): ya con historial y aislamiento, das de alta pasarela
   (Stripe/Shopify Payments + PayPal + Bizum) **a nombre de la entidad separada** (`docs/02`).

Así, aunque vendas con stock propio desde el día 1, **el riesgo de pasarela no aparece hasta que estás
listo**.

---

## Cómo funciona una venta de principio a fin (walkthrough)

**Ejemplo: dispensador hermético de cereales (Modo A, stock propio, canal marketplace)**

1. Compraste un palé de organización de cocina con manifiesto → 40 dispensadores a 3,10 €/ud puestos en casa.
2. Grabas un vídeo *antes/después* de la despensa → sube a TikTok/Reels → empuja a tu lista y a tu anuncio.
3. El cliente compra en el marketplace a 9,90 €. **El marketplace cobra**; a ti te llegará la liquidación.
4. Preparas el pedido, generas etiqueta con el agregador, envías por Correos Express → **entrega en 48 h con
   tracking**.
5. Mandas mensaje "enviado + tracking". El cliente recibe, contento, deja 5 estrellas.
6. Registras la venta en la hoja de control (margen neto real, tiempo de venta).
7. Cuando queden pocas unidades → "últimas unidades, no repongo" (urgencia **real**) → y decides si
   recomprar ese SKU (rota bien) o no.

Margen de ejemplo: 9,90 € venta − ~1,5 € comisión − ~2,8 € envío − 3,10 € coste − 0,4 € embalaje ≈ **2,1 €
neto/ud (~21 %)**. Se ajusta con precio/envío/volumen (`docs/05`).

---

## Empezamos: kickoff del nicho (T1)

### Productos-héroe candidatos (organización cocina + armario)
Busca estos en el primer palé; son baratos, virales (antes/después), ligeros y de bajo riesgo legal:

1. Dispensador hermético de cereales/arroz.
2. Set de botes herméticos de despensa.
3. Organizador extensible de cajón (cubiertos/utensilios).
4. Especiero / gradas organizadoras de especias.
5. Bolsas de vacío para ropa/edredones (armario).
6. Cajas organizadoras apilables transparentes.
7. Estante extraíble / organizador bajo fregadero.
8. Ganchos adhesivos sin taladro.
9. Organizador de tapas y sartenes.
10. Cajas de tela plegables para armario.
11. Bandejas apilables organizadoras de nevera.
12. Soporte/organizador de film, papel y bolsas.

**Criterio de selección:** pequeño/plano (envío barato), demostrable en vídeo, sin CE complejo, margen neto
>20 % (`docs/05`).

### Primeros pasos accionables
- [ ] Montar el **cortafuegos** (email, banco, marca, navegador dedicados) — `docs/02`. **Antes de vender.**
- [ ] Abrir cuentas de vendedor (Wallapop/eBay) a nombre del proyecto.
- [ ] Fase 0: validar 5-8 de estos productos con **Modo B (preventa)** o mini-compras, midiendo qué rota.
- [ ] Con la señal, comprar **1 palé** de organización de cocina con manifiesto (`docs/05`, checklist).
- [ ] Clasificar A/B/C, calcular coste real/ud, publicar y **grabar 1 vídeo/día** *antes/después*.
- [ ] Todo empuja a la **lista** (WhatsApp/Telegram/email) → construir el foso (`docs/08`).

---

## Resumen en una frase

**Vendemos con stock propio ligero de overstock de organización, comprado en profundidad solo tras validar
la demanda (con preventa o un test de dropshipping UE), enviado por nosotros en 24-72 h con tracking, y
cobrado primero por marketplaces para no exponer la pasarela — control alto, disputas bajas, capital
eficiente.**
