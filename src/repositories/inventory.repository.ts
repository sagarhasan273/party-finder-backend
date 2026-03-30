
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

        const lobby = await LobbyModel.findOne({ userId }).populate("applicants.user", "country rank gamename tagline mainRole playStyle");

        if (!lobby) throw new AppError('Lobby not found!', 404, 'Lobby Repository');

        return lobby.toJSON();
    }

    public async getJoinRequestedLobbies(userId: string): Promise<LobbyType[]> {

        const lobby = await LobbyModel.find({
            applicants: {
                $elemMatch: {
                    user: new Types.ObjectId(userId),
                    status: { $in: ["pending", "accepted", "rejected"] },
                },
            },
        }).populate("applicants.user", "country rank gamename tagline mainRole playStyle");

        return lobby.map(l => l.toJSON());
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

    public async deleteLobby(
        lobbyId: string,
        userId: string
    ): Promise<ReturnResponseType> {
        try {
            const result = await LobbyModel.deleteOne({
                _id: lobbyId,
                userId, // 🔒 ensure only owner can delete
            });

            if (!result.deletedCount) {
                throw new AppError(
                    "Lobby not found or you are not authorized",
                    404,
                    "Lobby Repository"
                );
            }

            return {
                message: "Lobby deleted successfully",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to delete lobby!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async requestToJoinLobby(
        lobbyId: string,
        userId: string
    ): Promise<ReturnResponseType> {
        try {
            const userObjectId = new Types.ObjectId(userId);

            // ✅ Check if user already in another lobby (host or accepted)
            const isUserBusy = await LobbyModel.exists({
                $or: [
                    { userId }, // host
                    {
                        applicants: {
                            $elemMatch: {
                                user: userObjectId,
                                status: "accepted",
                            },
                        },
                    },
                ],
            });

            if (isUserBusy) {
                throw new AppError(
                    "You are already in another lobby!",
                    400,
                    "Lobby Repository"
                );
            }

            // ✅ Atomic update (prevents duplicates)
            const updated = await LobbyModel.updateOne(
                {
                    _id: lobbyId,
                    applicants: {
                        $not: {
                            $elemMatch: {
                                user: userObjectId,
                            },
                        },
                    },
                },
                {
                    $push: {
                        applicants: {
                            user: userObjectId,
                            status: "pending",
                        },
                    },
                }
            );

            // ❗ If nothing updated → user already exists
            if (!updated.modifiedCount) {
                const lobby = await LobbyModel.findById(lobbyId).select("applicants");

                if (!lobby) {
                    throw new AppError("Lobby not found!", 404, "Lobby Repository");
                }

                const existing = lobby.applicants?.find(
                    (a) => a.user.toString() === userId
                );

                if (existing?.status === "pending") {
                    throw new AppError(
                        "You already requested to join!",
                        400,
                        "Lobby Repository"
                    );
                }

                if (existing?.status === "accepted") {
                    throw new AppError(
                        "You are already in this lobby!",
                        400,
                        "Lobby Repository"
                    );
                }

                if (existing?.status === "rejected") {
                    throw new AppError(
                        "You were rejected. Try again later.",
                        400,
                        "Lobby Repository"
                    );
                }

                throw new AppError("Failed to join lobby!", 400, "Lobby Repository");
            }

            return {
                message: "Request sent successfully",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to request to join lobby!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async acceptJoinRequest(
        lobbyId: string,
        userId: string
    ): Promise<ReturnResponseType> {
        try {
            const userObjectId = new Types.ObjectId(userId);

            // 🔒 Check if user already in another lobby FIRST
            const isUserInAnyLobby = await LobbyModel.exists({
                $or: [
                    { userId }, // host
                    {
                        applicants: {
                            $elemMatch: {
                                user: userObjectId,
                                status: "accepted",
                            },
                        },
                    },
                ],
            });

            if (isUserInAnyLobby) {
                throw new AppError(
                    "User is already in another lobby!",
                    400,
                    "Lobby Repository"
                );
            }

            // ✅ Update directly (atomic)
            const updated = await LobbyModel.updateOne(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                },
                {
                    $set: {
                        "applicants.$.status": "accepted",
                    },
                }
            );

            if (!updated.modifiedCount) {
                throw new AppError(
                    "Join request not found!",
                    404,
                    "Lobby Repository"
                );
            }

            return {
                message: "Join request accepted successfully",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to accept join request!",
                500,
                "Lobby Repository"
            );
        }
    }
}
