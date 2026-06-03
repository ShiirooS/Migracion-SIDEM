# SIDEM-PAN: Módulo Digital de Debida Diligencia Migratoria

**Sistema gubernamental de evaluación de solicitudes migratorias para Panamá.**

Basado en **Decreto Ley 3 de 22 de febrero de 2008** | Proyecto: **ISA3.3** | Universidad Tecnológica de Panamá

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Base de datos | Supabase PostgreSQL (proyecto `wlzrvuwuhbtrjobcarar`) |
| Auth | JWT (jsonwebtoken) + bcrypt, token 15 min |
| Storage PDFs | Supabase Storage — bucket `documents` |
| Deploy | GCP Cloud Run o Azure Container Apps |

> No se necesita Docker ni PostgreSQL local. La BD y el Storage corren en Supabase.

---

## Arranque Local

### Prerrequisitos

- Node.js 20+ (ver `.nvmrc`)
- npm o pnpm

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/ShiirooS/Migracion-SIDEM.git
cd Migracion-SIDEM
git checkout dev
```

### 2. Variables de entorno del backend

```bash
cp backend/.env.example backend/.env
```

Abrir `backend/.env` y completar `SUPABASE_SERVICE_KEY`:
- Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/wlzrvuwuhbtrjobcarar/settings/api)
- Copiar el valor de **service_role** (secret)
- Pegarlo en el `.env`

El `SUPABASE_URL` ya está pre-configurado en el `.env.example`.

### 3. Variables de entorno del frontend

```bash
cp frontend/.env.example frontend/.env
```

El `.env.example` del frontend ya incluye la `VITE_SUPABASE_ANON_KEY` pública — no necesita cambios.

### 4. Instalar dependencias y arrancar

```bash
# Backend (terminal 1)
cd backend
npm install
npm run dev      # → http://localhost:4000

# Frontend (terminal 2)
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
│   │   ├── lib/
│   │   │   └── supabase.ts        ← cliente Supabase admin (service key)
│   │   ├── middleware/
│   │   │   └── auth.ts            ← requireAuth() con verificación JWT
│   │   ├── routes/
│   │   │   ├── auth.ts            ← POST /api/auth/login
│   │   │   ├── applications.ts    ← CRUD expedientes + scoring
│   │   │   └── audit.ts           ← GET /api/audit-log
│   │   ├── services/
│   │   │   ├── audit.ts           ← logAction() WORM centralizado
│   │   │   └── risk-engine.ts     ← calcularRiesgo() INTERPOL/OFAC/País
│   │   ├── db/
│   │   │   └── migrations/001_initial.sql  ← esquema (ya aplicado en Supabase)
│   │   └── index.ts               ← servidor Express
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── migracheck/        ← pantallas principales
│   │   │   │   ├── admin/         ← CuentasAgentes, Trazabilidad, etc.
│   │   │   │   ├── agente/        ← CasosPendientes, HistorialDictamenes
│   │   │   │   └── solicitante/   ← NuevaSolicitud, MisTramites, MarcoLegal
│   │   │   └── ui/                ← shadcn/ui
│   │   ├── lib/
│   │   │   └── api.ts             ← cliente HTTP hacia el backend
│   │   └── vite-env.d.ts          ← tipos para import.meta.env y assets
│   ├── .env.example
│   ├── vite.config.ts             ← proxy /api → localhost:4000
│   └── package.json
├── scripts/
│   └── import-interpol.ts         ← importa INTERPOL/OFAC desde OpenSanctions
├── infra/
│   └── docker-compose.yml         ← referencia histórica (ya no requerido)
├── .mcp.json                      ← MCP server Supabase para Claude Code
└── docs/
```

---

## Endpoints API

| Método | Ruta | Rol | Story |
|--------|------|-----|-------|
| POST | `/api/auth/login` | Público | Auth |
| POST | `/api/applications` | Público | SCRUM-33 |
| GET | `/api/applications` | AGENTE/ADMIN | SCRUM-36 |
| GET | `/api/applications/status` | Público | SCRUM-38 |
| GET | `/api/applications/:id` | AGENTE/ADMIN | SCRUM-37 |
| POST | `/api/applications/:id/verdict` | AGENTE/ADMIN | SCRUM-37 |
| GET | `/api/audit-log` | ADMIN | SCRUM-39 |

---

## Roles y Permisos (RBAC)

| Rol | Acceso |
|-----|--------|
| SOLICITANTE | Crea solicitud y consulta estado — sin login |
| AGENTE | Revisa expedientes asignados y emite dictamen (JWT) |
| ADMIN | Todo lo del agente + auditoría + gestión de agentes (JWT) |

---

## Motor de Scoring de Riesgo (RF04)

| Factor | Puntos | Artículo |
|--------|--------|----------|
| INTERPOL Red Notice | +50 | Art. 50 Num. 4 |
| OFAC SDN | +40 | Art. 50 Num. 5 |
| País con atención especial | +10 | Art. 6 Num. 4 |

Umbrales: `0–9` BAJO · `10–49` MEDIO · `50–100` ALTO

---

## Scripts Útiles

```bash
# Importar alertas INTERPOL/OFAC desde OpenSanctions (SCRUM-35)
cd scripts
npx ts-node import-interpol.ts
```

---

## Registro de Implementaciones

### Sprint 1 — Completado

| Story | Responsable | Descripción | Estado |
|-------|------------|-------------|--------|
| SCRUM-29 | Bruno | Setup stack y monorepo | ✅ |
| SCRUM-30 | Bruno | Migración SQL + BD Supabase | ✅ |
| SCRUM-31 | Bruno | JWT auth + middleware RBAC | ✅ |
| SCRUM-32 | Gerald | Formulario wizard de solicitud migratoria | ✅ |
| SCRUM-33 | Eriel | `POST /api/applications` — validaciones + guardado en BD | ✅ |
| SCRUM-34 | Ana | Motor de scoring INTERPOL/OFAC/País restringido | ✅ |
| SCRUM-35 | Eriel | Script importación INTERPOL desde OpenSanctions | ✅ |
| SCRUM-36 | Gerald | Dashboard agente — lista expedientes por riesgo | ✅ |
| SCRUM-37 | Ana | Pantalla dictamen + visor PDF (URLs firmadas Supabase) | ✅ |
| SCRUM-38 | Gerald | Consulta pública de estado del trámite | ✅ |
| SCRUM-39 | Bruno | Servicio `logAction()` — auditoría WORM centralizado | ✅ |
| SCRUM-40 | Ana | Integración frontend-backend con Supabase | ✅ |
| SCRUM-41 | Bruno | Deploy GCP Cloud Run / Azure con HTTPS | Pendiente |

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
