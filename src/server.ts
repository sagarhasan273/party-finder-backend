import cors from 'cors';
import express from 'express';
import http from 'http';
import { closeDatabaseConnection } from 'src/database';
import { databaseMiddleware } from 'src/middlewares/database.middleware';
import { UserRoutes } from 'src/routes/user-routes';
import logger from 'src/utils/logger';
import { initSocket } from './socket';
import { getLocalIp } from './utils/system';

const app = express();
const io = http.createServer(app);

app.use(
  cors({
    origin: [`http://${getLocalIp()}:5173`, 'http://localhost:5173',],
    credentials: true,
  })
);

app.use(express.json());
app.use(databaseMiddleware); // Use the database middleware for all routes

const userRouters = new UserRoutes().router;
app.use('/', userRouters); // Use the user router for user-related routes

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
