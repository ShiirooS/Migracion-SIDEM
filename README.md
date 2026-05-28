# SIDEM-PAN: Módulo Digital de Debida Diligencia Migratoria

**Sistema gubernamental de evaluación de solicitudes migratorias para Panamá.**

Basado en **Decreto Ley 3 de 22 de febrero de 2008** | Proyecto: **ISA3.3** | Universidad Tecnológica de Panamá

---

## Descripción del Proyecto

SIDEM-PAN es un módulo digital que automatiza el proceso de **debida diligencia migratoria** en Panamá. El sistema permite:

- **Registro y validación** de solicitudes de evaluación migratoria
- **Scoring automático de riesgo** basado en múltiples variables
- **Integración con INTERPOL** para validación de pasaportes
- **Dashboard administrativo** para agentes migratorios
- **Auditoría completa** con logs inmutables (WORM)
- **Notificaciones** por correo electrónico
- **Exportación de reportes** en PDF

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcrypt, token 15 min |
| Almacenamiento PDFs | Sistema de archivos local `/uploads` |
| Deploy | GCP Cloud Run o Azure Container Apps |

---

## Arranque Local

```bash
# 1. Copiar variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Levantar PostgreSQL (ejecuta la migración automáticamente)
cd infra && docker compose up -d

# 3. Backend
cd backend
npm install
npm run seed     # crea usuarios de prueba (contraseña: sidem2026)
npm run dev      # → http://localhost:4000

# 4. Frontend
cd frontend
npm install
npm run dev      # → http://localhost:5173
```

### Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sidem-pan.gob.pa | sidem2026 | ADMIN |
| agente1@sidem-pan.gob.pa | sidem2026 | AGENTE |
| agente2@sidem-pan.gob.pa | sidem2026 | AGENTE |

---

## Estructura del Repositorio

```
.
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── migrations/001_initial.sql
│   │   │   ├── seeds/seed.ts
│   │   │   ├── pool.ts
│   │   │   └── migrate.ts
│   │   ├── middleware/auth.ts
│   │   ├── routes/auth.ts
│   │   ├── services/          ← risk-engine.ts, audit.ts (pendientes)
│   │   └── index.ts
│   ├── .env.example
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── migracheck/    ← app principal
│   │   │   └── ui/            ← shadcn/ui
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts         ← cliente HTTP
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
├── infra/
│   ├── docker-compose.yml
│   └── initdb/001_initial.sql ← ejecutado automáticamente por Docker
├── docs/
└── scripts/
```

---

## Roles y Permisos (RBAC)

| Rol | Acceso |
|-----|--------|
| SOLICITANTE | Crea solicitud y consulta estado — sin login |
| AGENTE | Revisa expedientes asignados y emite dictamen (JWT) |
| ADMIN | Todo lo del agente + auditoría + gestión de agentes (JWT) |

---

## Scoring de Riesgo (RF04)

| Factor | Puntos | Artículo |
|--------|--------|----------|
| INTERPOL Red Notice | +50 | Art. 50 Num. 4 |
| OFAC SDN | +40 | Art. 50 Num. 5 |
| País con atención especial | +10 | Art. 6 Num. 4 |

Umbrales: `0–9` BAJO · `10–49` MEDIO · `50–100` ALTO

---

## Endpoints API

| Método | Ruta | Rol | RF |
|--------|------|-----|----|
| POST | `/api/auth/login` | Público | Auth |
| POST | `/api/applications` | Público | RF01, RF02, RF04 |
| GET | `/api/applications` | AGENTE | RF05 |
| GET | `/api/applications/:id` | AGENTE | RF05, RF06 |
| POST | `/api/applications/:id/verdict` | AGENTE | RF06 |
| GET | `/api/applications/status` | Público | RF03 |
| GET | `/api/audit-log` | ADMIN | RF10 |

---

## Registro de Implementaciones (Sprint 1)

### SCRUM-29 — [SETUP] Stack tecnológico y monorepo
**Responsable:** Bruno | **Estado:** ✅ Completado

- Estructura de carpetas `backend/` y `frontend/`
- `docker-compose.yml` con PostgreSQL 16
- `tsconfig.json`, `.env.example`, `.editorconfig`, `.eslintrc.json`
- Scripts base de `package.json`

---

### SCRUM-30 — [BD] Migración SQL 001_initial.sql
**Responsable:** Bruno | **Estado:** ✅ Completado

Archivos creados:
- `backend/src/db/migrations/001_initial.sql` — esquema completo
- `infra/initdb/001_initial.sql` — ejecutado automáticamente por Docker al iniciar
- `backend/src/db/pool.ts` — pool de conexiones PostgreSQL
- `backend/src/db/migrate.ts` — script `npm run migrate`
- `backend/src/db/seeds/seed.ts` — script `npm run seed`

Tablas creadas:
- `agentes` — usuarios del sistema (AGENTE / ADMIN)
- `applications` — expedientes migratorios con todos los campos del RF01
- `dictamenes` — decisiones del agente con artículo legal citado
- `control_lists` — listas INTERPOL, OFAC SDN y países restringidos
- `audit_log` — log inmutable WORM (Art. 6 DL3/2008)

Datos precargados:
- 27 países con atención especial según Dec. Ej. 521/2018, 196/2024 y 22/2025
- Triggers WORM en `audit_log` (DELETE y UPDATE bloqueados)
- Extensiones `pgcrypto` y `pg_trgm` para búsqueda fuzzy de nombres INTERPOL
- Secuencia `ticket_seq` para generar `PAN-AAAA-NNNNN`

---

### SCRUM-31 — [AUTH] JWT + middleware RBAC
**Responsable:** Bruno | **Estado:** ✅ Completado

Archivos creados:
- `backend/src/middleware/auth.ts` — `requireAuth('AGENTE', 'ADMIN')` con verificación JWT → HTTP 401/403
- `backend/src/routes/auth.ts` — `POST /api/auth/login` con bcrypt + registro en `audit_log`
- `backend/src/index.ts` — servidor Express con proxy de `/uploads`

Comportamiento:
- Login exitoso → devuelve `{ token, rol, nombre }` + registra `LOGIN_EXITOSO`
- Login fallido → HTTP 401 + registra `LOGIN_FALLIDO`
- Token expirado/inválido → HTTP 401
- Rol insuficiente → HTTP 403

---

### SCRUM-32 — [RF01] Formulario Wizard de solicitud migratoria
**Responsable:** Gerald | **Estado:** ✅ Completado

Archivos modificados/creados:
- `frontend/src/components/migracheck/solicitante/NuevaSolicitud.tsx` — wizard completo
- `frontend/src/lib/api.ts` — cliente HTTP (`createApplication`, `login`, `getApplications`, etc.)
- `frontend/src/components/migracheck/LoginView.tsx` — login real contra backend
- `frontend/src/components/migracheck/MigraCheckApp.tsx` — sesión persistente con localStorage

Frontend integrado (importado de `kelvinhe04/sidem-pan-portal`):
- Config Lovable/Cloudflare reemplazada por Vite estándar
- `vite.config.ts` con proxy `/api` → `localhost:4000`
- `index.html`, `main.tsx`, `package.json`, `tsconfig.json`

Wizard (3 pasos):
- **Paso 1:** Nombres, Apellidos, Fecha nacimiento (≥18 años), Nacionalidad (65 países ISO), N° Pasaporte, Fecha vencimiento pasaporte, Categoría migratoria
- **Paso 2:** Monto subsistencia (USD > 0), Comprobante solvencia PDF (≤5MB)
- **Paso 3:** Certificado antecedentes penales PDF (≤5MB)

Validaciones implementadas (CA-01 a CA-03):
- CA-01: Bloquea si pasaporte vence en < 6 meses → mensaje exacto Art. 43 DL3/2008
- CA-02: Bloquea si archivo no es PDF o supera 5MB → mensaje de error por campo
- CA-03: Pantalla de confirmación con `#PAN-AAAA-NNNNN`, categoría y estado PENDIENTE

Conecta a: `POST /api/applications` (SCRUM-33 — pendiente Eriel)

---

## Pendientes Sprint 1

| Story | Responsable | Descripción |
|-------|------------|-------------|
| SCRUM-33 | Eriel | `POST /api/applications` — validaciones backend + guardado en BD |
| SCRUM-34 | Ana | Motor de scoring INTERPOL/OFAC/País restringido |
| SCRUM-35 | Eriel | Script de importación INTERPOL desde OpenSanctions |
| SCRUM-36 | Gerald | Dashboard agente — lista expedientes por riesgo |
| SCRUM-37 | Ana | Pantalla dictamen + visor PDF |
| SCRUM-38 | Gerald | Consulta pública de estado del trámite |
| SCRUM-39 | Bruno | Servicio `logAction()` — auditoría WORM |
| SCRUM-40 | Ana | Integración frontend-backend + 3 escenarios demo |
| SCRUM-41 | Bruno | Deploy GCP Cloud Run / Azure con HTTPS |

---

## Criterios de Aceptación MVP

| ID | Verificación | RF |
|----|-------------|-----|
| CA-01 | Formulario bloquea pasaporte con < 6 meses de vigencia | RF02 |
| CA-02 | Formulario bloquea archivos que no sean PDF | RF02 |
| CA-03 | Solicitud válida genera ticket `#PAN-AAAA-NNNNN` | RF01 |
| CA-04 | Solicitud con nombre INTERPOL → badge ROJO en dashboard | RF04 |
| CA-05 | Dashboard muestra expedientes ALTO primero | RF05 |
| CA-06 | Agente aprueba expediente citando Art. 28 | RF06 |
| CA-07 | Agente rechaza expediente citando Art. 50 Num. 4 | RF06 |
| CA-08 | Dictamen sin justificación → botón deshabilitado | RF06 |
| CA-09 | Solicitante consulta estado con ticket + pasaporte | RF03 |
| CA-10 | Audit log muestra secuencia CREADO→SCORING→ABIERTO→DICTAMEN | RF10 |
| CA-11 | Campos del solicitante son solo lectura para el agente | RF06 |
| CA-12 | Acceso a dashboard sin JWT → 401 | RBAC |

---

## Requisitos Locales

- Node.js 20 (ver `.nvmrc`)
- Docker y Docker Compose
