# Plan de Sprints - SIDEM-PAN Parcial 2

Basado en la especificación de requisitos y análisis de volatilidad/trazabilidad del Documento 1.

---

## Resumen Ejecutivo

| Métrica | Actual | Meta Final |
|---------|--------|-----------|
| Cobertura de Requisitos | 33.3% (6/18) | 50%+ |
| Volatilidad | 50% (9/18) | 30%- |
| Trazabilidad Completa | 33.3% (6/18) | 60%+ |
| Gaps de Arquitectura | 4 | 0 |
| Duracion Total | - | 7.5 semanas |
| Equipo | - | 3-5 personas/sprint |

---

## Sprint 1: Fundamentos y Seguridad (2 semanas)

**Objetivo**: Establecer base sólida de seguridad y flujos básicos.

### Requisitos Cubiertos
- **RF01**: Registrar Evaluación Migratoria
- **RF02**: Validar Documentos (Pasaporte + PDF)
- **RF03**: Consultar Estado de Solicitud
- **RF10**: Auditoría y Trazabilidad (logs básicos)
- **RNF01**: Seguridad (2FA, cifrado, TLS)
- **RNF04**: Usabilidad (WCAG 2.1)

### Tareas Jira
- SCRUM-9: RNF01 - Dividir requisitos de seguridad (4 sub-requisitos)
- SCRUM-26: RF01 - Registrar Evaluación Migratoria
- SCRUM-27: RF02 - Validar Documentos
- SCRUM-28: RF03 - Consultar Estado
- SCRUM-30: RF10 - Auditoría y Trazabilidad
- SCRUM-31: RNF04 - Usabilidad WCAG 2.1

### Caracteristicas Clave
- Autenticación segura (JWT + 2FA con TOTP)
- Control de acceso basado en roles
- Logs de auditoría iniciales
- UI accesible
- Sin dependencias (todas las tareas son independientes)

### Métricas de Salida
- Cobertura: 33.3% → 38.9% (7/18)
- Volatilidad sin cambios (requisitos base no son volátiles)
- Trazabilidad: 33.3% → 38.9%

### Equipo Sugerido
- 3-4 personas
- 1 fullstack (auth + evaluaciones)
- 1 backend (auditoría)
- 1-2 frontend (UI, accesibilidad)

---

## Sprint 2: Lógica de Negocio Avanzada (3 semanas)

**Objetivo**: Implementar 70% de la lógica central del sistema.

### Requisitos Cubiertos
- **RF04**: Motor de Scoring de Riesgo
- **RF05**: Dashboard Administrativo
- **RF06**: Registrar Dictamen Legal
- **RF07**: Proceso de Subsanación (2 flujos)
- **RF08**: Notificaciones por Email
- **RF09**: Actualizar Listas de Control
- **RF11**: Asignar Expediente a Agente
- **RF12**: Consulta a INTERPOL
- **RNF02**: Rendimiento (<3s P95)

### Tareas Jira
- SCRUM-6: RF04 - Motor de Scoring + Pruebas ALF-03, ALF-07
- SCRUM-7: RF11 - Asignación Equitativa (UC8)
- SCRUM-8: RF12 - Consulta INTERPOL (separar de RF04)
- SCRUM-17: RF05 - Dashboard Administrativo
- SCRUM-18: RF07 - Subsanación (2 flujos: UC4-A, UC4-B)
- SCRUM-19: RF08 - Notificaciones por Email (3 eventos)
- SCRUM-20: RF09 - Importación de Listas (CSV/XML)
- SCRUM-21: RNF02 - Pruebas de Rendimiento (BET-06)
- SCRUM-29: RF06 - Registrar Dictamen Legal

### Caracteristicas Clave
- Inyección de dependencias (MotorDeRiesgo independiente)
- Integración con INTERPOL (API externa)
- Sistema de notificaciones robusto
- Dashboard con filtros y ordenamiento
- Optimización de queries para rendimiento

### Dependencias
- Requiere Sprint 1 completado (auth, logs básicos)

### Métricas de Salida
- Cobertura: 38.9% → 72.2% (13/18)
- Volatilidad: 50% → 22.2% (4/18 aún volátiles: RNF05, RNF06, algunos gaps)
- Trazabilidad: 38.9% → 72.2%

### Equipo Sugerido
- 4-5 personas
- 2 backend (scoring, INTERPOL, dashboard)
- 1 fullstack (subsanación, notificaciones)
- 1 frontend (dashboard UI)
- 1 database (optimización, índices)

---

## Sprint 3: Calidad, Diseño y Validación (2.5 semanas)

**Objetivo**: Excelencia técnica y validación final.

### Requisitos Cubiertos
- **RNF03**: Disponibilidad 99.9% (monitoreo, health checks)
- **RNF05**: Mantenibilidad (TypeScript, ESLint, SonarQube)
- **RNF06**: Logs WORM (inmutabilidad garantizada)
- **Trazabilidad**: Matriz formal RF/RNF-UC-Criterios-Pruebas

### Tareas Jira
**Arquitectura**:
- SCRUM-11: Agregar Clase MotorDeRiesgo al diseño
- SCRUM-12: Separar AgenteMigratorio (SRP)
- SCRUM-13: Crear LogAuditoriaRepository (exportación PDF)
- SCRUM-24: Refactorizar gestionarCuentasAgentes() (reducir CBO)

**No-Funcionales**:
- SCRUM-10: RNF06 - Logs WORM (triggers PostgreSQL)
- SCRUM-22: RNF03 - SLA 99.9% (monitoreo, Grafana)
- SCRUM-23: RNF05 - TypeScript + ESLint + SonarQube

**Trazabilidad**:
- SCRUM-14: Crear matriz formal RF/RNF-UC-Criterios-Pruebas
- SCRUM-15: Asignar IDs únicos a criterios de aceptación (UC#-CRIT-##)
- SCRUM-16: Vincular requisitos con tareas Jira

**Validación**:
- SCRUM-25: Recalcular métricas finales (cobertura, volatilidad, trazabilidad)

### Caracteristicas Clave
- Arquitectura refactorizada (cohesión mejorada)
- Código de calidad (SonarQube, linting automático)
- Logs inmutables a nivel de BD
- Monitoreo en producción
- Trazabilidad 100% documentada

### Dependencias
- Requiere Sprints 1 y 2 completados (código base existe)

### Métricas de Salida
- Cobertura: 72.2% → 100%
- Volatilidad: 22.2% → 0%
- Trazabilidad: 72.2% → 100%
- Gaps de diseño: 4 → 0
- CBO promedio: 1.5 (excelente)

### Equipo Sugerido
- 3-4 personas
- 1 arquitecto (refactoring, diseño)
- 1 backend (WORM, logs)
- 1 devops (monitoreo, SLA)
- 1 qa (trazabilidad, validación)

---

## Flujo de Dependencias

```
Sprint 1: Fundamentos
    ├─ Autenticación (JWT + 2FA)
    ├─ Logs básicos
    └─ RBAC
    ↓ (secuencial, requiere completarse)

Sprint 2: Negocio
    ├─ Scoring + INTERPOL
    ├─ Dashboard
    ├─ Subsanación
    ├─ Notificaciones
    └─ Rendimiento
    ↓ (secuencial, requiere completarse)

Sprint 3: Calidad
    ├─ Refactoring arquitectura
    ├─ WORM logs
    ├─ Monitoreo 99.9%
    └─ Trazabilidad
    ↓ (final)

LANZAMIENTO: Sistema production-ready
```

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Volatilidad de RF04, RF12 | Media | Alto | Clarificar requisitos en Sprint 1, tests temprano |
| Integración INTERPOL | Media | Alto | Mock en dev, API sandbox en staging |
| Trazabilidad incompleta | Baja | Medio | Matriz en Sprint 3, documentación live |
| Performance RNF02 | Media | Medio | Índices de BD temprano, testing de carga en Sprint 2 |
| WORM logs RNF06 | Baja | Bajo | Diseño en Sprint 1, triggers en Sprint 3 |

---

## Métricas de Éxito

**Sprint 1**: Seguridad base establecida, todos los tests de auth pasan
**Sprint 2**: Lógica central implementada, P95 < 3s confirmado
**Sprint 3**: 100% cobertura, 0% volatilidad, 100% trazabilidad

---

## Referencias

- Documento 1: Avances Parcial 2 - Mayo 2026
- JIRA_TASKS_SIDEM_PAN.md: Detalles de cada tarea
- README.md: Arquitectura técnica y stack
