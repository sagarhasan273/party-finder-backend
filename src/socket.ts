import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { matchService } from './services/match.service';
import { PlayerTicket } from './types/match.types';

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
            origin: '*',
            methods: ['GET', 'POST'],
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        connectedUsers += 1;
        io.emit('users:count', { count: connectedUsers });
        broadcastTelemetry();

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

                    // Join both sockets into the dedicated room
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
                } else {
                    socket.emit('queue-status', { status: 'searching' });
                }

                broadcastTelemetry();
            } catch (err) {
                socket.emit('error-msg', { message: 'Matchmaking process encountered an internal error.' });
            }
        });

        socket.on('cancel-search', () => {
            matchService.removeSocketFromQueue(socket.id);
            socket.emit('queue-status', { status: 'idle' });
            broadcastTelemetry();
        });

        // Room-based Chat Relay (Fallback & Primary reliable channel)
        socket.on('send-room-chat', ({ roomId, message, sender, timestamp }) => {
            socket.to(roomId).emit('room-chat', { sender, message, timestamp });
        });

        // Room-based Party Code Broadcast
        socket.on('send-party-code', async ({ roomId, partyCode }: { roomId: string; partyCode: string }) => {
            await matchService.setPartyCode(roomId, partyCode);
            socket.to(roomId).emit('party-code-updated', { partyCode });
        });

        // P2P WebRTC Signaling Relays
        socket.on(
            'webrtc-offer',
            ({ targetSocketId, offer }: { targetSocketId: string; offer: RTCSessionDescriptionInit }) => {
                io.to(targetSocketId).emit('webrtc-offer', { senderSocketId: socket.id, offer });
            }
        );

        socket.on(
            'webrtc-answer',
            ({ targetSocketId, answer }: { targetSocketId: string; answer: RTCSessionDescriptionInit }) => {
                io.to(targetSocketId).emit('webrtc-answer', { senderSocketId: socket.id, answer });
            }
        );

        socket.on(
            'webrtc-ice-candidate',
            ({ targetSocketId, candidate }: { targetSocketId: string; candidate: RTCIceCandidateInit }) => {
                io.to(targetSocketId).emit('webrtc-ice-candidate', { senderSocketId: socket.id, candidate });
            }
        );

        socket.on('leave-room', ({ roomId }: { roomId: string }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('peer-left');
            // Note: If you store active matches in memory inside matchService, call a cleanup function here.
            // e.g., matchService.removeMatchData(roomId);
        });

        // Detect tab closures / network disconnects BEFORE the socket leaves its rooms
        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                // socket.rooms contains the socket's own ID, so we skip it to find the actual match room
                if (room !== socket.id) {
                    socket.to(room).emit('peer-left');
                    // Note: If you store active matches in memory inside matchService, call a cleanup function here too.
                }
            }
        });

        socket.on('disconnect', () => {
            connectedUsers = Math.max(0, connectedUsers - 1);
            matchService.removeSocketFromQueue(socket.id);
            io.emit('users:count', { count: connectedUsers });
            broadcastTelemetry();
        });
    });

    return io;
};

export const getIO = (): IOServer => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};