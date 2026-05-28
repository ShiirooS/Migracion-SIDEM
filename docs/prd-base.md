# PRD: Base e Infraestructura SIDEM-PAN (MVP)

## 1) Resumen
- Objetivo: establecer estructura del proyecto, entornos y configuraciones base para el MVP de SIDEM-PAN.
- Alcance: solo infraestructura y configuracion; sin implementar funcionalidades ni endpoints.

## 2) Contexto
- Proyecto MVP definido por el documento tecnico.
- Requiere monorepo con frontend y backend, ambiente local con PostgreSQL y estandares de configuracion.

## 3) Metas
- Estructura de carpetas lista para empezar desarrollo.
- Entorno local funcional con Postgres via Docker Compose.
- Configuracion base de TypeScript, lint/format y variables de entorno.
- Documentacion clara de como levantar la base del proyecto.

## 4) No metas (exclusiones)
- No desarrollo de componentes, endpoints o logica de negocio.
- No integracion con servicios externos (OpenSanctions, INTERPOL, etc.).
- No despliegue en cloud por ahora.

## 5) Alcance funcional
- Monorepo con frontend y backend.
- Configuracion base de tooling para ambos.
- Infra local con Docker Compose (Postgres).
- Archivos de entorno ejemplo y reglas de gitignore.
- README con pasos de arranque.

## 6) Requisitos
### 6.1 Requisitos funcionales
- Estructura base: carpetas para frontend, backend, infraestructura, docs y scripts.
- Backend: carpetas para rutas, servicios, middleware, migraciones y seeds (vacias).
- Frontend: carpetas para pages y components (vacias).
- Infra: docker-compose con Postgres y volumen persistente.
- Entornos: .env.example y guias de variables requeridas.
- Documentacion: instrucciones para levantar el entorno local.

### 6.2 Requisitos no funcionales
- Estandares de formato con ESLint/Prettier/EditorConfig.
- TypeScript configurado en modo estricto.
- Repositorio preparado para crecimiento sin reestructuracion mayor.

## 7) Entregables
- Estructura de carpetas completa.
- Configuracion base de tooling (TS, lint/format).
- Docker Compose para Postgres.
- Plantillas de .env.
- README con setup local.

## 8) Criterios de exito
- Se puede levantar Postgres localmente con un solo comando.
- La estructura coincide con la arquitectura definida en el documento tecnico.
- README deja claro el bootstrap local sin pasos ambiguos.

## 9) Riesgos y mitigaciones
- Ambiguedad de herramientas frontend: definir Vite como default.
- Falta de estandares compartidos: centralizar lint/format en la raiz.

## 10) Supuestos
- Desarrollo local en Linux/Windows/Mac con Docker.
- Monorepo como estructura principal.
- PostgreSQL es la base local standard.
