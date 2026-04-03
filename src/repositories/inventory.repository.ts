
import { Types } from 'mongoose';
import { ReturnResponseType } from 'src/types/base.type';

import { LobbyModel } from 'src/models/inventory.model';
import { CreateLobbyInput, LobbyType, UpdateLobbyInput } from 'src/types/inventory.type';
import { AppError } from 'src/utils/errors';
import { UserInfoPopulateQuery } from './user.repository';


export class InventoryRepository {
    public async getLobbies(userId: string): Promise<LobbyType[]> {

        const lobby = await LobbyModel.find({
            status: {
                $in: ["open", "full", "in progress"]
            }
        }).populate('host', UserInfoPopulateQuery);

        if (!lobby) throw new AppError('Lobby not found!', 404, 'Lobby Repository');

        return lobby.map(l => l.toJSON());
    }

    public async getLobbyMe(hostId: string): Promise<LobbyType | null> {

        const lobby = await LobbyModel.findOne({ host: hostId })
            .populate("applicants.user", UserInfoPopulateQuery)
            .populate('host', UserInfoPopulateQuery);

        if (!lobby) return null;

        return lobby.toJSON();
    }

    public async getJoinRequestedLobbies(userId: string): Promise<LobbyType[]> {

        const lobby = await LobbyModel.find({
            applicants: {
                $elemMatch: {
                    user: new Types.ObjectId(userId),
                    status: { $in: ["pending", "accepted", "rejected", 'suspended', 'joining'] },
                },
            },
        })
            .populate('host', UserInfoPopulateQuery)
        // .populate("applicants.user", UserInfoPopulateQuery)

        return lobby.map(l => l.toJSON());
    }

    public async createLobby(
        lobby: CreateLobbyInput
    ): Promise<LobbyType> {
        const { host } = lobby;

        const exsits = await LobbyModel.exists({
            $or: [
                { host },
                {
                    applicants: {
                        $elemMatch: {
                            user: host,
                            status: {
                                $in: ['accepted', 'joining', 'not-joining', 'pending']
                            },
                        },
                    },
                },
            ],
        });

        if (exsits) {
            throw new AppError("Lobby already exists", 404, "Lobby Repository");
        }

        const result = await LobbyModel.create(lobby);

        // Populate after creation
        const populatedLobby = await result.populate('host', UserInfoPopulateQuery);

        return populatedLobby.toJSON();
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
        hostId: string
    ): Promise<LobbyType> {
        try {
            const result = await LobbyModel.findOneAndDelete({
                _id: lobbyId,
                host: hostId, // 🔒 ensure only owner can delete
            });

            if (!result) {
                throw new AppError(
                    "Lobby not found or you are not authorized",
                    404,
                    "Lobby Repository"
                );
            }

            return result.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to delete lobby!",
                500,
                "Lobby Repository"
            );
        }
    }

    private async isApplicantEngageWithALobby(applicantId: string) {
        const userObjectId = new Types.ObjectId(applicantId);
        // ✅ Check if user already in another lobby (host or accepted)
        const existingLobby = await LobbyModel.findOne({
            $or: [
                { host: applicantId }, // as host
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

        if (existingLobby) {
            // Determine the role (host or member)
            const isHost = existingLobby.host.toString() === applicantId;

            const applicants = existingLobby.applicants || [];

            const isMember = applicants.some(
                a => a.user.toString() === applicantId && a.status === "accepted"
            );

            let role = "";
            let message = "";

            if (isHost) {
                role = "host";
                message = `You are already the host of lobby "${existingLobby.title}"`;
            } else if (isMember) {
                role = "member";
                message = `You are already a member of lobby "${existingLobby.title}"`;
            }

            throw new AppError(
                `You are already ${role} in another lobby: ${existingLobby.title}`,
                400,
                "Lobby Repository"
            );
        }
    }

    public async requestToJoinLobby(
        lobbyId: string,
        applicantId: string
    ): Promise<LobbyType> {
        try {
            await this.isApplicantEngageWithALobby(applicantId);

            const userObjectId = new Types.ObjectId(applicantId);

            // ✅ Atomic update (prevents duplicates)
            const updated = await LobbyModel.findOneAndUpdate(
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
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    },
                },
                {
                    returnDocument: 'after', // Returns the updated or inserted document
                    upsert: false, // Don't create if not exists
                }
            );

            // ❗ If nothing updated → user already exists
            if (!updated) {
                const lobby = await LobbyModel.findById(lobbyId).select("applicants");

                if (!lobby) {
                    throw new AppError("Lobby not found!", 404, "Lobby Repository");
                }

                const existing = lobby.applicants?.find(
                    (a) => a.user.toString() === applicantId
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

            await updated.populate('host', UserInfoPopulateQuery);

            return updated.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to request to join lobby!",
                500,
                "Lobby Repository"
            );
        }
    }

    private async isLobbyFull(lobbyId: string): Promise<boolean> {
        const lobby = await LobbyModel.findById(lobbyId).select('applicants currentPlayers');

        if (!lobby) return true;

        const MAX_PLAYERS = 5;
        const currentPlayers = lobby.currentPlayers || 0;
        const applicants = lobby.applicants ?? [];

        // Count applicants with accepted or joining status
        const activeApplicantsCount = applicants.filter(
            a => a.status === "accepted" || a.status === "joining"
        ).length;

        // Total players = currentPlayers + activeApplicantsCount
        const totalPlayers = currentPlayers + activeApplicantsCount;

        return totalPlayers >= MAX_PLAYERS;
    }

    public async acceptJoinRequest(
        lobbyId: string,
        applicantId: string
    ): Promise<LobbyType> {
        try {
            const isFullLobby = await this.isLobbyFull(lobbyId);

            if (isFullLobby) {
                throw new AppError(
                    `You can not accepted more than you need. Wait for their response and try again.`,
                    400,
                    "Lobby Repository"
                );
            }

            const userObjectId = new Types.ObjectId(applicantId);

            // 🔒 Check if user already in another lobby FIRST
            const isUserInAnyLobby = await LobbyModel.exists({
                $or: [
                    { userId: applicantId }, // host
                    {
                        applicants: {
                            $elemMatch: {
                                user: userObjectId,
                                status: { $in: ["accepted", "joining"] },
                            },
                        },
                    },
                ],
            });

            if (isUserInAnyLobby) {
                throw new AppError(
                    "Sorry, User get accepted in another lobby!",
                    400,
                    "Lobby Repository"
                );
            }

            // ✅ Update directly (atomic)
            const updated = await LobbyModel.findOneAndUpdate(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                },
                {
                    $set: {
                        "applicants.$.status": "accepted",
                        "applicants.$.updatedAt": new Date(),
                    },
                },
                {
                    returnDocument: 'after', // Returns the updated or inserted document
                    upsert: false, // Don't create if not exists
                }
            );

            if (!updated) {
                throw new AppError(
                    "Join request not found. May be request got cancelled!",
                    404,
                    "Lobby Repository"
                );
            }

            await updated.populate('host', UserInfoPopulateQuery);

            return updated.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to accept join request!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async rejectJoinRequest(
        lobbyId: string,
        applicantId: string
    ): Promise<LobbyType> {
        try {
            const userObjectId = new Types.ObjectId(applicantId);
            const lobby = await LobbyModel.findOneAndUpdate(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                    "applicants.status": 'pending',
                },
                {
                    $set: {
                        "applicants.$.status": "rejected",
                        "applicants.$.updatedAt": new Date(),
                    },
                },
                {
                    returnDocument: 'after', // Returns the updated or inserted document
                    upsert: false, // Don't create if not exists
                }
            );

            if (!lobby) {
                throw new AppError(
                    "Join request not found!",
                    404,
                    "Lobby Repository"
                );
            }

            return lobby.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to reject join request!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async suspendApplicantJoining(
        lobbyId: string,
        applicantId: string
    ): Promise<LobbyType> {
        try {
            const userObjectId = new Types.ObjectId(applicantId);
            const updated = await LobbyModel.findOneAndUpdate(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                    "applicants.status": 'accepted',
                },
                {
                    $set: {
                        "applicants.$.status": "suspended",
                        "applicants.$.updatedAt": new Date(),
                    },
                },
                {
                    returnDocument: 'after', // Returns the updated or inserted document
                    upsert: false, // Don't create if not exists
                }
            );

            if (!updated) {
                throw new AppError(
                    "Join request not found!",
                    404,
                    "Lobby Repository"
                );
            }

            return updated.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to suspend applicant!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async applicantJoining(
        lobbyId: string,
        applicantId: string
    ): Promise<LobbyType> {
        try {
            const userObjectId = new Types.ObjectId(applicantId);
            const MAX_PLAYERS = 5;

            // First, get the lobby to check current counts
            const lobby = await LobbyModel.findById(lobbyId);

            if (!lobby) {
                throw new AppError("Lobby not found!", 404, "Lobby Repository");
            }

            const applicants = lobby.applicants ?? [];

            // Calculate total players (accepted + joining)
            const totalActivePlayers = applicants.filter(
                a => a.status === "accepted" || a.status === "joining"
            ).length;

            // Check if lobby is full
            if (totalActivePlayers >= MAX_PLAYERS) {
                throw new AppError(
                    `Lobby is full! Maximum ${MAX_PLAYERS} players allowed.`,
                    400,
                    "Lobby Repository"
                );
            }

            // Check if applicant exists and has correct status
            const applicant = applicants.find(
                a => a.user.toString() === applicantId
            );

            if (!applicant) {
                throw new AppError("Join request not found!", 404, "Lobby Repository");
            }

            if (applicant.status !== "accepted") {
                throw new AppError(
                    `Cannot join. Request status is ${applicant.status}`,
                    400,
                    "Lobby Repository"
                );
            }

            const updated = await LobbyModel.findOneAndUpdate(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                    "applicants.status": 'accepted',
                },
                {
                    $set: {
                        "applicants.$.status": "joining",
                        "applicants.$.updatedAt": new Date(),
                    },
                },
                {
                    returnDocument: 'after', // Returns the updated or inserted document
                    upsert: false, // Don't create if not exists
                }
            );

            if (!updated) {
                throw new AppError(
                    "Join request not found!",
                    404,
                    "Lobby Repository"
                );
            }

            return updated.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to join!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async cancelJoinRequest(
        lobbyId: string,
        applicantId: string
    ): Promise<ReturnResponseType> {
        try {
            const userObjectId = new Types.ObjectId(applicantId);
            const updated = await LobbyModel.updateOne(
                {
                    _id: lobbyId,
                    "applicants.user": userObjectId,
                },
                {
                    $set: {
                        "applicants.$.status": "cancelled",
                        "applicants.$.updatedAt": new Date(),
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
                message: "Join request cancelled successfully",
                status: true,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Failed to cancel join request!",
                500,
                "Lobby Repository"
            );
        }
    }

    public async lobbyStatus(lobbyId: string, userId: string): Promise<LobbyType> {
        try {
            const lobby = await LobbyModel.findById(lobbyId);

            if (!lobby) {
                throw new AppError("Lobby not found", 404, "Lobby Repository");
            }

            lobby.status = lobby.status === 'open' ? 'closed' : lobby.status === 'closed' ? 'open' : 'closed';

            lobby.save()

            return lobby
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Lobby Status Update failed!",
                500,
                "Lobby Repository"
            );
        }
    }
}
