import { InventoryRepository } from 'src/repositories/inventory.repository';
import { broadcastToRegion, emitToUser } from 'src/socket';
import { ReturnResponseType } from 'src/types/base.type';
import { CreateLobbyInput, LobbyStatus, LobbyType, UpdateLobbyInput } from 'src/types/inventory.type';
import { AppError } from 'src/utils/errors';
import { JwtService } from './auth-service/jwt.service';

export class InventoryService {
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

    public async deleteLobby(lobbyId: string, userId: string, applicantIds: string[]): Promise<ReturnResponseType> {
        try {
            const result = await this.inventoryRepository.deleteLobby(lobbyId, userId);

            applicantIds.forEach(applicantId => emitToUser(applicantId, 'receive-deleted-lobby', { lobbyId }))

            return result
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to delete lobby', 500, 'Inventory Service');
        }
    }

    public async requestToJoinLobby(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            const lobby = await this.inventoryRepository.requestToJoinLobby(lobbyId, applicantId);

            emitToUser(lobby.userId, 'receive-join-request', {
                applicantId,
                message: "You have a join request."
            });

            emitToUser(applicantId, 'receive-join-request', {
                applicantId,
                message: "Request sent."
            });

            return {
                message: "Request sent successfully",
                status: true,
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to request to join lobby', 500, 'Inventory Service');
        }
    }

    public async acceptJoinRequest(lobbyId: string, applicantId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.acceptJoinRequest(lobbyId, applicantId);
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

    public async cancelJoinRequest(lobbyId: string, userId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.cancelJoinRequest(lobbyId, userId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to cancel join request', 500, 'Inventory Service');
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
