# 15 · Pricing — escenarios para un anillo "de chollo"

> Ejemplo trabajado: ¿a qué precio hay que dejar un anillo de acero dorado para que sea **chollo** y aun
> así deje margen? Aplica el método de `docs/05` (margen NETO real, no aparente) al caso concreto.

## La idea clave (léela antes de los números)

**"Chollo" no es un precio bajo absoluto; es un precio claramente por debajo de lo que parece que
vale.** El anillo de acero que parece de joyería y en tienda costaría 18-25 € → tú lo dejas en ~10 € →
**se percibe como chollo**, y aun así te deja buen margen porque el acero cuesta poco.

El error mortal en bisutería pequeña: **el envío**. Un anillo pesa nada, pero enviarlo cuesta ~3 €. Si lo
vendes a 5 € con envío gratis, **pierdes dinero**. Por eso hay un **suelo de precio** por debajo del cual
no es chollo, es ruina.

## El ancla de mercado (para que se perciba chollo)

| Referencia | Precio típico de un anillo de acero dorado |
|---|---|
| Marcas tipo Singularu / Parfois / PDPaola-lite | 15-30 € |
| Genérico en marketplace | 6-12 € |
| **Tu zona "chollo" (parece de marca, precio de bazar)** | **8-13 €** |

Vender a 3-5 € **no** te hace más chollo: te hace parecer *cutre* (baja calidad percibida) y te deja sin
margen. El punto dulce es **"parece de 20 €, lo tienes por 9,95 €"**.

## La cuenta real (todos los costes de un anillo)

```
Coste real = coste proveedor (con IVA+recargo, no deducible) + packaging + envío (si lo absorbes)
             + comisión de canal + devoluciones esperadas

Neto = precio de venta − comisión − envío absorbido − packaging − coste − devoluciones
```

Supuestos de planificación (ajústalos a tu caso):
- Coste proveedor del anillo: **2,00 €** (acero dorado; con recargo de equivalencia ya incluido).
- Packaging (bolsita + sobre acolchado): **0,50 €**.
- Envío real: **3,00 €** (carta/sobre acolchado nacional).
- Comisión de canal: **~10 %** (marketplace tipo eBay/Amazon; Wallapop menos; Shopify+Stripe ~3 %).
- Devoluciones esperadas: **~5 %** del precio.

---

## Escenario A — Envío GRATIS (lo absorbes tú)

El envío gratis convierte mejor, pero al ser pieza pequeña **te obliga a subir el precio**.

| Precio venta | −Comisión 10% | −Envío 3,00 | −Pack 0,50 | −Coste 2,00 | −Devol 5% | **NETO €** | **Neto %** |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 5,95 € | 0,60 | 3,00 | 0,50 | 2,00 | 0,30 | **−0,45 €** | ❌ pierdes |
| 7,95 € | 0,80 | 3,00 | 0,50 | 2,00 | 0,40 | **1,25 €** | 16 % |
| **9,95 €** | 1,00 | 3,00 | 0,50 | 2,00 | 0,50 | **2,95 €** | **30 %** ✅ |
| 12,95 € | 1,30 | 3,00 | 0,50 | 2,00 | 0,65 | **5,50 €** | 42 % |
| 14,95 € | 1,50 | 3,00 | 0,50 | 2,00 | 0,75 | **7,20 €** | 48 % |

👉 Con envío gratis, **por debajo de ~9,95 € no hay negocio.** Ese es tu suelo.

## Escenario B — Envío aparte (lo paga el cliente)

Mejor margen, pero más fricción y el precio final que ve el cliente sube.

| Precio venta (+ envío) | −Comisión 10% | −Pack 0,50 | −Coste 2,00 | −Devol 5% | **NETO €** | **Neto %** |
|---:|---:|---:|---:|---:|---:|---:|
| 6,95 € (+2,95) | 0,70 | 0,50 | 2,00 | 0,35 | **3,40 €** | 49 % |
| 7,95 € (+2,95) | 0,80 | 0,50 | 2,00 | 0,40 | **4,25 €** | 53 % |
| 9,95 € (+2,95) | 1,00 | 0,50 | 2,00 | 0,50 | **5,95 €** | 60 % |

👉 Aquí puedes ser "más chollo" en el número (6,95 €) y ganar más, **pero** el cliente ve "6,95 + 2,95
envío" y algunos abandonan.

## Escenario C (recomendado) — Precio chollo + envío gratis A PARTIR DE X

Lo mejor de los dos: **anillo a 9,95 €, envío 2,95 € suelto, GRATIS a partir de 19,90 €.**

- Quien compra 1 anillo → paga envío (tú cubres coste).
- Quien quiere envío gratis → **se lleva 2-3 piezas** → sube el ticket y el envío se diluye entre varias.

Ejemplo de pedido de 2 piezas a 9,95 € con envío gratis absorbido:
```
Ingreso 19,90 € − comisión 1,99 € − envío 3,00 € − packaging 0,70 € − coste 4,00 € − devol 1,00 €
= 9,21 € neto  (46 %)
```
El envío se reparte entre 2 piezas → margen sano **y** sensación de chollo **y** ticket más alto.

---

## Sensibilidad al coste del proveedor (a 9,95 €, Escenario A envío gratis)

| Coste proveedor | Neto € | Neto % |
|---:|---:|---:|
| 1,00 € | 3,95 € | 40 % |
| 2,00 € | 2,95 € | 30 % |
| 3,00 € | 1,95 € | 20 % |

Cuanto más barato compres, más margen o más agresivo puedes ser en precio. Por eso el **flywheel de
compra** (reinvertir, comprar más, mejor precio) importa (`docs/08`).

## Reglas de pricing chollo (resumen)

1. **Suelo con envío gratis: ~9,95 €** para un anillo. Por debajo, pierdes.
2. **Ancla siempre:** muestra el valor percibido ("en tienda ~20 €, aquí 9,95 €") — honesto, sin inflar
   falsos "antes" (`docs/01`).
3. **Precios psicológicos:** terminaciones en ,95 / ,99.
4. **Envío gratis a partir de 19,90-24,90 €** → empuja a llevar 2-3 piezas (sube ticket, diluye envío).
5. **Packs regalo** (2-3 piezas + packaging) → ticket más alto, encaja con el ángulo regalo (`docs/14`).
6. **Objetivo de margen neto: 30 %+** por pieza suelta; 40 %+ en pedidos de 2+.
7. **No bajes de calidad percibida por precio:** un chollo que parece cutre no repite.

## Lo que necesito de ti para cerrar los números reales
- **¿Cuánto te cuesta el anillo del proveedor** (con IVA + recargo incluidos)?
- **¿A cuánto se venden anillos parecidos** que ya has visto (tu ancla real)?
- **¿Envío gratis sí o no** como estrategia, o gratis a partir de X?

Con esos 3 datos fijo la tabla de precios definitiva de toda la colección, no solo del anillo.

## Resumen en una frase

**Para que un anillo sea chollo rentable, déjalo en ~9,95 € (suelo con envío gratis) anclado a un valor
percibido de 18-25 €, y usa "envío gratis a partir de ~20 €" para que la gente se lleve 2-3 piezas: así el
envío no te come el margen, parece un chollo de verdad y el ticket sube.**
