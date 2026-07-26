import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { connectToDatabase } from './database';
import { setupKeepAlive } from './keep-alive';
import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';
import logger from './utils/logger';
import { getLocalIp } from './utils/system';

const app: Express = express();
const server: http.Server = http.createServer(app);

app.use(cors({
  origin: [
    `http://${getLocalIp()}:8081`,
    'http://localhost:8081',
    'https://party-finder-nine.vercel.app',
    'https://www.val5th-finder.com'
  ],
  credentials: true,
}));

app.use(express.json());
app.use('/', rootRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
  });
});

app.get('/ping', (req: Request, res: Response) => {
  res.status(200).send('pong');
});

// socket
initSocket(server);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

async function start(): Promise<void> {
  try {
    await connectToDatabase();

    server.listen(PORT, () => {
      logger.info(`Server running on http://${getLocalIp()}:${PORT}`);

      // Start keep-alive in production
      setupKeepAlive(server, {
        interval: 600000, // 10 minutes
        activityInterval: 300000, // 5 minutes
      });
      logger.info('🟢 Keep-alive system activated');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

start();