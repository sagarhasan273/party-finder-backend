import { InventoryRepository } from 'src/repositories/inventory.repository';
import { ReturnResponseType } from 'src/types/base.type';
import { CreateLobbyInput, LobbyType } from 'src/types/inventory.type';
import { UpdateUserInput } from 'src/types/user.type';
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
            return await this.inventoryRepository.createLobby(lobby);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to create lobby!', 500, 'Inventory Service');
        }
    }

    public async updateLobby(input: UpdateUserInput): Promise<ReturnResponseType> {
        try {
            if (!input.id) throw new AppError('User ID is required', 400, 'User Repository');

            return await this.inventoryRepository.updateLobby(input);
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

    public async deleteLobby(lobbyId: string, userId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.deleteLobby(lobbyId, userId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to delete lobby', 500, 'Inventory Service');
        }
    }

    public async requestToJoinLobby(lobbyId: string, userId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.requestToJoinLobby(lobbyId, userId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to request to join lobby', 500, 'Inventory Service');
        }
    }

    public async acceptJoinRequest(lobbyId: string, userId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.acceptJoinRequest(lobbyId, userId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw error instanceof Error ? new AppError(error.message, 500, 'Inventory Service') : new AppError('Failed to accept join request', 500, 'Inventory Service');
        }
    }

    public async rejectJoinRequest(lobbyId: string, userId: string): Promise<ReturnResponseType> {
        try {
            return await this.inventoryRepository.rejectJoinRequest(lobbyId, userId);
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
}
