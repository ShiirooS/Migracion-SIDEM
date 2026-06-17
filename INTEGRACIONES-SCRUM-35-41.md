# Integraciones del Sprint — SCRUM-35 a SCRUM-41

**SIDEM-PAN** · Sistema de debida diligencia migratoria para Panamá
Stack: Backend Express + TypeScript · Frontend React 19 + Vite · BD Supabase (PostgreSQL)

Este sprint cerró el **flujo end-to-end** del sistema: desde la solicitud del extranjero hasta el dictamen legal del agente, con datos reales y trazabilidad inmutable. A continuación, qué se hizo e integró en cada ticket.

---

## SCRUM-35 · Datos reales de INTERPOL (RF12)

**Qué se hizo:** se integró la fuente de datos **OpenSanctions** (la API directa de INTERPOL está bloqueada por convenio) para poblar la tabla `control_lists` con las Red Notices reales.

- Script de carga (`seed.ts`) que parsea el JSON oficial e inserta nombre, nacionalidad y pasaporte.
- El motor de scoring (`risk-engine.ts`) deja de usar datos simulados y detecta coincidencias reales por similitud de nombre (> 0.85).

> **Integración:** OpenSanctions → `control_lists` → motor de riesgo RF04.

---

## SCRUM-36 · Dashboard del agente (RF05)

**Qué se hizo:** pantalla principal del agente con la cola de expedientes **ordenada por riesgo descendente** (ALTO primero).

- **Backend:** `GET /api/applications` (protegido por JWT, rol AGENTE/ADMIN), con filtros por estado, paginación y aislamiento por agente asignado.
- **Frontend:** `ColaExpedientes.tsx` con tabla, semáforo de riesgo por color y botón *Revisar*.
- Al abrir un expediente, cambia su estado a `EN_EVALUACION` y registra la acción en auditoría.

> **Integración:** frontend ↔ endpoint real de expedientes con control de acceso.

---

## SCRUM-37 · Pantalla de dictamen legislativo (RF06)

**Qué se hizo:** la pantalla con mayor peso legal, donde el agente emite su **dictamen fundamentado** (APROBAR/RECHAZAR) citando el artículo del Decreto Ley.

- **Backend:** `POST /api/applications/:id/verdict` — valida la justificación, inserta en `dictamenes`, actualiza el estado del expediente y audita la decisión.
- **Frontend:** `ExpedienteDetalle.tsx` con datos del solicitante en solo lectura, desglose del riesgo, **visor PDF embebido** de los comprobantes y formulario de dictamen.
- Restricción: el agente **no puede modificar** los datos del solicitante (HTTP 403).

> **Integración:** visor de documentos + formulario legal → registro irrevocable del veredicto.

---

## SCRUM-38 · Consulta pública del trámite (RF03)

**Qué se hizo:** pantalla **sin login** para que el solicitante consulte el estado de su trámite con ticket + pasaporte.

- **Backend:** `GET /api/applications/status` (público), con rate limiting anti-enumeración y registro en auditoría.
- **Frontend:** `ConsultaEstado.tsx` que muestra estado, categoría y, si está resuelto, el artículo legal citado.
- **Protección de datos:** nunca expone nombre, nivel de riesgo ni el agente que procesó el caso.

> **Integración:** acceso público controlado → cierra el flujo end-to-end del sistema.

---

## SCRUM-39 · Auditoría inmutable WORM (RF10)

**Qué se hizo:** servicio de auditoría que registra **toda acción** sobre los expedientes de forma inmutable (Write-Once-Read-Many).

- **Backend:** servicio `audit.ts` (`logAction()`) invocado desde todos los flujos: creación, scoring, apertura, dictamen, login, consultas.
- **Endpoint admin:** `GET /api/audit-log` con filtros por fecha, agente y expediente.
- **Frontend:** `AuditLogViewer.tsx` para ver la línea de tiempo completa de un expediente.
- La inmutabilidad la garantizan **triggers SQL** que bloquean `DELETE`/`UPDATE`.

> **Integración:** capa transversal de trazabilidad sobre todos los módulos.

---

## SCRUM-40 · Conexión Frontend–Backend (Integración)

**Qué se hizo:** se reemplazó el **mock data** del frontend por llamadas reales a la API y se verificó el flujo completo.

- Centralización de llamadas HTTP en `frontend/src/lib/api.ts` con envío del token JWT.
- Manejo de estados de carga/error y configuración vía `VITE_API_URL` (sin URLs hardcodeadas, proxy Vite `/api`).
- Validación end-to-end y carga de **3 escenarios de demo**:
  - 🔴 **ALTO** — alerta INTERPOL real → rechazo (Art. 50 Num. 4)
  - 🟡 **MEDIO** — país restringido → revisión adicional
  - 🟢 **BAJO** — sin alertas → aprobación (Art. 28)

> **Integración:** unión real de las 5 pantallas anteriores en un flujo único funcional.

---

## SCRUM-41 · Despliegue en la nube (Deploy)

**Qué se hizo:** preparación del despliegue en **GCP Cloud Run / Azure Container Apps** con HTTPS automático (restricción organizacional: no usar Vercel).

- Contenedor backend (`node:20-alpine`) y build estático del frontend.
- TLS gestionado por la plataforma (certificado automático, costo $0).
- Variables de entorno de producción separadas de desarrollo + backup de BD previo a la demo.

> **Integración:** sistema accesible públicamente con HTTPS, conectado a BD de producción.

---

## Resumen del flujo integrado

```
Solicitante → Solicitud (ticket) → Scoring automático (INTERPOL real)
   → Dashboard agente (orden por riesgo) → Dictamen legal fundamentado
   → Consulta pública del estado → Auditoría WORM (trazabilidad total)
```

| Ticket | Módulo | Aporte clave |
|--------|--------|--------------|
| SCRUM-35 | Datos INTERPOL | Scoring con datos reales |
| SCRUM-36 | Dashboard agente | Priorización por riesgo |
| SCRUM-37 | Dictamen legal | Decisión fundamentada e irrevocable |
| SCRUM-38 | Consulta pública | Transparencia al solicitante |
| SCRUM-39 | Auditoría WORM | Trazabilidad inmutable |
| SCRUM-40 | Integración | Flujo end-to-end real |
| SCRUM-41 | Deploy | Sistema en producción con HTTPS |
