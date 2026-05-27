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

## Requisitos Técnicos (RNF)

| Requisito | Meta | Implementación |
|-----------|------|-----------------|
| **RNF01: Seguridad** | 2FA, AES-256, TLS 1.3 | Passport.js + speakeasy + bcrypt |
| **RNF02: Rendimiento** | P95 < 3 segundos | Caching, índices BD, CDN |
| **RNF03: Disponibilidad** | 99.9% SLA | Health checks, monitoreo, alertas |
| **RNF04: Accesibilidad** | WCAG 2.1 AA | Shadcn/ui + Radix, testing con axe-core |
| **RNF05: Mantenibilidad** | TypeScript strict + ESLint + SonarQube | CI/CD con linting automático |
| **RNF06: Auditoría** | WORM logs inmutables | PostgreSQL triggers + LogAuditoriaRepository |

---

## Stack Tecnológico

### Frontend
```
React 18 + TypeScript (strict)
├── Build: Vite
├── Estilos: Tailwind CSS + Shadcn/ui (WCAG 2.1)
├── Estado: Zustand (cliente) + TanStack Query (servidor)
├── Validación: React Hook Form + Zod
├── Gráficos: Recharts
└── Accesibilidad: axe-core, Lighthouse
```

### Backend
```
NestJS + TypeScript (strict)
├── ORM: Prisma
├── Validación: Zod + class-validator
├── Auth: Passport.js + JWT + speakeasy (2FA)
├── PDF: pdfkit
├── Email: Nodemailer/SendGrid
└── HTTP Client: Axios (con retry)
```

### Base de Datos
```
PostgreSQL (primaria)
├── Prisma (ORM)
├── Redis (sesiones, cache)
└── WORM logs (triggers que rechazan UPDATE/DELETE)
```

### Infraestructura
```
Docker + Docker Compose
├── Nginx (TLS 1.3, reverse proxy)
├── PM2 (process management)
├── Winston (structured logging)
└── Prometheus + Grafana (monitoreo SLA 99.9%)
```

### QA
```
ESLint + Prettier (linting)
TypeScript strict (type safety)
SonarQube (análisis estático)
Jest + Supertest (testing)
Husky + lint-staged (pre-commit)
```

---

## Guía de Instalación

### Prerequisitos
- Node.js v18+
- Docker + Docker Compose
- PostgreSQL 14+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/ShiirooS/Migracion-SIDEM.git
cd Migracion-SIDEM
```

### 2. Setup monorepo (pnpm)
```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

# Instalar dependencias de todos los workspaces
pnpm install
```

### 3. Variables de entorno

**Backend (.env)**
```bash
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/sidem_pan"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="24h"

# 2FA
TOTP_SECRET="your-totp-secret"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-key"

# INTERPOL (mock en dev)
INTERPOL_API_URL="https://interpol-api.gov.pa"
INTERPOL_API_KEY="your-key"

# Logging
LOG_LEVEL="info"
```

**Frontend (.env)**
```bash
VITE_API_URL="http://localhost:3001"
VITE_ENVIRONMENT="development"
```

### 4. Base de datos
```bash
# Crear BD
docker-compose up -d postgres redis

# Ejecutar migraciones Prisma
pnpm --filter=@sidem-pan/api db:migrate
pnpm --filter=@sidem-pan/api db:seed
```

### 5. Correr en desarrollo
```bash
# Terminal 1: Backend (NestJS)
pnpm --filter=@sidem-pan/api dev

# Terminal 2: Frontend (React + Vite)
pnpm --filter=@sidem-pan/web dev

# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

---

## Estructura del Proyecto

```
sidem-pan/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/           # Autenticación, JWT, 2FA
│   │   │   ├── evaluaciones/   # RF01-RF03: evaluaciones migratorias
│   │   │   ├── scoring/        # RF04, RF12: motor de riesgo + INTERPOL
│   │   │   ├── dictamen/       # RF06: registrar decisiones
│   │   │   ├── subsanacion/    # RF07: solicitud de correcciones
│   │   │   ├── notificaciones/ # RF08: email
│   │   │   ├── listas/         # RF09: control (CSV/XML)
│   │   │   ├── agentes/        # RF11: asignación equitativa
│   │   │   ├── dashboard/      # RF05: admin dashboard
│   │   │   ├── auditoria/      # RF10, RNF06: logs WORM
│   │   │   └── common/         # Guards, Interceptors, Pipes
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── test/
│   │
│   └── web/                     # Frontend React
│       ├── src/
│       │   ├── components/
│       │   │   ├── Auth/        # Login, 2FA
│       │   │   ├── Dashboard/   # Panel administrativo
│       │   │   ├── Evaluacion/  # Registro y validación
│       │   │   └── Common/      # Layouts, Headers, Accesibilidad
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── store/           # Zustand
│       │   ├── queries/         # TanStack Query
│       │   ├── types/           # Tipos compartidos (Zod)
│       │   └── styles/
│       └── test/
│
├── packages/
│   └── shared/                  # Tipos Zod compartidos
│       ├── types.ts
│       └── validators.ts
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── turbo.json                   # Turborepo config
```

---

## Ejecución

### Desarrollo
```bash
# Correr todo (backend + frontend + BD)
docker-compose up
pnpm dev
```

### Testing
```bash
# Tests unitarios
pnpm test

# Tests e2e (backend)
pnpm --filter=@sidem-pan/api test:e2e

# Linting
pnpm lint

# Type-checking
pnpm type-check

# SonarQube (opcional)
pnpm analyze
```

### Construcción
```bash
# Build
pnpm build

# Build Docker
docker-compose -f docker-compose.prod.yml build
```

---

## Funcionalidades por Sprint

### Sprint 1: Fundamentos y Seguridad (2 semanas)
- Autenticación segura (JWT + 2FA con TOTP)
- Control de acceso basado en roles (RBAC)
- Registro de evaluaciones migratorias (RF01)
- Validación de documentos (RF02)
- Consulta de estado (RF03)
- Logs de auditoría básicos (RF10)
- UI accesible (WCAG 2.1)

**Tareas Jira**: SCRUM-9, SCRUM-26, SCRUM-27, SCRUM-28, SCRUM-30, SCRUM-31

### Sprint 2: Lógica de Negocio (3 semanas)
- Motor de scoring de riesgo (RF04)
- Dashboard administrativo (RF05)
- Registrar dictamen legal (RF06)
- Proceso de subsanación (RF07)
- Notificaciones por email (RF08)
- Gestión de listas de control (RF09)
- Asignación equitativa de casos (RF11)
- Consulta a INTERPOL (RF12)
- Optimización de rendimiento (RNF02)

**Tareas Jira**: SCRUM-6, SCRUM-17, SCRUM-29, SCRUM-18, SCRUM-19, SCRUM-20, SCRUM-7, SCRUM-8, SCRUM-21

### Sprint 3: Calidad y Validación (2.5 semanas)
- Arquitectura mejorada (MotorDeRiesgo, DictamenService)
- Logs WORM inmutables (RNF06)
- TypeScript + ESLint + SonarQube (RNF05)
- SLA 99.9% con monitoreo (RNF03)
- Matriz de trazabilidad RF/RNF
- Validación final de cobertura
- Documentación completa

**Tareas Jira**: SCRUM-11, SCRUM-12, SCRUM-13, SCRUM-10, SCRUM-23, SCRUM-22, SCRUM-24, SCRUM-14, SCRUM-15, SCRUM-16, SCRUM-25

---

## API REST

### Endpoints principales

**Autenticación**
```
POST   /auth/register          # Crear cuenta
POST   /auth/login             # Login con email/password
POST   /auth/2fa/verify        # Verificar código TOTP
POST   /auth/refresh           # Refresh JWT token
POST   /auth/logout            # Logout
```

**Evaluaciones**
```
POST   /evaluaciones           # Crear evaluación (RF01)
GET    /evaluaciones/{id}      # Obtener detalles
GET    /evaluaciones/{id}/estado  # Consultar estado (RF03)
PUT    /evaluaciones/{id}/documentos  # Validar docs (RF02)
```

**Scoring**
```
GET    /scoring/{id}           # Calcular riesgo (RF04)
POST   /interpol/check         # Consultar INTERPOL (RF12)
```

**Agentes**
```
GET    /agentes/mi-dashboard   # Dashboard admin (RF05)
POST   /dictamen               # Registrar decisión (RF06)
POST   /subsanacion/solicitar  # Solicitar corrección (RF07)
POST   /subsanacion/upload     # Cargar documento corregido (RF07)
```

**Listas**
```
POST   /listas/importar        # Importar CSV/XML (RF09)
GET    /listas/activas         # Obtener listas activas
```

**Auditoría**
```
GET    /auditoria/logs         # Obtener logs (RF10)
GET    /auditoria/export-pdf   # Exportar a PDF
```

### Documentación Swagger
```bash
# En desarrollo, visita:
http://localhost:3001/api/docs
```

---

## Seguridad

- **Autenticación**: JWT (HS256) + 2FA (TOTP)
- **Encriptación**: AES-256 en reposo, TLS 1.3 en transporte
- **Control de acceso**: RBAC (Role-Based Access Control)
- **Rate limiting**: Prevenir ataques de fuerza bruta
- **CORS**: Origen restringido en producción
- **Validación**: Zod en backend + validación de entrada en frontend
- **Logs**: WORM (Write-Once-Read-Many) con integridad verificable

---

## Performance

- P95 latencia: < 3 segundos (RNF02)
- Caching: Redis para sesiones y datos frecuentes
- Índices: BD optimizada para queries críticas
- CDN: Static assets servidos desde edge
- Monitoreo: Prometheus + Grafana en tiempo real

---

## Monitoreo y SLA

**Disponibilidad 99.9%** = máx 43.2 segundos downtime/mes

```bash
# Health check endpoint
GET /health

# Métricas Prometheus
GET /metrics

# Ver en Grafana
http://localhost:3000
```

---

## Testing

```bash
# Tests unitarios (Jest)
pnpm test

# Tests de cobertura
pnpm test:cov

# Tests e2e (Supertest)
pnpm test:e2e

# Accessibility testing (axe-core)
pnpm test:a11y

# Pruebas de carga (Locust)
locust -f tests/load_tests.py
```

---

## Documentación

- **[Especificación de Requisitos](./docs/REQUISITOS.md)** - RF01-RF12, RNF01-RNF06
- **[Arquitectura del Sistema](./docs/ARQUITECTURA.md)** - Diagrama de clases, módulos
- **[Guía de Desarrollo](./docs/DESARROLLO.md)** - Setup, convenciones de código
- **[Trazabilidad](./docs/TRAZABILIDAD.md)** - Matrix RF/RNF-UC-Criterios-Pruebas
- **[Guía de Deployment](./docs/DEPLOYMENT.md)** - Docker, CI/CD, producción
- **[Presentación Avances](./SIDEM-PAN_Daily_Meeting.pdf)** - Daily meeting (20 min, 4 speakers)

---

## Equipo

| Nombre | Rol | Responsabilidad |
|--------|-----|-----------------|
| Ana Aparicio | Analista | Contexto, métricas, requisitos |
| Bruno Ferreira | Arquitecto | Análisis de volatilidad, trazabilidad |
| Gerald Rios | Líder técnico | Sprints, implementación backend/INTERPOL |
| Eriel Ten Su | Diseñador | Arquitectura de clases, refactoring |

---

## Licencia

Proyecto académico - Universidad Tecnológica de Panamá
Asignatura: Ingeniería de Software Aplicada IV
Facilitadora: María Mosquera

---

## Recursos Útiles

- **Jira Board**: [teampaping.atlassian.net](https://teampaping.atlassian.net)
- **Especificación**: Document 1 (Avances Parcial 2 - Mayo 2026)
- **Decreto**: [Decreto Ley 3 de 2008](https://www.gacetaoficial.gob.pa/)
- **Presentación**: `SIDEM-PAN_Daily_Meeting.pdf` (en la raíz del repo)

---

## Contacto

Para preguntas sobre el proyecto:
- Email del equipo: gerald.rios@utp.ac.pa
- Jira: [SCRUM-5 Epic](https://teampaping.atlassian.net/browse/SCRUM-5)
