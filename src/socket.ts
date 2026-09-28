import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { matchService } from './services/match.service';
import { PlayerTicket } from './types/match.types';
import logger from './utils/logger';
import { getLocalIp } from './utils/system';

let io: IOServer;
let connectedUsers: number = 0;

export const broadcastTelemetry = () => {
    if (!io) return;
    io.emit('telemetry-update', {
        onlinePlayers: connectedUsers,
        inQueueCount: matchService.getQueueLength(),
        timestamp: Date.now(),
    });
};

export const initSocket = (server: http.Server): IOServer => {
    io = new IOServer(server, {
        cors: {
            origin: [
                `http://${getLocalIp()}:8081`,
                'http://localhost:8081',
                'http://localhost:5173',
                'https://party-finder-nine.vercel.app',
                'https://www.val5th-finder.com',
            ],
            credentials: true,
            methods: ['GET', 'POST'],
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        logger.info(`New client connected: ${socket.id}`);
        connectedUsers += 1;
        io.emit('users:count', { count: connectedUsers });
        broadcastTelemetry();

        const userId = socket.handshake.query?.userId as string | undefined;
        const region = socket.handshake.query?.region as string | undefined;

        if (userId) {
            socket.join(`user:${userId}`);
            if (region) socket.join(`region:${region}`);
            socket.emit('connection:established', { userId, socketId: socket.id, message: 'Connected successfully' });
        } else {
            socket.emit('connection:established', { socketId: socket.id, message: 'Connected, but no user ID provided' });
        }

        // Matchmaking Handlers
        socket.on('start-search', async (data: Omit<PlayerTicket, 'socketId'>) => {
            try {
                const ticket: PlayerTicket = {
                    socketId: socket.id,
                    username: data.username.trim(),
                    region: data.region,
                    server: data.server,
                    rank: data.rank,
                    minRank: data.minRank,
                    maxRank: data.maxRank,
                    currentGroupSize: Number(data.currentGroupSize),
                };

                const result = await matchService.findMatch(ticket);

                if (result) {
                    const { match, matchedPeer } = result;

                    socket.join(match.roomId);
                    const peerSocket = io.sockets.sockets.get(matchedPeer.socketId);
                    if (peerSocket) peerSocket.join(match.roomId);

                    io.to(ticket.socketId).emit('match-found', {
                        roomId: match.roomId,
                        isInitiator: true,
                        peerSocketId: matchedPeer.socketId,
                        participants: match.participants,
                    });

                    io.to(matchedPeer.socketId).emit('match-found', {
                        roomId: match.roomId,
                        isInitiator: false,
                        peerSocketId: ticket.socketId,
                        participants: match.participants,
                    });
                } else {
                    socket.emit('queue-status', { status: 'searching' });
                }

                broadcastTelemetry();
            } catch (err) {
                logger.error(`Error during matchmaking on socket ${socket.id}:`, err);
                socket.emit('error-msg', { message: 'Matchmaking process encountered an internal error.' });
            }
        });

        socket.on('cancel-search', () => {
            matchService.removeSocketFromQueue(socket.id);
            socket.emit('queue-status', { status: 'idle' });
            broadcastTelemetry();
        });

        // WebRTC P2P Signaling Relays
        socket.on('webrtc-offer', ({ targetSocketId, offer }: { targetSocketId: string; offer: RTCSessionDescriptionInit }) => {
            io.to(targetSocketId).emit('webrtc-offer', { senderSocketId: socket.id, offer });
        });

        socket.on('webrtc-answer', ({ targetSocketId, answer }: { targetSocketId: string; answer: RTCSessionDescriptionInit }) => {
            io.to(targetSocketId).emit('webrtc-answer', { senderSocketId: socket.id, answer });
        });

        socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }: { targetSocketId: string; candidate: RTCIceCandidateInit }) => {
            io.to(targetSocketId).emit('webrtc-ice-candidate', { candidate });
        });

        socket.on('leave-room', ({ roomId }: { roomId: string }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('peer-left');
        });

        socket.on('disconnect', (reason: string) => {
            connectedUsers = Math.max(0, connectedUsers - 1);
            matchService.removeSocketFromQueue(socket.id);
            io.emit('users:count', { count: connectedUsers });
            broadcastTelemetry();
            logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });
    });

    return io;
};

export const getIO = (): IOServer => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};