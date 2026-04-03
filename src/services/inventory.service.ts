import { config } from 'src/config';
import { InventoryRepository } from 'src/repositories/inventory.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { broadcastToRegion, emitToUser } from 'src/socket';
import { ReturnResponseType } from 'src/types/base.type';
import { CreateLobbyInput, LobbyStatus, LobbyType, UpdateLobbyInput } from 'src/types/inventory.type';
import { AppError } from 'src/utils/errors';
import logger from 'src/utils/logger';
import { TimeoutManager } from 'src/utils/timeout-manager';
import { JwtService } from './auth-service/jwt.service';

export class InventoryService {
    private timeOut = new TimeoutManager();
    private userRepository = new UserRepository();
    private inventoryRepository = new InventoryRepository();

    public async getLobbies(
        token: string,
    ): Promise<LobbyType[] | null> {
        try {
            const decodedToken = JwtService.decodeToken(token);
            if (!decodedToken) throw new Error('Invalid token');

            const userId = decodedToken.id;
            if (!userId) throw new AppError('User ID not found in token', 400, 'User Service');

            const user = await this.inventoryRepository.getLobbies(userId);

            return user;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to get lobbies', 500, 'Inventory Service');
        }
    }
    public async getLobbyMe(
        token: string,
    ): Promise<LobbyType | null> {
        try {
            const decodedToken = JwtService.decodeToken(token);
            if (!decodedToken) throw new Error('Invalid token');

            const userId = decodedToken.id;
            if (!userId) throw new AppError('User ID not found in token', 400, 'User Service');

            const user = await this.inventoryRepository.getLobbyMe(userId);

            return user;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to get lobby by ID', 500, 'Inventory Service');
        }
    }

    public async getJoinRequestedLobbies(
        token: string,
    ): Promise<LobbyType[] | null> {
        try {
            const decodedToken = JwtService.decodeToken(token);
            if (!decodedToken) throw new Error('Invalid token');

            const userId = decodedToken.id;
            if (!userId) throw new AppError('User ID not found in token', 400, 'User Service');

            const lobbies = await this.inventoryRepository.getJoinRequestedLobbies(userId);

            return lobbies;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to get join requested lobbies', 500, 'Inventory Service');
        }
    }

    public async createLobby(
        lobby: CreateLobbyInput
    ): Promise<LobbyType> {
        try {
            const result = await this.inventoryRepository.createLobby(lobby);

            broadcastToRegion(result.region.toString(), 'receive-new-lobby', { lobby: result, message: "New Lobby Created!" })

            return result;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to create lobby!', 500, 'Inventory Service');
        }
    }

    public async updateLobby(input: UpdateLobbyInput): Promise<ReturnResponseType> {
        try {
            if (!input.id) throw new AppError('User ID is required', 400, 'User Repository');

            const result = await this.inventoryRepository.updateLobby(input);

            return result
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to update lobby!', 500, 'Inventory Service');
        }
    }

    public async getLobbyById(id: string): Promise<LobbyType | null> {
        try {
            return await this.inventoryRepository.getLobbyById(id);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to get lobby by ID', 500, 'Inventory Service');
        }
    }

    public async deleteLobby(lobbyId: string, hostId: string): Promise<ReturnResponseType> {
        try {
            const result = await this.inventoryRepository.deleteLobby(lobbyId, hostId);

            broadcastToRegion(result.region.toString(), 'receive-deleted-lobby', { lobbyId, hostId, message: "A lobby you requested for is deleted." });

            return {
                message: "Lobby deleted successfully",
                status: true,
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to delete lobby', 500, 'Inventory Service');
        }
    }

    public async requestToJoinLobby(lobbyId: string, applicantId: string): Promise<LobbyType> {
        try {
            const lobby = await this.inventoryRepository.requestToJoinLobby(lobbyId, applicantId);

            const applicant = await this.userRepository.getApplicant(applicantId);

            emitToUser((lobby.host as any)?.id.toString(), 'receive-join-request', {
                lobbyId,
                applicantId,
                applicant: {
                    user: applicant,
                    status: 'pending',
                },
                message: "You have a join request."
            });

            emitToUser(applicantId, 'receive-join-request', {
                lobbyId,
                applicantId,
                applicant: {
                    user: applicantId,
                    status: 'pending',
                },
                message: "Request sent."
            });

            if (lobby.status === 'closed') {
                broadcastToRegion(lobby.region.toString(), 'receive-lobby-status', {
                    lobbyId: lobby.id,
                    status: 'closed',
                    sentTo: 'broadcast'
                })
            }

            return lobby
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to request to join lobby', 500, 'Inventory Service');
        }
    }

    public async acceptJoinRequest(lobbyId: string, applicantId: string): Promise<LobbyType> {
        try {
            const result = await this.inventoryRepository.acceptJoinRequest(lobbyId, applicantId);

            this.timeOut.schedule(`${lobbyId}:${applicantId}`, async () => {
                try {
                    await this.suspendApplicantJoining(lobbyId, applicantId);
                } catch {
                    logger.error('Failed to suspend by timeout!')
                }
            }, config.applicantSuspendedTime);

            emitToUser(applicantId, 'receive-request-accept', {
                lobbyId,
                lobby: result,
                message: 'You are accepted for the lobby.'
            });

            return result
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to accept join request', 500, 'Inventory Service');
        }
    }

    public async rejectJoinRequest(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            const lobby = await this.inventoryRepository.rejectJoinRequest(lobbyId, applicantId);

            emitToUser(applicantId, 'receive-request-reject', {
                lobbyId,
                lobbyTitle: lobby?.title,
                message: "You are rejected by host."
            });

            return { message: "Request rejected successfully", status: true }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to reject join request', 500, 'Inventory Service');
        }
    }

    public async suspendApplicantJoining(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            const result = await this.inventoryRepository.suspendApplicantJoining(lobbyId, applicantId);

            emitToUser(applicantId, 'receive-suspended-applicant', {
                lobbyId,
                applicantId,
                message: "You are suspended."
            });

            emitToUser(result.host.toString(), 'receive-suspended-applicant', {
                lobbyId,
                applicantId,
                message: "Applicant has suspended."
            });

            this.timeOut.cancel(`${lobbyId}:${applicantId}`);

            return {
                message: "Join request supanded.",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to cancel join request', 500, 'Inventory Service');
        }
    }

    public async applicantJoining(lobbyId: string, applicantId: string, message?: string): Promise<ReturnResponseType> {
        try {
            const result = await this.inventoryRepository.applicantJoining(lobbyId, applicantId);

            emitToUser(result.host.toString(), 'receive-joining-applicant', {
                lobbyId,
                applicantId,
                applicantMessage: message,
                message: "Applicant has responded to join."
            });

            this.timeOut.cancel(`${lobbyId}:${applicantId}`);

            return {
                message: "Applicant is ready to join.",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to cancel join request', 500, 'Inventory Service');
        }
    }

    public async cancelJoinRequest(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.cancelJoinRequest(lobbyId, applicantId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to cancel join request', 500, 'Inventory Service');
        }
    }

    public async removeJoinRequest(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.removeJoinRequest(lobbyId, applicantId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to remove join request', 500, 'Inventory Service');
        }
    }

    public async lobbyStatus(lobbyId: string, userId: string): Promise<LobbyStatus> {
        try {
            const result = await this.inventoryRepository.lobbyStatus(lobbyId, userId);

            emitToUser(userId, 'receive-lobby-status', { sentTo: 'host', lobbyId, status: result.status, message: result.status === "open" ? "Lobby closed." : "Lobby reopened!" })

            result.applicants?.forEach(applicant => {
                emitToUser(applicant.user.toString(), 'receive-lobby-status', { sentTo: 'applicant', lobbyId, status: result.status, message: result.status === "open" ? "Lobby closed." : "Lobby reopened!" })
            })
            return result.status;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to change lobby status', 500, 'Inventory Service');
        }
    }
}
