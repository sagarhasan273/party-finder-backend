// models/lobby.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { LobbyType } from 'src/types/inventory.type';

// Lobby Mongoose Schema
const LobbySchema = new Schema<LobbyType & Document>(
    {
        host: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String },
        partyCode: { type: String, required: true },
        rankMin: {
            type: String, enum: [
                "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"
            ], required: true
        },
        rankMax: {
            type: String, enum: [
                "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"
            ], required: true
        },
        hostGamename: { type: String, required: true },
        hostTagline: { type: String, required: true },
        rolesNeeded: { type: [String], required: true },
        region: { type: String, required: true },
        server: { type: String, required: true },
        status: { type: String, enum: ["open", "full", "in progress", "closed"], required: true },
        discordLink: { type: String },
        currentPlayers: { type: Number, default: 0, min: 0, max: 5 },

        applicants: {
            type: [{
                user: {
                    type: Schema.Types.ObjectId,
                    ref: "users",
                    required: true,
                },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected", "joining", 'not-joining', "suspended", "cancelled"],
                    default: "pending",
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            }],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret: any) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
        toObject: {
            transform: (doc, ret: any) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

// Indexes
LobbySchema.index({ createdAt: -1 });

// Export model
export const LobbyModel = mongoose.model<LobbyType & Document>('lobbies', LobbySchema);