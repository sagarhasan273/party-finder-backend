// models/lobby.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { LobbyType } from 'src/types/inventory.type';

// Lobby Mongoose Schema
const LobbySchema = new Schema<LobbyType & Document>(
    {
        userId: { type: String, required: true }, // host user id
        title: { type: String, required: true },
        description: { type: String },
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
        map: {
            type: String, enum: [
                "Any", "Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split", "Sunset"
            ], default: "Any"
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