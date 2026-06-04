# SIDEM-PAN — Métricas de Calidad sobre el Código Implementado (Sprint 1)

**Asignatura:** Ingeniería de Software Aplicada IV — **Grupo:** 1GS241
**Integrantes:** Aparicio, Ana · Ferreira, Bruno · Rios, Gerald · Ten Su, Eriel
**Fecha de medición:** 3 de junio de 2026
**Alcance:** Mediciones reales aplicadas sobre el código fuente del Sprint 1 (backend Express + TypeScript y frontend React 19 + Vite) y la integración con Supabase. Complementa y **verifica empíricamente** las métricas documentales de requerimientos y diseño del `AvanceParcial2.md`.

> A diferencia del Parcial 2 (métricas sobre casos de uso y diagrama de clases), este documento aplica las cinco categorías obligatorias de métricas sobre **código ejecutable real** ya construido e integrado, usando herramientas automáticas: **ESLint** (complejidad + plugin de seguridad), **Vitest** (pruebas + cobertura), **npm audit** (vulnerabilidades de dependencias), **git** (productividad) y **conteo de imports** (acoplamiento). Todos los números son reproducibles con los comandos indicados.

---

## 0. Marco de referencia (ISTQB · TMMi · TQM) y proceso de medición

### 0.1 Aplicación de los tres modelos (Unidad II)

| Modelo | Qué aporta | Cómo se aplicó en estas mediciones |
| :- | :- | :- |
| **ISTQB** | Vocabulario y técnicas de prueba/defecto | Diseño de pruebas por **particiones de equivalencia** y **valores límite** sobre los umbrales de scoring (10/50) en `risk-engine.test.ts`. Clasificación de defectos por tipo y severidad (matriz §4.3). |
| **TMMi** | Madurez del proceso de prueba/medición | **Nivel 2–3**: institucionalización de la medición. Se introdujo automatización de pruebas (Vitest) y análisis estático (ESLint) reproducibles, con la meta de incorporarlos como *gates* en CI. |
| **TQM** | Mejora continua y prevención | Cada métrica cierra con una **acción de mejora** trazable a una tarea del backlog (§8). Énfasis en prevención sobre inspección (*quality gates* en CI). |

### 0.2 Ciclo de medición obligatorio

Cada métrica de este informe documenta explícitamente las cinco fases exigidas:

**Objetivo (¿por qué se mide?) → Métrica (definición formal) → Recolección (cómo y con qué herramienta) → Análisis (interpretación) → Acción de mejora (qué se ajusta).**

De este modo, para cada categoría queda visible **qué se midió**, **cómo se midió**, **qué interpretación se obtuvo** y **qué acción de mejora se aplicó**, según lo solicitado en la Unidad II.

### 0.3 Cobertura de las cinco categorías obligatorias

| # | Categoría | Métricas exigidas | Dónde |
| :-: | :- | :- | :-: |
| 1 | **Requerimientos** | Cobertura · Volatilidad · Trazabilidad | §2 |
| 2 | **Diseño** | Complejidad ciclomática · Acoplamiento y cohesión · Diagramas | §3 |
| 3 | **Código** | Densidad de defectos · Code smells · Vulnerabilidades · Debt ratio | §4 |
| 4 | **Clásicas** | KLOC · Productividad · Tasa de defectos | §5 |
| 5 | **Proceso de medición** | Objetivo → Métrica → Recolección → Análisis → Mejora | §0.2 + en cada métrica |

---

## 1. Inventario del código medido (línea base)

| Componente | Archivos | LOC | Incluido en métricas |
| :- | :-: | :-: | :-: |
| Backend TypeScript (`backend/src`) | 12 | **680** | ✅ |
| Frontend propio (`migracheck` + `lib` + `hooks`) | 16 | **2.245** | ✅ |
| SQL (migración inicial + seed) | 2 | **236** | ✅ |
| **Total código propio del equipo** | **30** | **≈ 3.161 LOC (3,16 KLOC)** | ✅ |
| UI generada por shadcn (`frontend/src/components/ui`) | 57 | 4.360 | ❌ excluido (boilerplate generado) |

> **Decisión metodológica:** los 4.360 LOC de `components/ui/` son componentes generados por la librería shadcn/ui (no escritos por el equipo) y se **excluyen** de productividad, densidad de defectos y deuda técnica para no inflar los indicadores. El mismo criterio se aplica en `sonar-project.properties` (`sonar.exclusions`).

**Comando de recolección:**
```bash
find backend/src -name "*.ts" | xargs wc -l
find frontend/src -name "*.tsx" -o -name "*.ts" | grep -v "/ui/" | xargs wc -l
```

---

## 2. Métricas en Requerimientos (verificadas sobre la implementación)

> El Parcial 2 midió cobertura, volatilidad y trazabilidad sobre **documentos** (casos de uso, criterios, prototipos). Ahora que existe **código ejecutable**, esas mismas métricas se vuelven a medir contra los artefactos reales del repositorio, lo que cierra la acción de mejora del Parcial 2: *“crear una matriz formal RF/RNF → caso de uso → criterio → prueba”*.

### 2.1 Cobertura de Requerimientos (implementación real)

**Objetivo.** Medir qué porcentaje de los requisitos de la línea base cuenta ya con **código ejecutable** que los implemente, no solo con evidencia documental.

**Métrica.** `Cobertura de implementación = (Requisitos con código verificable / Total de requisitos) × 100`. Un RF se considera **implementado** si existe un endpoint, servicio o módulo que lo realiza; **parcial** si está embebido o incompleto; **no implementado** si no hay código.

**Recolección.** Inspección del repositorio: rutas registradas (`backend/src/routes/*.ts`), servicios (`risk-engine.ts`, `audit.ts`), triggers SQL y vistas del frontend.
```bash
grep -E "router\.(get|post|put|delete)" backend/src/routes/*.ts
grep -rl "interpol\|subsana\|email\|control_lists" backend/src
```

**Resultado (medición real):**

| ID | Requisito | Evidencia en código | Estado |
| :-: | :- | :- | :-: |
| RF01 | Registrar evaluación migratoria | `POST /applications` (`applications.ts:35`) | ✅ Implementado |
| RF02 | Validación documental (pasaporte/PDF) | Validaciones CA-01/CA-02 (`applications.ts:57-78`) | ✅ Implementado |
| RF03 | Consulta pública de estado | `GET /applications/status` (`applications.ts:172`) | ✅ Implementado |
| RF04 | Motor de scoring de riesgo | `calcularRiesgo()` (`risk-engine.ts:11`) + prueba | ✅ Implementado |
| RF05 | Dashboard / cola de expedientes | `GET /metrics` + `GET /applications` | ✅ Implementado |
| RF06 | Dictamen del agente | `POST /applications/:id/verdict` (`applications.ts:231`) | ✅ Implementado |
| RF07 | Subsanación (carga corregida) | Solo estado en SQL; sin endpoint | ❌ No implementado |
| RF08 | Notificaciones por correo | Sin librería de email en `src/` | ❌ No implementado |
| RF09 | Carga de listas de control (CSV/XML) | Tabla `control_lists` existe; sin endpoint de carga | ❌ No implementado |
| RF10 | Auditoría WORM | `audit.ts` + `GET /audit-log` + triggers SQL | ✅ Implementado |
| RF11 | Asignación automática a agente | Sin caso de uso ni código | ❌ No implementado |
| RF12 | Consulta INTERPOL | RPC `buscar_interpol_nombre` dentro de `calcularRiesgo` | 🟡 Parcial (embebido en RF04) |

| RNF | Requisito | Evidencia en código | Estado |
| :-: | :- | :- | :-: |
| RNF04 | UX / responsividad / WCAG | Frontend React + shadcn responsivo | ✅ |
| RNF05 | Mantenibilidad (TypeScript + análisis estático) | ESLint + Vitest + este informe | ✅ (era *No cubierto* en P2) |
| RNF06 | Logs WORM inmutables | Triggers `fn_prevent_audit_delete/update` (`001_initial.sql:130`) | ✅ |
| RNF01 | Seguridad (2FA, cifrado, TLS) | JWT implementado; 2FA/TLS pendientes | 🟡 Parcial |
| RNF02 | Rendimiento (3 s) | Sin prueba de carga | ❌ No medido |
| RNF03 | Disponibilidad 99,9 % | Sin mecanismo de medición | ❌ No medido |

**Cálculo.**
- Cobertura funcional de implementación (estricta) = `7 RF / 12 = 58,3 %`; general (con RF12 parcial) = `8 / 12 = 66,7 %`.
- Cobertura no funcional = `3 RNF / 6 = 50 %`.
- **Cobertura total de implementación = `10 / 18 = 55,6 %`.**

**Análisis.** La cobertura de **implementación** (55,6 %) supera la cobertura documental **estricta** del Parcial 2 (33,3 %): el código avanzó requisitos que en el documento estaban solo parciales (p. ej. RF04, RF05). Además, **RNF05 pasó de “No cubierto” a cubierto**, porque ahora existe la evidencia de mantenibilidad que faltaba (TypeScript + ESLint). Los huecos se concentran en el flujo secundario: subsanación (RF07), notificaciones (RF08), carga de listas (RF09) y asignación (RF11) — coherente con que el Sprint 1 priorizó el flujo principal de evaluación.

**Acción de mejora.** Planificar RF07–RF09 y RF11 para el Sprint 2 (tareas en §8); registrar cada RF como historia en Jira vinculada a su archivo/función para mantener viva esta cobertura.

### 2.2 Volatilidad de Requisitos (confirmada en código)

**Objetivo.** Verificar si los puntos de volatilidad **previstos** en el Parcial 2 se materializaron al implementar, para confirmar dónde el requisito necesitaba refinarse.

**Métrica.** `Volatilidad = (Requisitos que cambiaron / necesitaron redefinición al implementarse / Total de requisitos) × 100`.

**Recolección.** Comparación entre la especificación del Parcial 2 y el código entregado.

| ID | Cambio previsto (P2) | ¿Se confirmó en el código? |
| :-: | :- | :- |
| RF04 / RF12 | Separar scoring de consulta INTERPOL | ✅ **Confirmado**: `calcularRiesgo()` mezcla scoring (RF04) y RPC INTERPOL (RF12) en una sola función → solapamiento real |
| RF07 | Dividir subsanación en solicitud y carga | ✅ Confirmado: no se implementó por ambigüedad |
| RF09 | Aclarar CSV vs XML | ✅ Confirmado: no se implementó la carga |
| RNF01 | Dividir 2FA/cifrado/TLS | ✅ Confirmado: solo se implementó JWT |
| RNF06 | Diseño técnico de inmutabilidad WORM | ➖ Resuelto: se implementó con triggers SQL |

**Cálculo.** Volatilidad realizada = `9 / 18 = 50 %` (igual que la prevista en el Parcial 2), pero ahora **confirmada empíricamente** sobre el código en 4 de los 9 requisitos volátiles.

**Análisis.** La predicción del Parcial 2 fue acertada: la mayor volatilidad estaba en RF04/RF12 (scoring + INTERPOL), y el código lo confirma al fusionarlos en una función con complejidad 16 (ver §3.1). La volatilidad no bajó porque el Sprint 1 no abordó la separación; queda como deuda de diseño.

**Acción de mejora.** Ejecutar la separación RF04/RF12 extrayendo `consultarInterpol()` de `calcularRiesgo()` (tarea SCRUM-44/SCRUM-45), reduciendo a la vez complejidad y volatilidad.

### 2.3 Trazabilidad de Requisitos (matriz RF → Caso de uso → Código → Prueba)

**Objetivo.** Garantizar que cada requisito pueda seguirse desde su definición hasta su validación en código y prueba, cerrando la acción de mejora del Parcial 2 (*“crear una matriz formal”*).

**Métrica.** `Trazabilidad completa = (Requisitos con cadena CU→Código→Prueba completa / Total) × 100`.

**Recolección.** Cruce de casos de uso (P2), archivos del repositorio y suite Vitest.

| ID | Caso de uso | Código (archivo:función) | Prueba | Trazabilidad |
| :-: | :- | :- | :- | :-: |
| RF01 | UC1 | `applications.ts` → `POST /` | Pendiente (supertest) | 🟡 Código sin prueba |
| RF02 | UC1 | `applications.ts:57-78` validaciones | Pendiente | 🟡 |
| RF03 | UC2 | `applications.ts` → `GET /status` | Pendiente | 🟡 |
| RF04 | UC3 | `risk-engine.ts` → `calcularRiesgo` | `risk-engine.test.ts` (6 casos) | ✅ **Completa** |
| RF06 | UC3 | `applications.ts` → `POST /:id/verdict` | Pendiente | 🟡 |
| RF10 | UC7 | `audit.ts` + triggers WORM | Pendiente | 🟡 |
| RF12 | UC3 | `risk-engine.ts` (RPC INTERPOL) | `risk-engine.test.ts` (caso fuzzy) | ✅ Completa (vía RF04) |
| RF07/08/09/11 | — | Sin código | — | ❌ Sin trazabilidad |

**Cálculo.** Trazabilidad **completa** (CU→Código→Prueba) = `2 / 12 RF = 16,7 %` estricta; trazabilidad **a código** (CU→Código, aún sin prueba) = `7 / 12 = 58,3 %`.

**Análisis.** Solo RF04/RF12 tienen la cadena completa hasta prueba automatizada, precisamente porque es el requisito más sensible y el único con suite Vitest. Siete RF tienen trazabilidad hasta el código pero **les falta el eslabón de prueba**, que es el principal hueco de trazabilidad del Sprint 1.

**Acción de mejora.** Añadir pruebas de integración con `supertest` para `applications.ts` y `auth.ts` (SCRUM-49); así RF01, RF02, RF03 y RF06 alcanzarían trazabilidad completa y la métrica subiría de 16,7 % a ~50 %.

---

## 3. Métricas en Diseño (sobre código real)

### 3.1 Complejidad Ciclomática (McCabe) — sobre código real

**Objetivo.** Identificar funciones con lógica demasiado ramificada que dificultan el mantenimiento y las pruebas, priorizando refactorización. En el Parcial 2 se predijo que UC3 (scoring + INTERPOL) elevaría la complejidad al implementarse; esta medición lo **verifica sobre el código**.

**Métrica.** `M = decisiones lógicas + 1`. Umbral McCabe: `M ≤ 10` aceptable; `M > 10` requiere refactorización. ESLint cuenta como decisión cada `if`, `for`, `while`, `case`, ternario `?:` y operador de cortocircuito `&&`, `||`, `??`.

**Recolección.** ESLint 8 con `@typescript-eslint/parser` y regla `complexity: ['warn', 10]`. Reproducible con `cd backend && npm run lint`.

**Resultado (medición real):**

| Función | Archivo | Complejidad real | Líneas | Estado |
| :- | :- | :-: | :-: | :-: |
| `POST /` (crear expediente) | `routes/applications.ts:34` | **19** | 89 | 🔴 Crítico |
| `GET /` (dashboard métricas) | `routes/metrics.ts:8` | **17** | — | 🔴 Crítico |
| `calcularRiesgo` (scoring) | `services/risk-engine.ts:11` | **16** | 70 | 🔴 Crítico |
| `POST /:id/verdict` (dictamen) | `routes/applications.ts:224` | **11** | 51 | 🟡 Sobre umbral |
| Resto de funciones | — | ≤ 10 | — | 🟢 OK |

**Cálculo del % de funciones complejas:** `(funciones con M > 10 / total funciones con lógica) × 100 = (4 / 14) × 100 ≈ 28,6 %`.

**Análisis.** El código real **confirma la predicción del Parcial 2** (que estimó UC3 como el caso a vigilar): las funciones más complejas son las del flujo de evaluación (UC1 `POST /applications` = 19) y del scoring de riesgo (`calcularRiesgo` = 16). Los valores reales superan ampliamente el estimado manual sobre casos de uso (≈4) porque ESLint contabiliza los operadores `??`/`&&` usados intensivamente para manejar `null` de Supabase. `GET /metrics` resultó inesperadamente complejo (17) por la agregación con múltiples `??` dentro del bucle. El 28,6 % de funciones por encima del umbral contrasta con el 0 % medido sobre los casos de uso en el Parcial 2: **el riesgo de complejidad solo se hace visible al medir el código**.

**Acción de mejora.**
1. Extraer de `POST /applications` las validaciones (vigencia de pasaporte, PDFs) a funciones puras `validarSolicitud()` → reduce M y habilita pruebas unitarias.
2. Refactorizar `calcularRiesgo` extrayendo un helper `consultarLista(tipo, criterio)` (ver §4.1, elimina además duplicación).
3. En `GET /metrics`, reemplazar acumuladores `Record` con `??` por `Map.get()` con defaults.
4. Agregar a CI un gate ESLint que falle el build si `complexity > 15` (límite transitorio hasta refactor).

### 3.2 Acoplamiento y Cohesión (sobre módulos reales)

**Objetivo.** Evaluar si la estructura de módulos implementada mantiene bajo acoplamiento y alta cohesión, validando empíricamente el CBO=1,5 que el Parcial 2 estimó sobre el diagrama de clases.

**Métrica.**
- **Acoplamiento** (versión empírica de CBO a nivel de módulo): `Ce` (fan-out, dependencias salientes) y `Ca` (fan-in, módulos que dependen de él) contando los `import` internos. Umbral de riesgo: CBO ≥ 5.
- **Inestabilidad** `I = Ce / (Ca + Ce)` (0 = estable, 1 = inestable; modelo de Martin).
- **Cohesión** (cualitativa): si las funciones del módulo operan sobre una sola responsabilidad.

**Recolección.** Conteo de imports internos:
```bash
grep -E "^import .* from '\.\.?/" backend/src/**/*.ts | grep -oE "from '[^']*'"
```

**Resultado (medición real):**

| Módulo | Ce (fan-out) | Ca (fan-in) | Inestabilidad I | Cohesión |
| :- | :-: | :-: | :-: | :- |
| `lib/supabase.ts` | 0 | 6 | **0,00** (estable) | Alta — único cliente de BD (hub) |
| `middleware/auth.ts` | 0 | 3 | 0,00 | Alta — solo autenticación JWT |
| `services/risk-engine.ts` | 1 | 1 | 0,50 | Alta — solo scoring (RF04) |
| `services/audit.ts` | 1 | 2 | 0,33 | Alta — solo `logAction` WORM |
| `routes/applications.ts` | 4 | 1 | **0,80** (inestable) | Media — orquesta scoring+storage+audit |
| `routes/metrics.ts` | 2 | 1 | 0,67 | Media |
| `routes/auth.ts` | 2 | 1 | 0,67 | Alta |
| `routes/audit.ts` | 2 | 1 | 0,67 | Alta |
| `index.ts` | 4 | 0 | 1,00 | Alta — solo composición de rutas |

**Cálculo.** `CBO promedio del sistema = 18 dependencias dirigidas / 11 módulos ≈ 1,6`.

**Análisis.** El acoplamiento medido sobre código (**1,6**) coincide notablemente con el CBO=1,5 estimado sobre el diagrama de clases en el Parcial 2: el diseño se respetó en la implementación. La distribución de inestabilidad es **sana**: los módulos base (`supabase.ts`, `auth.ts`) son estables (I=0, muchos dependen de ellos, ellos de nadie) y los módulos volátiles son las rutas (I≈0,8, capa de orquestación que cambia con frecuencia) — exactamente el patrón deseable según el Principio de Dependencias Estables. El gap de cohesión previsto en el Parcial 2 (RF04 sin clase de soporte) **quedó cerrado**: `risk-engine.ts` es el `MotorDeRiesgo` propuesto. El único punto medio es `applications.ts` (CBO 4, cohesión media), coherente con su alta complejidad ciclomática (§3.1).

**Acción de mejora.** Mantener `applications.ts` por debajo de CBO=5 al extraer las validaciones a un módulo `validators.ts` (reduce su fan-out); monitorear CBO con SonarQube con regla que bloquee merges si una clase/módulo supera 4 (cierra la acción del Parcial 2 sobre monitoreo de CBO).

### 3.3 Diagramas actualizados (diseño ↔ implementación)

**Objetivo.** Verificar que el diagrama de clases del Parcial 1/2 sigue siendo coherente con el código y registrar las clases nuevas que la implementación obligó a crear.

**Recolección.** Cruce del diagrama de clases (P2 §9) con los módulos reales.

| Clase/artefacto del diagrama | Realización en código | Estado del diagrama |
| :- | :- | :-: |
| `EvaluacionMigratoria` | tabla `applications` + `POST /applications` | ✅ Coherente |
| **`MotorDeRiesgo`** (propuesto en P2) | `services/risk-engine.ts` | ✅ **Creado** (cierra gap RF04) |
| `AgenteMigratorio` + dictamen | Lógica de dictamen en `POST /:id/verdict`, **no** en la clase del agente | ⚠ Realizado como servicio (mejora cohesión, según acción P2) |
| `LogAuditoria` | tabla `audit_log` + `services/audit.ts` + triggers WORM | ✅ Coherente; falta `exportarPDF` (UC7-2) |
| `DocumentoAdjunto` | Supabase Storage bucket `documents` | ✅ Coherente |

**Análisis.** La implementación **aplicó dos de las acciones de mejora de diseño del Parcial 2**: se creó el `MotorDeRiesgo` (`risk-engine.ts`) y la lógica de dictamen se separó del actor (vive en el route handler, no en `AgenteMigratorio`), mejorando la cohesión. Queda pendiente el método de exportación PDF de auditoría (UC7-2).

**Acción de mejora.** Actualizar el diagrama de clases del entregable incorporando `risk-engine` y el servicio de dictamen como clases reales; añadir el servicio de exportación de logs (SCRUM pendiente).

---

## 4. Métricas en Código

### 4.1 Code Smells

**Objetivo.** Detectar patrones estructurales que degradan la mantenibilidad sin ser defectos funcionales, para corregirlos de forma preventiva (TQM).

**Métrica.** Conteo de violaciones de reglas estructurales: funciones > 50 líneas, duplicación de bloques, *magic numbers*, violaciones DRY. Recolección con ESLint (`max-lines-per-function`, `max-depth`, `max-params`) + inspección manual.

**Recolección.** `cd backend && npm run lint` + revisión por pares.

**Resultado:**

| # | Code smell | Ubicación | Detección |
| :-: | :- | :- | :- |
| S1 | Función de 89 líneas con múltiples responsabilidades (God function) | `applications.ts:34` | ESLint `max-lines-per-function` |
| S2 | Función de 70 líneas | `risk-engine.ts:11` | ESLint |
| S3 | Función de 51 líneas | `applications.ts:224` | ESLint |
| S4 | Duplicación de 3 bloques de query casi idénticos a `control_lists` (violación DRY) | `risk-engine.ts:25-83` | Manual |
| S5 | Migración SQL duplicada literal (192 líneas idénticas) | `backend/src/db/migrations/001_initial.sql` ≡ `supabase/migrations/2026…sql` | Manual / `diff` |
| S6 | *Magic numbers* sin constantes nombradas (50, 40, 10; umbrales 50/10) | `risk-engine.ts` | Manual |
| S7 | Generación de ticket con reintento no atómico (posible *race condition*) | `applications.ts:84-95` | Manual |

**Análisis.** Predomina el *smell* de funciones largas, ligado directamente a la alta complejidad de §3.1. La duplicación SQL (S5) es riesgosa: dos fuentes de verdad del esquema que pueden divergir. Los *magic numbers* (S6) impiden trazar los pesos de scoring al requisito RF04 (consistente con el gap ya reportado en el Parcial 2).

**Acción de mejora.** Extraer helper `consultarLista()` (cierra S2 y S4); definir `const PESOS = { INTERPOL: 50, OFAC: 40, PAIS: 10 }` y `const UMBRALES = { ALTO: 50, MEDIO: 10 }` (S6); eliminar la migración duplicada dejando `supabase/migrations/` como única fuente (S5); convertir `ticket_number` en columna con restricción `UNIQUE` y delegar la unicidad a la BD en vez del bucle de reintentos (S7).

### 4.2 Vulnerabilidades

**Objetivo.** Identificar debilidades de seguridad explotables en el código y en las dependencias, dado que SIDEM-PAN maneja datos personales sensibles (RNF01).

**Métrica.** Conteo y severidad de hallazgos de: (a) plugin `eslint-plugin-security`, (b) `npm audit` sobre dependencias, (c) revisión manual de controles de seguridad.

**Recolección.** `npm run lint` (security plugin) + `npm audit` + revisión manual.

**Resultado:**

| # | Vulnerabilidad | Severidad | Fuente | Evidencia |
| :-: | :- | :-: | :- | :- |
| V1 | **`express-rate-limit` instalado pero nunca usado** → login y `/status` sin límite de intentos. Incumple el control "3 intentos bloqueados" del UC2 | 🔴 Alta | Manual | No hay `import` de rate-limit en `src/` |
| V2 | `tar` ≤ 7.5.10 — *Arbitrary File Write / Path Traversal* (cadena `bcrypt → @mapbox/node-pre-gyp → tar`) | 🔴 Alta | `npm audit` | 2 high severity |
| V3 | CORS abierto a todos los orígenes: `app.use(cors())` sin whitelist | 🟡 Media | Manual | `index.ts:14` |
| V4 | Validación de PDF solo por `mimetype` (falsificable) | 🟡 Media | Manual | `applications.ts:68` |
| V5 | `generarTicket()` usa `Math.random()` (no criptográfico, predecible) | 🟡 Media | Manual | `applications.ts:13` |
| V6 | *Generic Object Injection Sink* (escritura con clave dinámica) | 🟢 Baja | `eslint-plugin-security` | `metrics.ts:27` (×2) |
| V7 | `JWT_SECRET!` con *non-null assertion* → caída en runtime si falta la variable | 🟢 Baja | Manual | `auth.ts:31`, `auth route:38` |

**Análisis.** El hallazgo más grave (V1) es a la vez un **defecto funcional**: un requisito de seguridad documentado (bloqueo por intentos) no está implementado pese a tener la dependencia instalada. V2 proviene de la cadena transitiva de `bcrypt` y se corrige con `npm audit fix`. V3–V5 son endurecimientos pendientes para producción.

**Acción de mejora.** (1) Aplicar `express-rate-limit` en `/api/auth/login` (p.ej. 5 intentos / 15 min) y en `/api/applications/status`; (2) ejecutar `npm audit fix`; (3) restringir CORS a `VITE_API_URL`/dominio del SNM; (4) validar la firma binaria del PDF (`%PDF-1.x`), no solo el mimetype; (5) usar `crypto.randomInt()` para el ticket; (6) validar variables de entorno al arranque con un *guard* que aborte si falta `JWT_SECRET`.

### 4.3 Densidad de Defectos

**Objetivo.** Cuantificar la calidad del código relativa a su tamaño para comparar entre módulos y sprints.

**Métrica.** `Densidad = Defectos detectados / KLOC`. Se cuentan como **defecto** los hallazgos funcionales o de seguridad (no los *smells* puramente estéticos).

**Recolección.** Matriz de defectos consolidada de las mediciones §3.1, §4.1–§4.2 y de las pruebas (§4.4).

**Matriz de defectos:**

| ID | Defecto | Tipo | Severidad | Origen |
| :-: | :- | :- | :-: | :- |
| D1 | Rate limiting ausente (UC2 incumplido) | Funcional / Seguridad | Alta | V1 |
| D2 | Vulnerabilidad `tar` en dependencias | Seguridad | Alta | V2 |
| D3 | Un hit de **OFAC SDN** solo (score 40) clasifica **MEDIO**, no ALTO | Lógica de negocio | Media | Test §4.4 |
| D4 | Reintento de ticket no atómico (race condition) | Confiabilidad | Media | S7 |
| D5 | CORS abierto | Seguridad | Media | V3 |
| D6 | Validación PDF solo por mimetype | Seguridad | Media | V4 |
| D7 | Object Injection en `metrics.ts` (×2) | Seguridad | Baja | V6 |

**Cálculo:** `7 defectos / 3,16 KLOC ≈ 2,2 defectos/KLOC`.

**Análisis.** Una densidad de ~2,2 def/KLOC es **moderada** para un Sprint 1 sin QA formal previo. La concentración es en backend (lógica de negocio y seguridad), lo cual es esperable ya que el frontend reutiliza componentes probados. D3 es un hallazgo valioso surgido de las pruebas automáticas: el sistema trata una coincidencia en lista de sanciones OFAC como riesgo MEDIO, lo que probablemente contradice la intención de negocio (debería revisarse el umbral o el peso).

**Acción de mejora.** Crear ticket por cada defecto en Jira (§8); re-medir densidad al cierre del Sprint 2 esperando ≤ 1,0 def/KLOC tras corregir D1–D7; revisar con el cliente si OFAC debe forzar nivel ALTO (D3).

### 4.4 Pruebas automatizadas y cobertura

**Objetivo.** Verificar el comportamiento del motor de scoring (RF04, el requisito más sensible) y establecer una base de pruebas de regresión (madurez TMMi nivel 2).

**Métrica.** N.º de pruebas, tasa de éxito y cobertura (statements / branches / functions) con Vitest + v8.

**Recolección.** `cd backend && npm run test:coverage`.

**Resultado (ejecución real):**

```
 ✓ src/services/risk-engine.test.ts (6 tests) 9ms
 Test Files  1 passed (1)
      Tests  6 passed (6)

 % Coverage report from v8
-----------------|---------|----------|---------|---------
File             | % Stmts | % Branch | % Funcs | % Lines
-----------------|---------|----------|---------|---------
 risk-engine.ts  |   100   |  76.92   |   100   |   100
-----------------|---------|----------|---------|---------
```

| Indicador | Valor |
| :- | :-: |
| Pruebas ejecutadas | 6 |
| Pruebas exitosas | 6 (100 %) |
| Cobertura statements (`risk-engine.ts`) | **100 %** |
| Cobertura branches (`risk-engine.ts`) | **76,9 %** |
| Defectos revelados por pruebas | 1 (D3 — OFAC = MEDIO) |

**Análisis.** Las 6 pruebas cubren las particiones de equivalencia del scoring (sin alerta, INTERPOL por pasaporte, INTERPOL por nombre, OFAC, país restringido, combinación) aplicando técnica ISTQB de valores límite sobre los umbrales 10 y 50. La rama no cubierta (76,9 %) corresponde a los *fallbacks* `?? 'descripción por defecto'` de las alertas. El valor de las pruebas quedó demostrado: revelaron el defecto D3.

**Acción de mejora.** Cubrir las ramas restantes; añadir pruebas de integración con `supertest` para los handlers de `applications.ts` y `auth.ts` (validación de pasaporte, mimetype, login fallido); integrar `npm test` como gate obligatorio en `ci.yml`.

### 4.5 Deuda Técnica (Debt Ratio, estimación SQALE)

**Objetivo.** Estimar el costo de remediación relativo al costo de desarrollo (modelo SonarQube/SQALE).

**Métrica.** `Debt Ratio = Costo de remediación / Costo de desarrollo`. Costo de desarrollo = `LOC × 30 min` (valor por defecto de SonarQube).

**Recolección.** Estimación a partir de los hallazgos de ESLint (config en `sonar-project.properties`, lista para ejecutar `sonar-scanner` contra un servidor SonarQube/SonarCloud).

| Concepto | Esfuerzo estimado |
| :- | :-: |
| Refactor 4 funciones complejas | 120 min |
| Eliminar duplicación SQL + DRY scoring | 45 min |
| 2 Object Injection | 20 min |
| Rate limiting + CORS whitelist | 55 min |
| **Deuda técnica total estimada** | **≈ 240 min (4 h)** |

**Cálculo:** Costo de desarrollo = `3.161 × 30 min = 94.830 min`. `Debt Ratio = 240 / 94.830 ≈ 0,25 %` → **Rating de Mantenibilidad A** (Sonar: A si ≤ 5 %).

**Análisis.** Pese a las 4 funciones complejas, la deuda relativa es baja (0,25 %) porque el código base es pequeño y la mayoría de hallazgos son de remediación rápida. El riesgo real no está en la cantidad de deuda sino en su **concentración** en el núcleo de negocio (scoring y creación de expediente).

**Acción de mejora.** Conectar SonarCloud al repositorio GitHub y agregar el escaneo a `ci.yml` con *Quality Gate* que bloquee merges si Debt Ratio > 5 % o si aparecen vulnerabilidades nuevas (cierra la acción ya propuesta en el Parcial 2 sobre monitoreo de CBO).

---

## 5. Métricas Clásicas

### 5.1 KLOC

**Objetivo / Métrica.** Tamaño del software en miles de líneas de código fuente propio (excluye generado y dependencias).
**Recolección.** `wc -l` sobre fuentes (§1).
**Resultado:** **3,16 KLOC** propias (7,52 KLOC incluyendo UI generada).
**Análisis.** Tamaño coherente con un MVP de Sprint 1: backend compacto (0,68 KLOC) con alta densidad lógica y un frontend más extenso (2,25 KLOC) por las vistas de solicitante y agente.
**Acción de mejora.** Mantener el seguimiento de KLOC por sprint como denominador de las demás métricas.

### 5.2 Productividad

**Objetivo.** Estimar el ritmo de entrega del equipo para planificar el Sprint 2.
**Métrica.** `Productividad = LOC propias / (n.º desarrolladores)` y por período.
**Recolección.** `git log` (autores, fechas, commits).
**Resultado (datos git reales):**

| Indicador | Valor |
| :- | :-: |
| Período del Sprint 1 | 26-may → 2-jun-2026 (~1 semana, ~5 días hábiles) |
| Integrantes | 4 |
| Commits | 15 |
| LOC propias entregadas | 3.161 |
| **Productividad por desarrollador** | **≈ 790 LOC/dev** en el sprint |
| Productividad del equipo | ≈ 632 LOC/día hábil |

**Análisis.** Productividad alta para una semana, explicable por la reutilización de shadcn/ui (no contada) y el andamiaje de Supabase. Los commits se concentran en 3 días (28-may: 8, 2-jun: 5), lo que sugiere trabajo en ráfagas más que un flujo continuo.
**Acción de mejora.** Distribuir commits con un flujo de PRs más frecuente; usar LOC/sprint como referencia (no como meta, para no incentivar código inflado).

### 5.3 Tasa de Defectos

**Objetivo.** Relacionar los defectos con la salida del proceso (igual que densidad, pero como indicador de proceso).
**Métrica.** `Tasa = Defectos / KLOC` (= densidad, §4.3) y `Defectos / commit`.
**Resultado:** 2,2 def/KLOC · 7 defectos / 15 commits ≈ **0,47 defectos por commit**.
**Análisis.** Indicador base (*baseline*) para el Sprint 1; sin sprints previos no hay tendencia aún.
**Acción de mejora.** Establecer este valor como línea base y graficar la tendencia a partir del Sprint 2.

---

## 6. Evidencias de uso de herramientas

> Salidas reales reproducibles. Para el informe final adjuntar las **capturas** de cada comando ejecutado en terminal y de los dashboards (Jira, GitHub Actions, SonarCloud).

### 6.1 ESLint — complejidad + seguridad (`npm run lint`)
```
routes/applications.ts
  34:3   Async arrow function has a complexity of 19. Maximum allowed is 10   complexity
  224:61 Async arrow function has a complexity of 11. Maximum allowed is 10   complexity
routes/metrics.ts
  8:39   Async arrow function has a complexity of 17. Maximum allowed is 10   complexity
  27:7   Generic Object Injection Sink                       security/detect-object-injection
services/risk-engine.ts
  11:8   Async function 'calcularRiesgo' has a complexity of 16. Maximum allowed is 10
✖ 9 problems (0 errors, 9 warnings)
```

### 6.2 Vitest — pruebas + cobertura (`npm run test:coverage`)
```
 ✓ src/services/risk-engine.test.ts (6 tests)
 Tests  6 passed (6)   |   risk-engine.ts: 100% stmts, 76.92% branch
```

### 6.3 npm audit — vulnerabilidades de dependencias (`npm audit`)
```
tar  <=7.5.10  — Severity: high — Arbitrary File Write / Path Traversal
  @mapbox/node-pre-gyp (depende de tar vulnerable)
2 high severity vulnerabilities
```

### 6.4 Acoplamiento — conteo de imports internos
```bash
grep -E "^import .* from '\.\.?/" backend/src/**/*.ts | grep -oE "from '[^']*'"
# → supabase.ts: fan-in 6 (I=0,00) · applications.ts: fan-out 4 (I=0,80) · CBO medio ≈ 1,6
```

### 6.5 GitHub Actions — CI existente
- `.github/workflows/ci.yml`: typecheck backend (`tsc --noEmit`), typecheck + build frontend.
- `.github/workflows/db-migrations.yml`: migraciones automáticas a Supabase.
- **Pendiente (acción de mejora):** añadir jobs de `npm run lint` y `npm test` como gates.

### 6.6 SonarQube
- `sonar-project.properties` creado (claves, fuentes, exclusiones, ruta de cobertura LCOV). Listo para `sonar-scanner`. Pendiente conectar servidor/token.

### 6.7 Jira — tablero del proyecto
- Épica “SIDEM-PAN — Debida Diligencia Migratoria” con historias SCRUM-33…SCRUM-40 (Sprint 1, Done) y SCRUM-41…SCRUM-50 derivadas de estas mediciones (§8). Adjuntar captura del tablero Kanban.

### Comandos de reproducción
```bash
cd backend
npm install
npm run lint            # 6.1
npm run test:coverage   # 6.2
npm audit               # 6.3
```

---

## 7. Actualización del Backlog / Tablero Kanban

### 7.1 Sprint 1 — Completado (verificado en git)

| ID | Historia | Estado |
| :-: | :- | :-: |
| SCRUM-33 | Crear expediente migratorio (`POST /applications`) | ✅ Done |
| SCRUM-34 | Motor de scoring de riesgo (RF04) | ✅ Done |
| SCRUM-36 | Cola de expedientes del agente (`GET /applications`) | ✅ Done |
| SCRUM-37 | Detalle de expediente + dictamen | ✅ Done |
| SCRUM-38 | Consulta pública de estado | ✅ Done |
| SCRUM-39 | Visor de auditoría (RF10) | ✅ Done |
| SCRUM-40 | Dashboard de métricas SNM | ✅ Done |
| — | Integración Supabase + GitHub Actions | ✅ Done |

### 7.2 Nuevas tareas derivadas de la medición (para cargar en Jira — Sprint 2)

| ID propuesto | Tarea (acción de mejora) | Origen | Prioridad | Estado |
| :-: | :- | :- | :-: | :-: |
| SCRUM-41 | Implementar `express-rate-limit` en login y `/status` | D1/V1 | 🔴 Alta | To Do |
| SCRUM-42 | `npm audit fix` (vuln. `tar`) | D2/V2 | 🔴 Alta | To Do |
| SCRUM-43 | Refactor `POST /applications` (M 19→<10) + extraer validaciones | §3.1/S1 | 🔴 Alta | To Do |
| SCRUM-44 | Refactor `calcularRiesgo`: helper `consultarLista()` + constantes | §3.1/S4/S6 | 🟡 Media | To Do |
| SCRUM-45 | Separar scoring (RF04) de consulta INTERPOL (RF12) | §2.2/D3 | 🟡 Media | To Do |
| SCRUM-46 | `ticket_number UNIQUE` en BD (eliminar race) | D4/S7 | 🟡 Media | To Do |
| SCRUM-47 | CORS whitelist + validación binaria de PDF | D5/D6 | 🟡 Media | To Do |
| SCRUM-48 | Eliminar migración SQL duplicada | S5 | 🟢 Baja | To Do |
| SCRUM-49 | Pruebas de integración (supertest) + gates lint/test en CI | §2.3/§4.4 | 🟡 Media | To Do |
| SCRUM-50 | Conectar SonarCloud con Quality Gate | §4.5 | 🟡 Media | To Do |
| SCRUM-51 | Implementar RF07 (subsanación), RF08 (notificación), RF09 (carga listas), RF11 (asignación) | §2.1 | 🟡 Media | To Do |

### 7.3 Bloqueos / dependencias
- SCRUM-50 (SonarCloud) depende de credenciales/token del repositorio (acción del Product Owner).
- SCRUM-45 (regla OFAC / separación INTERPOL) requiere validación funcional con el cliente (SNM) antes de codificar.
- SCRUM-51 depende del refinamiento de requisitos volátiles (RF07/RF09/RF11) señalado en §2.2.

---

## 8. Resumen ejecutivo

| Categoría | Métrica | Resultado real | Estado |
| :- | :- | :-: | :-: |
| Requerimientos | Cobertura de implementación | 55,6 % (10/18) | 🟡 |
| Requerimientos | Volatilidad confirmada | 50 % | 🟡 |
| Requerimientos | Trazabilidad completa (→prueba) | 16,7 % | 🔴 |
| Diseño | Complejidad ciclomática (máx.) | 19 · 28,6 % > umbral | 🔴 |
| Diseño | Acoplamiento (CBO medio) | 1,6 | 🟢 |
| Código | Code smells | 7 | 🟡 |
| Código | Vulnerabilidades (alta) | 3 (V1, V2 y dependencia) | 🔴 |
| Código | Densidad de defectos | 2,2 def/KLOC | 🟡 |
| Código | Debt ratio | ≈ 0,25 % (Rating A) | 🟢 |
| Código | Pruebas (éxito / cobertura scoring) | 6/6 · 100 % stmts | 🟢 |
| Clásicas | KLOC propias | 3,16 | — |
| Clásicas | Productividad | ≈ 790 LOC/dev/sprint | 🟢 |

**Conclusión.** El Sprint 1 entregó un MVP funcional e integrado con buena productividad, bajo acoplamiento (CBO 1,6, que valida el diseño del Parcial 2) y deuda técnica baja en términos relativos, pero con **riesgo concentrado en el núcleo de negocio**: las funciones de creación de expediente y scoring son las más complejas (M=19 y 16) y existen 3 vulnerabilidades de alta severidad, incluida una (rate limiting) que incumple un requisito de seguridad documentado. La medición sobre código **verificó las predicciones del Parcial 2** (volatilidad RF04/RF12, complejidad de UC3) y **cerró gaps de diseño** (creación del `MotorDeRiesgo`, cobertura real de RNF05). Las pruebas automáticas aportaron valor revelando un defecto de lógica de negocio (OFAC=MEDIO). El principal pendiente es la **trazabilidad hasta prueba** (16,7 %), que sube con `supertest`. El backlog del Sprint 2 queda priorizado por estas mediciones, cumpliendo el ciclo de mejora continua de TQM.
