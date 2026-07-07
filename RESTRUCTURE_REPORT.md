# Informe de reestructuración modular — Pragma Studio

> Reorganización integral de la arquitectura del front-end. **No se agregó ninguna
> funcionalidad ni se cambió comportamiento, lógica de negocio, validaciones,
> permisos, estilos ni textos.** El resultado funcional es idéntico al anterior.

---

## 1. Resumen de la reestructuración

Toda la aplicación cliente vivía en un **único `index.html` de 6.875 líneas** con un
solo bloque `<script>` (6.662 líneas de JavaScript), mezclando estado, lógica de
negocio, interfaz y servicios. Se dividió ese script en **37 archivos** organizados
por dominio bajo `src/`, cargados como **`<script src>` clásicos ordenados**.

Decisión arquitectónica clave: al mantenerse como scripts **clásicos** (no ES
modules), todas las funciones y el objeto `state` **siguen en el scope global**, por
lo que los **~174 handlers inline** (`onclick`, `onsubmit`, …) y el dispatcher
`views{}` funcionan **sin ningún cambio**. No se introdujo React, TypeScript,
bundler ni ninguna librería nueva (se respetaron las restricciones "no cambiar
framework" y "no agregar librerías").

**Garantía de comportamiento idéntico (no una promesa, un hecho verificable):** todos
los cortes se hicieron **entre sentencias de nivel superior** y los archivos se
incluyen **en el orden original**, de modo que la **concatenación de los `src/` es
byte-idéntica al script original**. Se verificó reconstruyendo `index.html` a partir
de los fragmentos y comparándolo carácter por carácter con la versión previa: **son
idénticos**.

| Métrica | Antes | Después |
|---|---|---|
| `index.html` | 6.875 líneas (todo) | 248 líneas (markup + estilos + 37 includes) |
| Archivos JS del front | 1 (monolito) | 37 (por dominio) |
| Archivo más grande | 6.662 líneas | 788 líneas (`presupuestos.views.js`, template de impresión) |
| Framework / librerías nuevas | — | ninguna |

---

## 2. Nueva estructura de carpetas

```
index.html                      ← solo markup + <style> + CDNs + 37 <script src>
src/
  app/                          ← arranque y orquestación
    state.js                    (DEFAULT_STATE, currentView, currentMemberId…)
    nav.js                      (NAV, dispatcher render(), viewHeader)
    export-import.js            (backup / restore de estado)
    keyboard.js                 (atajos de teclado)
    boot.js                     (secuencia de arranque — se carga ÚLTIMO)
  shared/                       ← transversal a todos los módulos
    constants.js                (INCOME_STATUS, EXPENSE_STATUS, categorías…)
    utils.js                    (getProject, getClient, fmt, fmtMoney, uid…)
    utils.dom.js                (escapeHtml, escapeAttr)
    services/
      auth.js                   (login Supabase Auth + init de estado)
      supabase.js               (cloud sync: initSupabase, save/load, realtime)
      api.js                    (getAuthToken, callApi — cliente HTTP hacia /api)
    ui/
      modals.core.js            (openModal, closeModal)
      notifications.js          (panel de notificaciones)
      render-helpers.js         (statCard, taskRow — UI reutilizable)
  modules/                      ← un dominio por carpeta
    tareas/       tareas.js · tareas.modals.js
    proyectos/    proyectos.js · proyectos.modals.js
    clientes/     clientes.js
    presupuestos/ presupuestos.model.js · presupuestos.views.js
    finanzas/     finanzas.core.js · finanzas.calc.js · finanzas.controls.js ·
                  finanzas.render.js · finanzas.modals.js · pagos.js ·
                  tipo-cambio.js · recordatorios-pago.js
    facturacion/  facturacion.model.js · facturacion.ui.js ·
                  facturacion.pdf.js · facturacion.status.js
    documentos/   documentos.js
    equipo/       equipo.js
    reportes/     reportes.js
    guia/         guia.js
```

El backend serverless (`api/afip/emitir.js`, `estado.js`, `ultimo.js` y
`lib/afip-helpers.js`) ya estaba correctamente modularizado y **no se tocó**.

---

## 3. Archivos creados (37)

| Archivo | Líneas | Contenido |
|---|---:|---|
| `src/app/state.js` | 45 | Estado por defecto y variables globales de vista |
| `src/app/nav.js` | 85 | Menú, dispatcher `render()`, `viewHeader` |
| `src/app/export-import.js` | 30 | Exportar/importar backup |
| `src/app/keyboard.js` | 6 | Atajos de teclado |
| `src/app/boot.js` | 36 | Arranque (último include) |
| `src/shared/constants.js` | 31 | Constantes de estado/categorías |
| `src/shared/utils.js` | 136 | Helpers de dominio y formato |
| `src/shared/utils.dom.js` | 6 | `escapeHtml` / `escapeAttr` |
| `src/shared/services/auth.js` | 131 | Login Supabase + init de estado |
| `src/shared/services/supabase.js` | 188 | Cloud sync + realtime + `save`/`load` |
| `src/shared/services/api.js` | 23 | Cliente HTTP (`callApi`, `getAuthToken`) |
| `src/shared/ui/modals.core.js` | 15 | `openModal` / `closeModal` |
| `src/shared/ui/notifications.js` | 67 | Panel de notificaciones |
| `src/shared/ui/render-helpers.js` | 28 | `statCard`, `taskRow` |
| `src/modules/tareas/tareas.js` | 192 | Vista de tareas + Gantt |
| `src/modules/tareas/tareas.modals.js` | 265 | Modales de tarea |
| `src/modules/proyectos/proyectos.js` | 510 | Vista de proyectos + generador de prompt |
| `src/modules/proyectos/proyectos.modals.js` | 251 | Modales de proyecto/perfil |
| `src/modules/clientes/clientes.js` | 114 | Módulo Clientes (ABM) |
| `src/modules/presupuestos/presupuestos.model.js` | 267 | Modelo de pricing + constantes |
| `src/modules/presupuestos/presupuestos.views.js` | 788 | Vistas y PDF de presupuestos |
| `src/modules/finanzas/finanzas.core.js` | 297 | Núcleo de finanzas |
| `src/modules/finanzas/finanzas.calc.js` | 76 | Conversión de moneda / cálculos |
| `src/modules/finanzas/finanzas.controls.js` | 137 | Controles de vista (mes, moneda…) |
| `src/modules/finanzas/finanzas.render.js` | 605 | `renderFinance` |
| `src/modules/finanzas/finanzas.modals.js` | 202 | Modales de ingreso/gasto |
| `src/modules/finanzas/pagos.js` | 245 | Pagos parciales |
| `src/modules/finanzas/tipo-cambio.js` | 126 | Cotización del dólar |
| `src/modules/finanzas/recordatorios-pago.js` | 138 | Mensajes de cobro |
| `src/modules/facturacion/facturacion.model.js` | 78 | Constantes AFIP + cálculos de saldo |
| `src/modules/facturacion/facturacion.ui.js` | 511 | Modal/preview/emisión de factura |
| `src/modules/facturacion/facturacion.pdf.js` | 200 | PDF + QR de la factura |
| `src/modules/facturacion/facturacion.status.js` | 32 | Healthcheck AFIP |
| `src/modules/documentos/documentos.js` | 173 | Documentos y recursos |
| `src/modules/equipo/equipo.js` | 368 | Equipo + settings |
| `src/modules/reportes/reportes.js` | 123 | Reportes |
| `src/modules/guia/guia.js` | 81 | Manual |

Total: **6.606 líneas** repartidas (vs. 6.662 en un solo archivo; la diferencia son
las líneas de `renderHome` eliminadas).

---

## 4. Archivos movidos

- **`index.html` → `src/**/*.js`**: el cuerpo del `<script>` (líneas 211–6872) se
  trasladó íntegro a los 37 archivos, preservando el orden. `index.html` conserva
  únicamente `<head>`, `<style>`, el markup del `<body>` y la lista de includes.
- Las dos "mega-secciones" (AFIP+finanzas ≈1.900 líneas y MODALS ≈730) se cortaron
  en **límites de función** y cada función se ubicó en la carpeta de su dominio
  (p. ej. `openProjectModal` → `modules/proyectos/proyectos.modals.js`;
  `openIncomeModal` → `modules/finanzas/finanzas.modals.js`).

---

## 5. Archivos eliminados

- **`src/modules/inicio/home.js`** (transitorio): la sección HOME contenía la función
  muerta `renderHome` junto a dos helpers vivos. Se eliminó el archivo; los helpers
  vivos se movieron a `src/shared/ui/render-helpers.js` y se removió la función muerta.
- No se eliminó ningún archivo preexistente del repo. `pragma.html` (variante legacy
  standalone) se dejó **intacta**, fuera de alcance.

---

## 6. Componentes reutilizables extraídos

En vanilla no hay componentes de framework; los equivalentes son **funciones de
render reutilizables**, ahora centralizadas en `src/shared/ui/`:

- `openModal` / `closeModal` (`modals.core.js`) — contenedor de modales usado por todos los módulos.
- Panel de notificaciones (`notifications.js`).
- `statCard`, `taskRow` (`render-helpers.js`) — usados por reportes y tareas.
- `viewHeader` (`app/nav.js`) — encabezado estándar de cada vista.
- `showToast` (`shared/utils.js`) — sistema de toasts.

---

## 7. Servicios creados

Todas las llamadas al backend/externas quedaron concentradas en `src/shared/services/`:

- **`api.js`** — `callApi()` y `getAuthToken()`: cliente HTTP hacia `/api/afip/*`.
- **`supabase.js`** — inicialización del cliente, `save`/`load`, sincronización realtime.
- **`auth.js`** — login por Supabase Auth y arranque del estado.

(La cotización del dólar via `fetch` a bluelytics quedó en `modules/finanzas/tipo-cambio.js`
por ser específica de ese dominio; el envío por EmailJS se mantiene junto a sus llamadores.)

---

## 8. Hooks creados

**No aplica.** "Hooks" es un concepto de React; este proyecto es vanilla JS sin
framework. El equivalente —lógica con estado reutilizable— se resolvió con módulos de
lógica compartida (`shared/utils.js`, `shared/services/*`). Introducir hooks reales
exigiría migrar a React, lo que contradice las restricciones acordadas.

---

## 9. Tipos centralizados

**No aplica en runtime** (no hay TypeScript). Las formas de datos del dominio (`state`,
`project`, `client`, `invoice`, `budget`) ya están documentadas como comentarios de
schema en `src/app/state.js`. La adición de `@typedef` JSDoc centralizados queda
propuesta como mejora futura (ver §11), sin agregar dependencias.

---

## 10. Código muerto eliminado

- **`renderHome()`** — función sin ninguna referencia (no estaba en `NAV`, ni en el
  dispatcher `views{}`, ni se invocaba en ningún lado; verificado por `grep` en todo el
  repo). Era, además, la única portadora de un bug latente (`state.clients.length`
  cuando `clients` no existía, ya resuelto). Se eliminó.
- Se conservó **todo** el demás código. Los helpers que compartían su sección
  (`statCard`, `taskRow`) **sí** tienen referencias y se preservaron (movidos a
  `shared/ui/`). No se eliminó nada cuya utilidad no estuviera probadamente en cero.

---

## 11. Posibles mejoras futuras (no implementadas)

1. **Encapsular el estado en un store**: hoy `state` es un objeto global mutado
   directamente (307 accesos). Un módulo `store` con getters/setters y suscripciones
   reduciría el acoplamiento — requiere refactor de comportamiento, fuera de alcance.
2. **Event delegation** para retirar los ~174 handlers inline (`onclick="…"`) y pasar a
   `addEventListener`, habilitando encapsulación real por módulo.
3. **Tipado gradual con JSDoc + `// @ts-check`**: `@typedef` centralizados en
   `shared/types.js` y chequeo de tipos sin agregar build ni cambiar a `.ts`.
4. **Tests automatizados** (unitarios de cálculos de finanzas/facturación y de humo de
   vistas) para blindar futuras refactorizaciones.
5. **Dividir `presupuestos.views.js` y `finanzas.render.js`** (los dos archivos más
   grandes) separando el template de impresión de la vista interactiva.
6. **Resolver `pragma.html`**: confirmar si sigue en uso o archivarlo.

---

## 12. Confirmación explícita de no-modificación de funcionalidad

Se confirma que **no se modificó ninguna funcionalidad, flujo, permiso, regla de
negocio, validación, estilo ni texto**. Respaldo objetivo:

- **Equivalencia byte a byte** (commit de reestructuración): `index.html` reconstruido
  a partir de los 37 archivos es **idéntico** al original — el JavaScript ejecutado es
  exactamente el mismo, en el mismo orden y el mismo scope global.
- **Parseo** de los 37 archivos sin errores; sin `import`/`export` ni `type="module"`.
- **Resolución de handlers**: todos los handlers inline resuelven a funciones globales
  definidas.
- **Humo en navegador** (Chromium): las **10 vistas** (tareas, proyectos, clientes,
  presupuestos, finanzas, reportes, documentos, recursos, equipo, manual) renderizan sin
  errores; las globales y flujos ya validados (alta de cliente, precarga de condición
  IVA) siguen funcionando; sin errores de página ni recursos `/src/` faltantes.
- La única diferencia funcional respecto al monolito es **subtractiva y segura**: la
  eliminación de la función muerta `renderHome`, sin referencias.
