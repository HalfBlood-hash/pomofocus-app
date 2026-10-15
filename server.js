import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Render and external pingers (UptimeRobot, cron-job.org)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    app: 'Pomofocus Pro',
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve Vite compiled static production build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for Single Page Application routing (Express 5 syntax)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Self-ping keeping-alive mechanism every 10 minutes to prevent Render free instance spin-down
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (RENDER_EXTERNAL_URL) {
  console.log(`Self-ping keep-alive activated targeting: ${RENDER_EXTERNAL_URL}/health`);
  setInterval(() => {
    fetch(`${RENDER_EXTERNAL_URL}/health`)
      .then((res) => console.log(`[Keep-Alive] Pinged ${RENDER_EXTERNAL_URL}/health - Status: ${res.status}`))
      .catch((err) => console.warn('[Keep-Alive] Ping warning:', err.message));
  }, PING_INTERVAL_MS);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
