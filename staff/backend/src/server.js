import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, getPool } from './config/db.js';
import { seedInitialData } from './models/seed.js';
import apiRouter from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', apiRouter);

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = getPool();
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }
  res.json({ 
    status: 'healthy', 
    database: dbStatus, 
    uptime: Math.floor(process.uptime()),
    timestamp: new Date() 
  });
});

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('<div style="font-family: sans-serif; text-align: center; padding: 50px;"><h1>🚀 MR.X.Change API Backend is Online</h1><p>Health endpoint: <a href="/health">/health</a></p></div>');
  });
}

// Start Server & Initialize DB
async function startServer() {
  try {
    await initDatabase();
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`🚀 MR.X.Change Staff Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    // Start server even if MySQL needs manual user creation
    app.listen(PORT, () => {
      console.log(`⚠️ Server started on http://localhost:${PORT} (Database pending connection)`);
    });
  }
}

startServer();
