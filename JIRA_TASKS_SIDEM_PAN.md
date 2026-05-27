# Tareas Jira - SIDEM-PAN Parcial 2

Basado en el documento "Avances para Parcial N°2 - Módulo Digital de Debida Diligencia Migratoria"

## Información del Proyecto
- **Equipo**: Aparicio Ana, Ferreira Bruno, Rios Gerald, Ten Su Eriel
- **Grupo**: 1GS241
- **Asignatura**: Ingeniería de Software Aplicada IV
- **Facilitador**: María Mosquera
- **Fecha**: Mayo 2026

---

## ÉPICA: SIDEM-PAN - Debida Diligencia Migratoria (Parcial 2)

### Resumen Ejecutivo de Métricas
- Cobertura Total Estricta: 33.3% (6 de 18 requisitos cubiertos completamente)
- Cobertura General (con parciales): 83.3%
- Volatilidad de Requisitos: 50% (9 de 18 requisitos necesitan ajustes)
- Trazabilidad Completa: 33.3%
- Trazabilidad General: 83.3%
- Complejidad Ciclomática: 0% (casos de uso en rango aceptable)

---

## TAREAS - COBERTURA DE REQUISITOS

### Alta Prioridad

#### T1: RF04 - Definir scoring de riesgo (Alta Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Existe scoring y prueba ALF-03, pero faltan pesos, variables y umbrales
- Necesario definir variables, pesos y umbrales del motor de scoring
- Agregar prueba específica para validar niveles Bajo, Medio y Alto

**Criterios de Aceptación**:
- [ ] Documento con definición de variables de scoring
- [ ] Documento con matriz de pesos y umbrales
- [ ] Prueba ALF-07 validando niveles Bajo, Medio, Alto
- [ ] Casos de prueba ejecutados exitosamente

**Tareas Secundarias**:
- T1.1: Definir variables, pesos y umbrales del motor (Media)
- T1.2: Agregar prueba ALF-07 para niveles (Media)

---

#### T2: RF11 - Asignar expediente a agente (Alta Prioridad)
**Estado**: No Cubierto
**Descripción**:
- Requisito declarado sin caso de uso, algoritmo, criterio ni prueba
- Debe tener cobertura completa antes de desarrollo

**Criterios de Aceptación**:
- [ ] Caso de uso UC8 creado: "Asignar expediente a agente"
- [ ] Algoritmo de asignación equitativa documentado
- [ ] Criterios de aceptación para reparto equitativo definidos
- [ ] Prueba ALF-08 ejecutada exitosamente

**Tareas Secundarias**:
- T2.1: Crear caso de uso "Asignar expediente a agente" (Alta)
- T2.2: Definir algoritmo de asignación equitativa (Alta)
- T2.3: Agregar criterio de aceptación para reparto (Media)
- T2.4: Crear prueba alfa ALF-08 (Media)

---

#### T3: RF12 - Separar de RF04 y definir consulta INTERPOL (Alta Prioridad)
**Estado**: Parcialmente Cubierto / Solapamiento con RF04
**Descripción**:
- Se solapa con RF04 (scoring) y no tiene prueba independiente
- Debe separarse claramente y tener su propia trazabilidad
- Definir cuándo exactamente se ejecuta la consulta a INTERPOL

**Criterios de Aceptación**:
- [ ] RF12 separado formalmente de RF04 en documentación
- [ ] Caso de uso UC3-INTERPOL definido con flujo claro
- [ ] Criterios para invocar INTERPOL documentados
- [ ] Prueba ALF-09 para consulta automática a INTERPOL
- [ ] Manejo de errores si INTERPOL no responde

**Tareas Secundarias**:
- T3.1: Separar RF12 de RF04 en especificación (Alta)
- T3.2: Definir cuándo se ejecuta consulta INTERPOL (Alta)
- T3.3: Crear prueba ALF-09 para INTERPOL (Media)
- T3.4: Definir manejo de errores INTERPOL (Media)

---

#### T4: RNF01 - Dividir requisitos de seguridad (Alta Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Incluye 2FA, cifrado, TLS y control de acceso en un solo requisito
- Debe dividirse en requisitos trazables independientes

**Criterios de Aceptación**:
- [ ] RNF01-1: Control de acceso (documentado y probado)
- [ ] RNF01-2: Autenticación 2FA (documentado y probado)
- [ ] RNF01-3: Cifrado AES-256 (documentado y probado)
- [ ] RNF01-4: TLS 1.3 (documentado y probado)
- [ ] Pruebas específicas para cada componente

**Tareas Secundarias**:
- T4.1: Dividir RNF01 en 4 requisitos independientes (Alta)
- T4.2: Crear pruebas para 2FA, AES-256, TLS 1.3 (Media)

---

#### T5: RNF06 - Diseñar logs WORM (Alta Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Logs WORM declarados pero falta diseño técnico de inmutabilidad
- Debe tener mecanismo técnico definido

**Criterios de Aceptación**:
- [ ] Diseño técnico de logs WORM documentado
- [ ] Estrategia de inmutabilidad definida
- [ ] Mecanismo de validación de integridad
- [ ] Prueba ALF-10 para validar WORM

**Tareas Secundarias**:
- T5.1: Diseñar mecanismo técnico para logs WORM (Alta)
- T5.2: Vincular RNF06 con diseño técnico (Media)

---

### Prioridad Media

#### T6: RF05 - Completar criterios del dashboard (Media Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Existe dashboard pero faltan criterios completos de filtro y gestión

**Criterios de Aceptación**:
- [ ] Criterios de filtrado documentados (por riesgo, estado, agente)
- [ ] Criterios de priorización definidos
- [ ] Criterios de gestión del dashboard especificados
- [ ] Prueba ALF-11 para filtros

**Tareas Secundarias**:
- T6.1: Completar criterios de filtrado y priorización (Media)
- T6.2: Agregar prueba para filtros del dashboard (Media)

---

#### T7: RF07 - Separar flujo de subsanación (Media Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Incluye solicitud de subsanación y carga de documento corregido
- Debe separarse en dos flujos claros

**Criterios de Aceptación**:
- [ ] Flujo 1: Solicitud de subsanación por agente (documentado)
- [ ] Flujo 2: Carga de documento corregido por solicitante (documentado)
- [ ] Prueba ALF-12 para carga de documento corregido
- [ ] Criterios de aceptación para cada flujo

**Tareas Secundarias**:
- T7.1: Separar solicitud y carga en UC4-A y UC4-B (Media)
- T7.2: Agregar prueba para carga de documento (Media)

---

#### T8: RF08 - Notificaciones por estado (Media Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Hay evidencia de correo por subsanación pero no de todos los estados
- Falta cobertura para aprobación y rechazo

**Criterios de Aceptación**:
- [ ] Criterios para notificación por aprobación definidos
- [ ] Criterios para notificación por rechazo definidos
- [ ] Prueba ALF-13 para correo de aprobación
- [ ] Prueba ALF-14 para correo de rechazo
- [ ] Prueba ALF-15 para cambios de estado

**Tareas Secundarias**:
- T8.1: Agregar criterios de notificación (Media)
- T8.2: Crear pruebas de correo para todos los estados (Media)

---

#### T9: RF09 - Aclarar formato de listas (CSV vs XML) (Media Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Declara CSV/XML pero evidencia solo valida CSV
- Debe aclarase el alcance exacto

**Criterios de Aceptación**:
- [ ] Especificación clara: ¿solo CSV, solo XML, o ambos?
- [ ] Si XML: prueba ALF-16 para validar XML
- [ ] Si ambos: prueba ALF-16 para ambos formatos
- [ ] Actualización de criterios de aceptación

**Tareas Secundarias**:
- T9.1: Aclarar si RF09 acepta CSV, XML o ambos (Media)
- T9.2: Agregar prueba para formato adicional si aplica (Media)

---

#### T10: RNF02 - Definir carga y usuarios concurrentes (Media Prioridad)
**Estado**: Parcialmente Cubierto
**Descripción**:
- Tiene meta de 3 segundos pero falta carga esperada y usuarios concurrentes

**Criterios de Aceptación**:
- [ ] Cantidad esperada de usuarios concurrentes definida
- [ ] Escenario de carga documentado
- [ ] Prueba BET-06 de rendimiento con carga
- [ ] Métricas de baseline capturadas

**Tareas Secundarias**:
- T10.1: Definir usuarios concurrentes y escenario (Media)
- T10.2: Crear prueba de rendimiento BET-06 (Media)

---

#### T11: RNF03 - Definir mecanismo de medición para disponibilidad (Media Prioridad)
**Estado**: No Cubierto
**Descripción**:
- Disponibilidad 99.9% declarada sin mecanismo de medición

**Criterios de Aceptación**:
- [ ] Mecanismo de medición para SLA 99.9% definido
- [ ] Herramienta de monitoreo especificada
- [ ] Métrica de uptime documentada
- [ ] Prueba de disponibilidad BET-07

**Tareas Secundarias**:
- T11.1: Definir mecanismo de medición SLA (Media)
- T11.2: Crear evidencia de monitoreo (Media)

---

#### T12: RNF05 - Evidencia de mantenibilidad TypeScript (Media Prioridad)
**Estado**: No Cubierto
**Descripción**:
- TypeScript declarado sin evidencia de código o análisis estático

**Criterios de Aceptación**:
- [ ] Configuración TypeScript estricto documentada
- [ ] Reglas de linting definidas (ESLint config)
- [ ] Análisis de código estático habilitado (SonarQube)
- [ ] Baseline de calidad capturado
- [ ] Evidencia de análisis estático

**Tareas Secundarias**:
- T12.1: Documentar configuración TypeScript (Media)
- T12.2: Definir reglas de linting y QA (Media)

---

## TAREAS - DISEÑO (ACOPLAMIENTO Y COHESIÓN)

### Alta Prioridad

#### T13: Agregar clase MotorDeRiesgo al diseño (Alta Prioridad)
**Estado**: Gap Crítico
**Descripción**:
- RF04 y RF12 requieren clase de soporte para lógica de scoring e INTERPOL
- Actualmente calcularNivelDeRiesgo() está en EvaluacionMigratoria sin respaldo

**Criterios de Aceptación**:
- [ ] Clase MotorDeRiesgo creada con atributos: listasActivas, reglasDeEvaluacion
- [ ] Métodos: evaluarSolicitud(evaluacion), consultarInterpol(pasaporte)
- [ ] Diagrama de clases actualizado
- [ ] Trazabilidad establecida entre RF04, RF12 y MotorDeRiesgo

---

#### T14: Separar AgenteMigratorio en dos responsabilidades (Alta Prioridad)
**Estado**: Viola Principio de Responsabilidad Única
**Descripción**:
- Clase combina entidad (id, nombre, acceso) con lógica de proceso (dictamen, subsanación)
- registrarDictamen() y solicitarSubsanacion() no operan sobre atributos del agente

**Criterios de Aceptación**:
- [ ] AgenteMigratorio mantiene solo identidad (id, nombre, nivel)
- [ ] Nueva clase DictamenService con métodos de proceso
- [ ] Diagrama actualizado
- [ ] Cohesión mejorada (de Media a Alta)

---

#### T15: Crear LogAuditoriaRepository para exportación PDF (Alta Prioridad)
**Estado**: Gap en UC7-2
**Descripción**:
- Criterio UC7-2 requiere exportar logs a PDF no editable
- LogAuditoria no tiene método de exportación

**Criterios de Aceptación**:
- [ ] Clase LogAuditoriaRepository creada
- [ ] Método exportarPDF(filtros): implementado
- [ ] Diagrama de clases actualizado
- [ ] Trazabilidad con UC7-2

---

### Prioridad Media

#### T16: Refactorizar parámetro en gestionarCuentasAgentes() (Media Prioridad)
**Estado**: Alto acoplamiento de contenido
**Descripción**:
- Actualmente recibe objeto AgenteMigratorio completo
- Debe recibir solo identificador (UUID)

**Criterios de Aceptación**:
- [ ] Firma actualizada: gestionarCuentasAgentes(idAgente: UUID)
- [ ] Acoplamiento CBO reducido
- [ ] Pruebas actualizadas

---

## TAREAS - TRAZABILIDAD

### Alta Prioridad

#### T17: Crear matriz formal RF/RNF - caso de uso - criterio - prueba (Alta Prioridad)
**Descripción**:
- Establecer trazabilidad formal entre todos los requisitos y artefactos
- Actualizar matriz después de cada acción de mejora

**Criterios de Aceptación**:
- [ ] Matriz completa para RF01-RF12 (18 filas)
- [ ] Cada requisito vinculado con caso de uso
- [ ] Cada caso de uso vinculado con criterios de aceptación
- [ ] Cada criterio vinculado con prueba(s)
- [ ] Matriz documentada en Wiki de Jira

---

#### T18: Asignar identificadores únicos a criterios de aceptación (Alta Prioridad)
**Descripción**:
- Cada criterio debe tener ID único para trazabilidad
- Formato sugerido: UC#-CRIT-##

**Criterios de Aceptación**:
- [ ] Todos los criterios UC1-UC7 tienen ID único
- [ ] Documentación de esquema de numeración
- [ ] Referencia en matriz de trazabilidad

---

#### T19: Vincular cada requisito con tarea en Jira (Alta Prioridad)
**Descripción**:
- Cada RF/RNF debe tener una tarea en Jira
- Usar linking para establecer trazabilidad

**Criterios de Aceptación**:
- [ ] RF01-RF12: tareas creadas y linkeadas
- [ ] RNF01-RNF06: tareas creadas y linkeadas
- [ ] Enlaces de tipo "relates to" / "depends on" establecidos

---

## TAREAS - VALIDACIÓN FINAL

#### T20: Recalcular métricas tras acciones de mejora (Antes de entrega)
**Descripción**:
- Revalidar cobertura, volatilidad, trazabilidad después de todas las acciones

**Criterios de Aceptación**:
- [ ] Cobertura total estricta >= 50%
- [ ] Volatilidad <= 30%
- [ ] Trazabilidad completa >= 60%
- [ ] Documento de métricas actualizado

---

## RESUMEN DE ACCIONES

| Tarea | Prioridad | RF/RNF | Estado Actual | Estado Objetivo |
|-------|-----------|--------|---------------|-----------------|
| T1 | Alta | RF04 | Parcial | Cubierto |
| T2 | Alta | RF11 | No cubierto | Cubierto |
| T3 | Alta | RF12 | Parcial | Cubierto |
| T4 | Alta | RNF01 | Parcial | Cubierto (4 sub-req) |
| T5 | Alta | RNF06 | Parcial | Cubierto |
| T6 | Media | RF05 | Parcial | Cubierto |
| T7 | Media | RF07 | Parcial | Cubierto (2 flujos) |
| T8 | Media | RF08 | Parcial | Cubierto |
| T9 | Media | RF09 | Parcial | Cubierto |
| T10 | Media | RNF02 | Parcial | Cubierto |
| T11 | Media | RNF03 | No cubierto | Cubierto |
| T12 | Media | RNF05 | No cubierto | Cubierto |
| T13-T16 | Alta/Media | Diseño | Gaps | Coherente |
| T17-T19 | Alta | Trazabilidad | 33.3% | 80%+ |

---

**Generado**: 2026-05-26
**Basado en**: Document 1 (1).pdf - Avances para Parcial N°2
