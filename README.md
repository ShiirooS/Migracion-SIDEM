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
- **Gestión de subsanaciones** (corrección de documentos)
- **Asignación equitativa** de casos a agentes
- **Auditoría completa** con logs inmutables (WORM)
- **Notificaciones** por correo electrónico
- **Exportación de reportes** en PDF

---


### Proposito legal y obligatorio

- El sistema debe cumplir el Decreto Ley 3/2008: registro nacional de extranjeria, dictamen con fundamento legal, validacion de pasaporte vigente, captura de categoria migratoria, evaluacion de solvencia y cruces con listas de control.
- La demo del MVP es el subconjunto minimo que demuestra esos articulos con trazabilidad completa.

### MVP obligatorio (entra en la demo)

- RF01 Registro de evaluacion migratoria.
- RF02 Validacion automatica (pasaporte vigente y PDFs).
- RF04 Motor de scoring de riesgo.
- RF05 Dashboard del agente.
- RF06 Dictamen legislativo (aprobar/rechazar con articulo citado).
- RF03 Consulta de estado del tramite.
- RF10 Trazabilidad y auditoria (log inmutable).

### Fuera del MVP (sprint siguiente)

- RF07 Subsanacion de documentos.
- RF08 Notificaciones por correo.
- RF09 Carga de listas CSV.
- RF11 Asignacion automatica de expedientes.
- RNF01a 2FA, RNF01b cifrado de columnas, RNF03 SLA 99.9%.

### Stack tecnico definido

- Frontend: React + TypeScript + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: PostgreSQL (alternativa demo: SQLite).
- Auth: JWT + bcrypt, token 15 minutos.
- Almacenamiento PDFs: sistema de archivos local (/uploads).
- Deploy: GCP Cloud Run o Azure Container Apps (no Vercel).

### Roles y permisos (RBAC)

- SOLICITANTE: crea solicitud y consulta estado sin login.
- AGENTE: revisa expedientes asignados y emite dictamen (JWT).
- ADMIN: todo lo del agente + auditoria + gestion de agentes (JWT).

### Puntos clave de scoring (RF04)

- INTERPOL Red Notice: +50 (riesgo ALTO).
- OFAC SDN: +40 (riesgo MEDIO).
- Pais restringido: +10 (riesgo MEDIO).
- Umbrales: 0-9 BAJO, 10-49 MEDIO, 50-100 ALTO.

### Fuentes de listas de control

- INTERPOL Red Notices via OpenSanctions (uso no comercial).
- OFAC SDN (CSV publico) o OpenSanctions.
- Lista de paises con atencion especial segun Decretos Ejecutivos.

### Endpoints base (contrato inicial)

- POST /api/auth/login
- GET /api/applications (agente)
- POST /api/applications (solicitante)
- GET /api/applications/:id (agente)
- POST /api/applications/:id/verdict (agente)
- GET /api/applications/status (publico)
- GET /api/audit-log (admin)

### Auditoria (RF10)

- Log inmutable con acciones: EXPEDIENTE_CREADO, SCORING_CALCULADO, EXPEDIENTE_ABIERTO, DICTAMEN_EMITIDO, LOGIN_EXITOSO/FALLIDO, CONSULTA_ESTADO.
- Requisito WORM: prohibir UPDATE/DELETE en audit_log via triggers y permisos de BD.

## Estado actual (base del proyecto)

En esta fase solo se prepara la estructura, configuracion e infraestructura local. No hay codigo funcional de frontend o backend todavia.

## Estructura del repositorio

```
.
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── tsconfig.json
├── infra/
│   ├── docker-compose.yml
│   └── initdb/
├── docs/
├── scripts/
├── .env.example
├── .editorconfig
├── .eslintrc.json
├── .gitignore
├── .nvmrc
└── .prettierrc.json
```

## Requisitos locales

- Node.js 20 (ver .nvmrc)
- Docker y Docker Compose

## Entorno local (solo infraestructura)

1. Copiar variables de entorno base:
	- `.env.example` -> `.env`
	- `backend/.env.example` -> `backend/.env`
2. Levantar Postgres con Docker Compose:
	- `docker compose --env-file .env -f infra/docker-compose.yml up -d`

## Documentación

- `docs/prd-base.md` contiene el PRD de la base e infraestructura.

---

