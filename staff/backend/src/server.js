import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './config/db.js';
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

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

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
