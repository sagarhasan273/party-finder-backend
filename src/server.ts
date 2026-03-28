import cors from 'cors';
import express from 'express';
import http from 'http';
import { closeDatabaseConnection } from 'src/database';
import { databaseMiddleware } from 'src/middlewares/database.middleware';
import logger from 'src/utils/logger';
import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';
import { getLocalIp } from './utils/system';

const app = express();
const io = http.createServer(app);

app.use(
  cors({
    origin: [`http://${getLocalIp()}:8081`, 'http://localhost:8081',],
    credentials: true,
  })
);

app.use(express.json());
app.use(databaseMiddleware); // Use the database middleware for all routes

app.use('/', rootRouter);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port http://${getLocalIp()}:${PORT}`);
});

// socket initialize
initSocket(io);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeDatabaseConnection(); // Close the database connection
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
