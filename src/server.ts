import cors from 'cors';
import * as dotenv from 'dotenv';
import express, { Express } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';

dotenv.config();

const app: Express = express();
const server: http.Server = http.createServer(app);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use('./', rootRouter);


app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

initSocket(server);

const PORT: number = parseInt(process.env.PORT || '5000', 10);
const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL || 'mongodb://127.0.0.1:27017/valorant_lfg';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // Explicit 0.0.0.0 host binding for Render & cloud deployment
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });