import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

// Servir PDFs subidos
const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? './uploads');
app.use('/uploads', express.static(uploadsDir));

// Rutas
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SIDEM-PAN backend' });
});

app.listen(PORT, () => {
  console.log(`SIDEM-PAN backend running on http://localhost:${PORT}`);
});

export default app;
