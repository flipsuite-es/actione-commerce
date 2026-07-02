# PROMPT PARA NUEVAS SESIONES

> Copia y pega **todo el bloque de abajo** como primer mensaje en cada sesión nueva
> de Claude para que recupere el contexto a la perfección. (Si el entorno es Claude
> Code, además cargará `CLAUDE.md` solo; pegar esto lo refuerza y le da las órdenes.)

---

```
Retomamos el proyecto OUCY STUDIOS (tienda de joyería de acero dorado, e-commerce
propio). Antes de responder a nada, LEE Y ASIMILA todo el contexto del repositorio
en este orden y confírmame que lo has hecho con un resumen de 5 líneas:

1) CLAUDE.md
2) docs/contexto/ESTADO.md
3) docs/contexto/PENDIENTES.md
4) docs/contexto/DECISIONES.md

Reglas de esta colaboración (respétalas siempre):
- Trabaja SOLO en este repositorio (flipsuite-es/actione-commerce), rama
  main (rama única y de producción). Aislamiento total: no toques ni
  menciones mis otros proyectos.
- La tienda sigue en PRE-LANZAMIENTO (muro con código). No la hagas pública hasta
  que yo lo diga.
- Verifica que compila (npm run build) antes de subir. Haz commit + push a la rama
  (Vercel redespliega solo). Nunca subas secretos.
- MUY IMPORTANTE: mantén el contexto SIEMPRE ACTUALIZADO. Cada vez que cambies algo
  o tomemos una decisión, ACTUALIZA CLAUDE.md y docs/contexto/ESTADO.md y
  docs/contexto/PENDIENTES.md (y DECISIONES.md si aplica) y haz push, para que en la
  próxima sesión tengas contexto perfecto. Recuérdamelo si me olvido.

El conector de Supabase YA está autorizado para la org "Oucy Studios" (proyecto
jedyummyygniixuyzbck), así que puedes gestionar la base de datos tú mismo. La
migración 002_backoffice.sql YA está aplicada. El siguiente paso es cargar el
catálogo real por /admin (categorías y productos).

Cuando termines de leer, dime cuál es el siguiente paso según PENDIENTES y seguimos.
```

---

## Notas de uso
- **Cada vez** que abras una sesión nueva, pega ese bloque como primer mensaje.
- El conector de **Supabase ya está autorizado** para la org Oucy: Claude gestiona la
  base de datos (migraciones, SQL) por sí mismo desde el proyecto `jedyummyygniixuyzbck`.
- Rama única de trabajo y producción: **`main`**. (Las ramas antiguas `claude/…` quedaron
  unificadas en `main` el 2026-07-02.)
- Recuerda: la fuerza de este sistema depende de que los archivos de `docs/contexto/`
  estén **al día**. Exígelo en cada sesión.
