import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import auditRoutes from './routes/audit';
import metricsRoutes from './routes/metrics';
import agentesRoutes from './routes/agentes';
import { startCronJobs } from './jobs/update-control-lists';
import { swaggerSpec } from './swagger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// SCRUM-51: Security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// SCRUM-52: Gzip compression for all responses
app.use(compression());

app.use(cors());
app.use(express.json());

// SCRUM-51: Granular rate limiters
// Strict: 10 requests / 15 min — auth brute-force and passport-status enumeration
const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intente de nuevo en 15 minutos' },
});

// Public: 100 requests / 15 min — application submission
const publicLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de solicitudes alcanzado, intente más tarde' },
});

// Apply rate limits before route handlers
app.use('/api/auth/login', strictLimit);
app.use('/api/applications/status', strictLimit);
// publicLimit only on POST /api/applications (the multer route)
app.post('/api/applications', publicLimit);

// SCRUM-53: Swagger UI — no auth restriction in dev; in prod, put behind ADMIN middleware
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Raw spec endpoint (useful for client code generators)
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agentes', agentesRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SIDEM-PAN backend' });
});

// SCRUM-49: Start daily cron job for INTERPOL/OFAC list updates
startCronJobs();

app.listen(PORT, () => {
  console.log(`SIDEM-PAN backend running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api/docs`);
});

export default app;
