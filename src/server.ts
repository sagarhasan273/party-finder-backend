import cors from 'cors';
import * as dotenv from 'dotenv';
import express, { Express } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import os from 'os';
import { rootRouter } from './routes/root.router';
import { initSocket } from './socket';

dotenv.config();

const app: Express = express();
const server: http.Server = http.createServer(app);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Fixed: changed from './' to '/'
app.use('/', rootRouter);

// Function to get the local network IPv4 address
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        // Look for external (non-loopback) IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

// Endpoint to view server IP and request IP
app.get('/health', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    serverLocalIP: getLocalIP(),
    clientIP,
  });
});

initSocket(server);

const PORT: number = parseInt(process.env.PORT || '5000', 10);
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DB_URL ||
  'mongodb://127.0.0.1:27017/valorant_lfg';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIP();
      console.log('----------------------------------------------------');
      console.log(`[SERVER ONLINE]`);
      console.log(`Local Access:   http://localhost:${PORT}`);
      console.log(`LAN Network:    http://${localIP}:${PORT}`);
      console.log('----------------------------------------------------');
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });