# 05 · Operativa: sourcing, pricing, treasure hunt, KPIs

## 1. Fuentes de aprovisionamiento

| Tipo | Ventaja | Riesgo |
|---|---|---|
| Mayoristas de liquidación | Precio bajo, disponibilidad rápida | Calidad variable |
| Overstock europeo | Producto nuevo o casi nuevo | Lotes irregulares |
| Devoluciones de grandes retailers | Precio muy bajo | Merma, roturas, incompletos |
| Subastas B2B | Buenas oportunidades | Hay que saber valorar rápido |
| Fabricantes con excedente | Producto más limpio | Acceso más difícil |
| Cierres de tienda | Margen alto potencial | Mucho trabajo de clasificación |
| Distribuidores locales | Menor riesgo logístico | Menor descuento |

Marketplaces/fuentes habituales de lotes (usar **con checklist**, nunca a ciegas): Merkandi,
LiquidacionesDeStocks, Liquistocks, SubastaLotes, CompraDevoluciones, Europages, B-Stock, Liquidity
Services, Troostwijk.

## 2. Checklist ANTES de comprar un lote

**Regla:** *si no puedes calcular el margen real antes de comprar, no estás comprando: estás apostando.*

1. Precio total con IVA/recargo y **transporte** incluidos.
2. Nº de unidades y **precio unitario real puesto en tu almacén**.
3. Estado: nuevo / devolución / tara / outlet / reacondicionado.
4. **Fotos reales** y **manifiesto/listado**.
5. **% de merma** esperable.
6. ¿Marcado **CE** obligatorio? ¿Instrucciones en español? ¿Datos de fabricante/responsable UE? *(GPSR, `docs/04`)*
7. ¿Riesgo de **falsificación** o marcas/licencias protegidas? → si lo hay, **descartar**.
8. **Precio de mercado** real en Wallapop/eBay/Amazon/Google Shopping.
9. Velocidad probable de venta, espacio necesario, facilidad de envío, riesgo de devolución.
10. **Margen neto tras comisiones.**

## 3. Pricing: calcular margen REAL (no el aparente)

```text
Coste real unitario = coste lote + transporte + IVA/recargo no recuperable + merma esperada
                      + embalaje + manipulación

Precio neto recibido = precio venta − comisión marketplace/pasarela − envío asumido
                      − coste de devolución esperado

Margen neto   = precio neto recibido − coste real unitario
Margen neto % = margen neto / precio venta
```

"Compré a 2 € y vendo a 5 €" es margen **aparente**, no rentabilidad.

### Objetivos prudentes al inicio

| Métrica | Objetivo |
|---|---:|
| Margen bruto aparente | 40 %–60 % |
| Margen **neto** (tras comisiones/envío) | 15 %–30 % |
| Merma máxima asumible | 5 %–15 % según categoría |
| Venta del lote en 60–90 días | > 70 % |
| Disputas | < 0,5 % (nunca cerca de 0,75 %) |
| Devoluciones | < 5 %–8 % en categorías simples |
| Stock muerto a 90 días | < 20 % |

## 4. Treasure hunt online (el "efecto Action")

Mecánicas concretas y **honestas**:
- **Drop fijo** semanal/quincenal ("Novedades del jueves").
- **Lotes limitados reales**: cuando se acaba, se acaba (sin restock garantizado).
- Páginas de **recién llegados**, **últimas unidades**, **chollos por menos de X €**.
- **Vídeos de apertura de lote** + storytelling de por qué está barato.
- Lista **WhatsApp/Telegram** + **email semanal** corto con las mejores oportunidades.
- Ranking de más vendidos de la semana.

**Urgencia honesta.** La escasez debe ser real. Nunca "solo quedan 2 unidades" si no es verdad, ni
temporizadores falsos. La frase correcta:
> "Compramos lotes limitados. Algunos productos no vuelven cuando se agotan."

*(La urgencia falsa dispara disputas y baneos de pasarela — `docs/01`.)*

## 5. Ciclo de liquidación (no acumular stock muerto)

| Momento | Acción |
|---|---|
| Día 0–30 | Precio objetivo |
| Día 31–60 | Pequeña rebaja si no rota |
| Día 61–90 | Liquidación agresiva |
| Día 90+ | Pack, lote, devolución a proveedor si existe, o venta a pérdidas controlada |

**El espacio ocupado por stock muerto también cuesta dinero.** Action rota; no acumula por orgullo.

## 6. Hoja de control mínima (por lote)

Registra desde el primer lote: **ID lote · proveedor · fecha compra · coste total · transporte · unidades
totales · unidades A/B/C · merma · precio objetivo · precio mínimo · canal de venta · comisión canal ·
tiempo medio de venta · margen neto · incidencias · devoluciones · disputas · stock restante a
30/60/90 días.**

> Plantilla lista para usar: [`../plantillas/hoja-control-lotes.csv`](../plantillas/hoja-control-lotes.csv)

## 7. KPIs de decisión (semáforo)

| KPI | Bueno | Peligro (frena y corrige) |
|---|---:|---:|
| % lote vendido en 60 días | > 60–70 % | < 40 % |
| Margen neto por lote | > 15–25 % | < 10 % |
| Merma | < 10 % | > 20 % |
| Devoluciones | < 5–8 % | > 10–15 % |
| Disputas | < 0,5 % | > 0,75 % |
| Tiempo de envío | 24–72 h | > 5 días sin explicación |
| Stock muerto a 90 días | < 20–30 % | > 40 % |
| Recompra | creciente | inexistente |

**Si los KPIs fallan, no se escala: se corrige.**
