import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { getLocalIp } from './utils/system';

let io: IOServer;

export const initSocket = (server: http.Server) => {
    io = new IOServer(server, {
        cors: {
            origin: [`http://${getLocalIp()}:8081`, 'http://localhost:8081'],
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('New client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};