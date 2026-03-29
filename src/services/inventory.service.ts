import { InventoryRepository } from 'src/repositories/inventory.repository';
import { ReturnResponseType } from 'src/types/base.type';
import { CreateLobbyInput, LobbyType } from 'src/types/inventory.type';
import { UpdateUserInput } from 'src/types/user.type';
import { AppError, DatabaseError } from 'src/utils/errors';
import { JwtService } from './auth-service/jwt.service';

export class InventoryService {
    private inventoryRepository = new InventoryRepository();

    public async createLobby(
        lobby: CreateLobbyInput
    ): Promise<LobbyType> {
        try {
            return await this.inventoryRepository.createLobby(lobby);
        } catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key error')) {
                throw new DatabaseError(error as Error, 'User already exists');
            }
            throw new DatabaseError(error as Error, 'Failed to create user');
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

            throw new AppError('Failed to update user!', 500, 'User Service');
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
            if (error instanceof Error && error.message.includes('duplicate key error')) {
                throw new DatabaseError(error as Error, "User doesn't exist");
            }
            throw new DatabaseError(error as Error, 'Failed to get user by email');
        }
    }

    public async getLobbyById(id: string): Promise<LobbyType | null> {
        try {
            return await this.inventoryRepository.getLobbyById(id);
        } catch (error) {
            throw new DatabaseError(error as Error, 'Failed to get lobby by ID');
        }
    }
}
