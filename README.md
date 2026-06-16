# SIDEM-PAN — Sistema de Debida Diligencia Migratoria

**Sistema gubernamental de evaluación de solicitudes migratorias para Panamá.**

Basado en **Decreto Ley 3 del 22 de febrero de 2008** | Proyecto: **ISA3.3** | Universidad Tecnológica de Panamá

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Base de datos | Supabase PostgreSQL (proyecto `wlzrvuwuhbtrjobcarar`) |
| Auth | JWT (jsonwebtoken) + bcrypt — token 15 min |
| Storage PDFs | Supabase Storage — bucket `documents` |

> No se necesita Docker ni PostgreSQL local. La BD y el Storage corren en Supabase cloud.

---

## Arranque Local

### Prerrequisitos

- Node.js 20+
- npm

### 1. Clonar el repositorio

```bash
git clone https://github.com/ShiirooS/Migracion-SIDEM.git
cd Migracion-SIDEM
```

### 2. Variables de entorno — Backend

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env` y completar los valores:

```env
NODE_ENV=development
PORT=4000
SUPABASE_URL=https://wlzrvuwuhbtrjobcarar.supabase.co
SUPABASE_SERVICE_KEY=<service_role key — ver Dashboard Supabase>
JWT_SECRET=change_me_to_a_strong_secret
JWT_EXPIRES_IN=15m
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=SIDEM-PAN <notificaciones@sidem-pan.gob.pa>
```

Para obtener `SUPABASE_SERVICE_KEY`:
- Ir a [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/wlzrvuwuhbtrjobcarar/settings/api)
- Copiar el valor de **service_role** (secret)

### 3. Variables de entorno — Frontend

```bash
cp frontend/.env.example frontend/.env
```

El `.env.example` del frontend ya tiene los valores públicos preconfigurados — no necesita cambios.

### 4. Instalar dependencias y arrancar

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev      # → http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev      # → http://localhost:5173
```

Abrir el navegador en **http://localhost:5173**

---

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sidem-pan.gob.pa | Admin2026! | ADMIN |
| agente1@sidem-pan.gob.pa | Admin2026! | AGENTE |
| agente2@sidem-pan.gob.pa | Admin2026! | AGENTE |

---

## Flujos de la Aplicación

### Ciudadano Extranjero (sin login)
1. Entrar a http://localhost:5173
2. Tab **"Ciudadano Extranjero"**
3. **Iniciar solicitud de evaluación** → wizard de 3 pasos (identidad, solvencia, antecedentes penales)
4. Al finalizar se genera un ticket `#PAN-AAAA-NNNNN`
5. **Consultar estado de trámite** → ingresar ticket + pasaporte

### Flujo de Subsanación (RF07)
Cuando un agente detecta un documento ilegible o insuficiente:

**Agente:**
1. Abre el expediente en estado `EN_EVALUACION`
2. Hace clic en **"Solicitar subsanación"**
3. Indica qué documento necesita y por qué
4. El sistema cambia el estado a `SUBSANACION_PENDIENTE` y envía un email al solicitante

**Solicitante:**
1. Recibe un email con las instrucciones
2. Consulta el estado con ticket + pasaporte
3. Ve el mensaje **"Qué debe corregir"** con la razón detallada
4. Hace clic en **"Subir documentos corregidos"**
5. Sube los PDFs corregidos (solvencia y/o antecedentes)
6. El expediente vuelve a `EN_EVALUACION` automáticamente

**Agente (continuación):**
7. Ve el expediente de vuelta en su cola con los documentos actualizados
8. Continúa con el dictamen normalmente

### Agente de Cumplimiento (login con rol AGENTE)
1. Tab **"Acceso Institucional"** → ingresar credenciales
2. **Cola de expedientes** — lista ordenada por score de riesgo (ALTO primero), con badges de alerta INTERPOL/OFAC
3. Hacer clic en un expediente → ver detalle completo, documentos PDF y formulario de dictamen
4. Emitir **APROBADO** o **RECHAZADO** citando el artículo legal

### Administrador (login con rol ADMIN)
Todo lo del Agente, más:
- **Log de auditoría WORM** — registro inmutable de todas las acciones (Art. 6 DL3/2008)
- **Métricas operativas SNM** — dashboard con totales por estado, nivel de riesgo y categoría migratoria

---

## Endpoints API

| Método | Ruta | Acceso | Story |
|--------|------|--------|-------|
| POST | `/api/auth/login` | Público | Auth |
| POST | `/api/applications` | Público | SCRUM-33 |
| GET | `/api/applications` | AGENTE / ADMIN | SCRUM-36 |
| GET | `/api/applications/status` | Público | SCRUM-38 |
| GET | `/api/applications/:id` | AGENTE / ADMIN | SCRUM-37 |
| POST | `/api/applications/:id/verdict` | AGENTE / ADMIN | SCRUM-37 |
| POST | `/api/applications/:id/request-subsanacion` | AGENTE / ADMIN | RF07 |
| POST | `/api/applications/:id/subsanar` | Público | RF07 |
| GET | `/api/audit-log` | ADMIN | SCRUM-39 |
| GET | `/api/metrics` | ADMIN | SCRUM-40 |
| GET | `/health` | Público | — |

---

## Estructura del Repositorio

```
.
├── backend/
│   ├── src/
│   │   ├── lib/supabase.ts            ← cliente Supabase admin (service key)
│   │   ├── middleware/auth.ts         ← requireAuth() con verificación JWT
│   │   ├── routes/
│   │   │   ├── auth.ts                ← POST /api/auth/login
│   │   │   ├── applications.ts        ← CRUD expedientes + scoring
│   │   │   ├── audit.ts               ← GET /api/audit-log (WORM)
│   │   │   └── metrics.ts             ← GET /api/metrics (admin)
│   │   ├── services/
│   │   │   ├── audit.ts               ← logAction() centralizado
│   │   │   ├── risk-engine.ts         ← calcularRiesgo() INTERPOL/OFAC/País
│   │   │   └── notifications.ts       ← enviarNotificacion() con Resend
│   │   └── index.ts                   ← servidor Express
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/migracheck/
│   │   │   ├── LoginView.tsx           ← pantalla de acceso (ciudadano + institucional)
│   │   │   ├── MigraCheckApp.tsx       ← router de vistas públicas
│   │   │   ├── agente/
│   │   │   │   ├── AgenteShell.tsx     ← shell con sidebar y navegación
│   │   │   │   ├── ColaExpedientes.tsx ← lista con filtros y badges de riesgo
│   │   │   │   ├── ExpedienteDetalle.tsx ← detalle + formulario de dictamen
│   │   │   │   ├── SubsanacionAgente.tsx ← formulario solicitar subsanación
│   │   │   │   ├── AuditLogViewer.tsx  ← visor log WORM con filtros
│   │   │   │   └── MetricasSNM.tsx     ← dashboard de métricas
│   │   │   └── solicitante/
│   │   │       ├── SolicitudFlow.tsx   ← wrapper del wizard
│   │   │       ├── NuevaSolicitud.tsx  ← wizard 3 pasos
│   │   │       ├── ConsultaEstado.tsx  ← consulta pública por ticket+pasaporte
│   │   │       └── SubsanarDocumentos.tsx ← pantalla pública subsanar documentos
│   │   └── lib/api.ts                  ← cliente HTTP hacia el backend
│   ├── .env.example
│   └── package.json
├── supabase/
│   ├── migrations/
│   │   └── 20260528000001_initial_schema.sql  ← esquema completo + triggers WORM
│   └── seed.sql                        ← usuarios y datos de prueba
└── .mcp.json                           ← MCP server Supabase para Claude Code
```

---

## Motor de Scoring de Riesgo

| Factor | Puntos | Base legal |
|--------|--------|-----------|
| INTERPOL Red Notice (por pasaporte) | +50 | Art. 50 Num. 4 DL3/2008 |
| INTERPOL Red Notice (por nombre, fuzzy) | +50 | Art. 50 Num. 4 DL3/2008 |
| OFAC SDN (por pasaporte) | +40 | Art. 50 Num. 5 DL3/2008 |
| País con atención especial | +10 | Art. 6 Num. 4 DL3/2008 |

Umbrales: `0–9` **BAJO** · `10–49` **MEDIO** · `≥50` **ALTO**

---

## Roles y Permisos

| Rol | Capacidades |
|-----|------------|
| Solicitante | Crea solicitud y consulta estado — sin login |
| AGENTE | Cola de expedientes, detalle, emitir dictamen (JWT) |
| ADMIN | Todo lo del AGENTE + auditoría WORM + métricas SNM (JWT) |

---

## Criterios de Aceptación Sprint 1

| ID | Verificación | RF |
|----|-------------|-----|
| CA-01 | Formulario bloquea pasaporte con < 6 meses de vigencia | RF02 |
| CA-02 | Formulario bloquea archivos que no sean PDF (máx. 5 MB) | RF02 |
| CA-03 | Solicitud válida genera ticket `#PAN-AAAA-NNNNN` | RF01 |
| CA-04 | Solicitud con nombre/pasaporte INTERPOL → badge ROJO en cola | RF04 |
| CA-05 | Cola muestra expedientes ALTO primero (score desc) | RF05 |
| CA-06 | Agente aprueba expediente citando artículo legal | RF06 |
| CA-07 | Agente rechaza expediente citando Art. 50 Num. 4 | RF06 |
| CA-08 | Dictamen sin justificación → botón deshabilitado | RF06 |
| CA-09 | Solicitante consulta estado con ticket + pasaporte | RF03 |
| CA-10 | Audit log muestra todas las acciones con IP y timestamp | RF10 |
| CA-11 | Acceso a endpoints protegidos sin JWT → 401 | RBAC |
| CA-12 | Métricas SNM solo accesibles con rol ADMIN | RBAC |

---

## Sprint 1 — Implementaciones

| Story | Descripción | Estado |
|-------|-------------|--------|
| SCRUM-33 | `POST /api/applications` — validaciones legales + upload PDF | ✅ |
| SCRUM-34 | Motor scoring INTERPOL / OFAC / País restringido | ✅ |
| SCRUM-35 | Login JWT + bcrypt + audit de accesos | ✅ |
| SCRUM-36 | Cola de expedientes ordenada por riesgo (frontend + backend) | ✅ |
| SCRUM-37 | Detalle de expediente + formulario dictamen + signed PDF URLs | ✅ |
| SCRUM-38 | Consulta pública de estado por ticket + pasaporte | ✅ |
| SCRUM-39 | Log de auditoría WORM con triggers SQL anti-DELETE/UPDATE | ✅ |
| SCRUM-40 | Métricas operativas SNM — endpoint admin + dashboard frontend | ✅ |
| RF07 | Flujo de subsanación de documentos — nuevo estado + pantalla solicitante | ✅ |
| RF08 | Notificaciones email con Resend — DKIM automático + email_logs | ✅ |
