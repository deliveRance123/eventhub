import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback
const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// API Routes
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'event-management-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Serve the frontend client directly
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const defaultPort = Number(process.env.PORT || 5000);

if (!process.env.VERCEL) {
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`Event Management Full-Stack App running on http://localhost:${port}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, trying port ${port === 5000 ? 3000 : port + 1}...`);
        startServer(port === 5000 ? 3000 : port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };
  startServer(defaultPort);
}

export default app;
