
import { Types } from 'mongoose';
import { ReturnResponseType } from 'src/types/base.type';

import { LobbyModel } from 'src/models/inventory.model';
import { CreateLobbyInput, LobbyType, UpdateLobbyInput } from 'src/types/inventory.type';
import { AppError } from 'src/utils/errors';

export class InventoryRepository {
    public async getLobbies(userId: string): Promise<LobbyType[]> {

        const lobby = await LobbyModel.find({
            status: {
                $in: ["open", "full", "in progress"]
            }
        });

        if (!lobby) throw new AppError('Lobby not found!', 404, 'Lobby Repository');

        return lobby.map(l => l.toJSON());
    }

    public async getLobbyMe(userId: string): Promise<LobbyType> {

        const lobby = await LobbyModel.findById(userId);

        if (!lobby) throw new AppError('Lobby not found!', 404, 'Lobby Repository');

        return lobby.toJSON();
    }

    public async createLobby(
        lobby: CreateLobbyInput
    ): Promise<LobbyType> {
        const result = await LobbyModel.create(lobby);

        return result.toJSON();
    }

    public async updateLobby(input: UpdateLobbyInput): Promise<ReturnResponseType> {
        try {
            const { id, ...updatableFields } = input;

            const lobby = await LobbyModel.updateOne(
                { _id: new Types.ObjectId(id) },
                {
                    $set: {
                        ...updatableFields,
                        updatedAt: new Date(),
                    },
                }
            );

            if (!lobby.modifiedCount) {
                throw new AppError('Failed to update lobby', 404, 'Lobby Repository');
            }

            return { message: 'Profile updated successfully', status: true };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError('Failed to update lobby!', 500, 'Lobby Repository');
        }
    }

    public async getLobbyByEmail(
        email: string,
    ): Promise<LobbyType | null> {

        const lobby = await LobbyModel.findOne({ email });
        if (!lobby) return null;

        const { ...lobbyWithoutPassword } = lobby;
        return lobbyWithoutPassword;
    }

    public async getLobbyById(id: string): Promise<LobbyType | null> {

        const lobby = await LobbyModel.findById(id);
        if (!lobby) return null;

        const { ...lobbyWithoutPassword } = lobby;
        return lobbyWithoutPassword;
    }
}
