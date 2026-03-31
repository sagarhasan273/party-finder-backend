import cors from 'cors';
import express from 'express';
import http from 'http';
import logger from 'src/utils/logger';
import { connectToDatabase } from './database';
import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';
import { getLocalIp } from './utils/system';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [`http://${getLocalIp()}:8081`, 'http://localhost:8081'],
  credentials: true,
}));

app.use(express.json());
app.use('/', rootRouter);

// socket
initSocket(server);

const PORT = process.env.PORT || 3000;

async function start() {
  await connectToDatabase();

  server.listen(PORT, () => {
    logger.info(`Server running on http://${getLocalIp()}:${PORT}`);
  });
}

start();
