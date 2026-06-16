import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import auditRoutes from './routes/audit';
import metricsRoutes from './routes/metrics';
import agentesRoutes from './routes/agentes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agentes', agentesRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SIDEM-PAN backend' });
});

app.listen(PORT, () => {
  console.log(`SIDEM-PAN backend running on http://localhost:${PORT}`);
});

export default app;
