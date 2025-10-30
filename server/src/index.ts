import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/schema.js';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';
import tagsRoutes from './routes/tags.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialize database
initializeDatabase();

// Middleware
if (isDevelopment) {
  // In development, allow CORS from Vite dev server
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
} else {
  // In production, serve static files
  app.use(express.static(path.join(__dirname, '../../dist')));
}

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// In production, serve index.html for all non-API routes (SPA fallback)
if (!isDevelopment) {
  app.use((req, res, next) => {
    // If the request is for an API route, skip to next handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Otherwise, serve the index.html for SPA routing
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!isDevelopment) {
    console.log(`Serving frontend from http://localhost:${PORT}`);
  }
});
