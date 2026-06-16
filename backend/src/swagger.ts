// SCRUM-53: OpenAPI 3.0 specification for SIDEM-PAN backend
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIDEM-PAN API',
      version: '3.0.0',
      description:
        'Sistema de Debida Diligencia Migratoria — Panamá. ' +
        'API REST para gestión de expedientes migratorios con scoring de riesgo.',
      contact: { name: 'Equipo SIDEM-PAN' },
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        NuevaSolicitud: {
          type: 'object',
          required: [
            'nombres',
            'apellidos',
            'fecha_nacimiento',
            'nacionalidad_codigo',
            'numero_pasaporte',
            'vencimiento_pasaporte',
            'categoria_migratoria',
            'monto_subsistencia',
          ],
          properties: {
            nombres: {
              type: 'string',
              pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]{2,150}$',
              example: 'Juan Carlos',
            },
            apellidos: {
              type: 'string',
              pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]{2,150}$',
              example: 'Rodríguez Pérez',
            },
            fecha_nacimiento: { type: 'string', format: 'date', example: '1985-03-22' },
            nacionalidad_codigo: { type: 'string', minLength: 2, maxLength: 3, example: 'COL' },
            numero_pasaporte: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]{6,20}$',
              example: 'AB123456',
            },
            vencimiento_pasaporte: { type: 'string', format: 'date', example: '2028-06-15' },
            categoria_migratoria: { type: 'string', example: 'TURISTA' },
            monto_subsistencia: { type: 'number', minimum: 0, example: 2500.0 },
            comprobante_solvencia: { type: 'string', format: 'binary' },
            antecedentes_penales: { type: 'string', format: 'binary' },
          },
        },
        SolicitudCreada: {
          type: 'object',
          properties: {
            ticket_number: { type: 'string', example: 'PAN-2026-04231' },
            estado: { type: 'string', enum: ['PENDIENTE', 'EN_EVALUACION', 'APROBADO', 'RECHAZADO'] },
            categoria_migratoria: { type: 'string', example: 'TURISTA' },
          },
        },
        ExpedienteResumen: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticket_number: { type: 'string' },
            nombres: { type: 'string' },
            apellidos: { type: 'string' },
            nacionalidad_codigo: { type: 'string' },
            categoria_migratoria: { type: 'string' },
            estado: { type: 'string' },
            nivel_riesgo: { type: 'string', enum: ['BAJO', 'MEDIO', 'ALTO'] },
            score_riesgo: { type: 'number' },
            interpol_alerta_encontrada: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedExpedientes: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/ExpedienteResumen' },
            },
            nextCursor: {
              type: 'string',
              nullable: true,
              description: 'ISO timestamp to pass as ?cursor= for the next page',
            },
          },
        },
        Dictamen: {
          type: 'object',
          required: ['decision', 'articulo_citado', 'justificacion'],
          properties: {
            decision: { type: 'string', enum: ['APROBADO', 'RECHAZADO'] },
            articulo_citado: { type: 'string', example: 'Art. 43 DL3/2008' },
            justificacion: {
              type: 'string',
              minLength: 20,
              example: 'Pasaporte vencido dentro de los próximos 6 meses.',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            rol: { type: 'string', enum: ['AGENTE', 'ADMIN'] },
            nombre: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            detalles: { type: 'object' },
          },
        },
      },
    },
  },
  // Scan all route files for @swagger JSDoc annotations
  apis: ['./src/routes/*.ts', './src/swagger.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
