import cors from 'cors';
import express from 'express';
import http from 'http';
import { connectToDatabase } from './database';
import logger from './utils/logger';

import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';
import { getLocalIp } from './utils/system';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [`http://${getLocalIp()}:8081`, 'http://localhost:8081', 'https://party-finder-nine.vercel.app', 'https://www.val5th-finder.com'],
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
