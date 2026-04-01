import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import logger from './utils/logger';
import { getLocalIp } from './utils/system';

let io: IOServer;

export const initSocket = (server: http.Server) => {
    io = new IOServer(server, {
        cors: {
            origin: [`http://${getLocalIp()}:8081`, 'http://localhost:8081', 'http://localhost:5173'],
            credentials: true,
            methods: ["GET", "POST"]
        },
        // Add connection state recovery
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
            skipMiddlewares: true,
        },
        // Allow polling as fallback
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        logger.info(`New client connected: ${socket.id}`);
        const userId = socket.handshake.query?.userId;
        const region = socket.handshake.query?.region;

        // If user ID is available, join user room
        if (userId) {
            socket.join(`user:${userId}`);
            logger.info(`Socket ${socket.id} joined user room: user:${userId}`);

            // 🔥 CRITICAL: Join region room if region is provided
            if (region) {
                socket.join(`region:${region}`);
                logger.info(`Socket ${socket.id} joined region room: region:${region}`);
            }

            // Send confirmation back to client
            socket.emit('connection:established', {
                userId,
                socketId: socket.id,
                message: 'Connected successfully'
            });
        } else {
            logger.info(`Socket ${socket.id} connected without user ID`);
            socket.emit('connection:established', {
                socketId: socket.id,
                message: 'Connected, but no user ID provided'
            });
        }

        // Handle custom room joining from services
        socket.on('join-room', (roomName: string) => {
            socket.join(roomName);
            logger.info(`Socket ${socket.id} joined room: ${roomName}`);
        });

        socket.on('leave-room', (roomName: string) => {
            socket.leave(roomName);
            logger.info(`Socket ${socket.id} left room: ${roomName}`);
        });

        // Handle registration event (for clients that connect first then send user ID)
        socket.on("register", (data) => {
            if (socket.rooms.has(`user:${data?.userId}`)) return;

            logger.info(`Registration attempt from socket ${socket.id}: ${data?.userId}`);

            if (data.userId) {
                socket.data.userId = data.userId;
                socket.join(`user:${data.userId}`);

                logger.info(`User ${data.userId} registered and joined room user:${data.userId}`);

                // Confirm registration
                socket.emit("registered", {
                    userId: data.userId,
                    socketId: socket.id,
                    success: true
                });

                // Optional: Notify others that user is online
                // socket.broadcast.emit("user:online", { userId: data.userId });
            } else {
                socket.emit("registered", {
                    success: false,
                    error: "No userId provided"
                });
            }
        });


        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error(`Socket error for ${socket.id}:`, error);
        });
    });

    // Log when server starts
    io.engine.on("connection", (socket) => {
        logger.info(`Engine.io connection established: ${socket.id}`);
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

// Add these helper functions to your socket.ts file

export const joinUserRoom = (userId: string, roomName: string) => {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }

    io.to(`user:${userId}`).emit('join-room', roomName);

    logger.info(`Emitted join-room to user ${userId} for room: ${roomName}`);
};

export const leaveUserRoom = (userId: string, roomName: string) => {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }
    io.to(`user:${userId}`).emit('leave-room', roomName);

    logger.info(`Emitted leave-room to user ${userId} for room: ${roomName}`);
};

// Or a more generic function to emit any socket event to a user
export const emitToUserSocket = (userId: string, event: string, data: any) => {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (roomName: string, event: string, data: any) => {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }
    io.to(roomName).emit(event, data);
};

export const broadcastToRegion = (region: string, event: string, data: any) => {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }

    const roomName = `region:${region}`;

    io.to(roomName).emit(event, data);
    logger.info(`✅ Broadcasted to users in region ${region}`);
};



export const emitToUser = (userId: string, event: string, data: any) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
};

// Helper function to emit to all connected clients
export const emitToAll = (event: string, data: any) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }
    io.emit(event, data);
};