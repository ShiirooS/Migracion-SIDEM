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

app.use(compression());
app.use(cors());
app.use(express.json());

const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intente de nuevo en 15 minutos' },
});

const publicLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de solicitudes alcanzado, intente mas tarde' },
});

app.use('/api/auth/login', strictLimit);
app.use('/api/applications/status', strictLimit);
app.post('/api/applications', publicLimit);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agentes', agentesRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SIDEM-PAN backend' });
});

startCronJobs();

app.listen(PORT, () => {
  console.log(`SIDEM-PAN backend running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api/docs`);
});

export default app;
