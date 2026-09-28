import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { matchService } from './services/match.service';
import { PlayerTicket } from './types/match.types';
import logger from './utils/logger';

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
            origin: '*', // Allow all origins for seamless cross-network P2P testing
            methods: ['GET', 'POST'],
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        logger.info(`[Socket Connected] ID: ${socket.id}`);
        connectedUsers += 1;
        io.emit('users:count', { count: connectedUsers });
        broadcastTelemetry();

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

                    // Native Socket.IO v4 room join across all adapters
                    io.in([ticket.socketId, matchedPeer.socketId]).socketsJoin(match.roomId);

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

                    logger.info(`[Match Dispatched] Room: ${match.roomId} between ${ticket.socketId} and ${matchedPeer.socketId}`);
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