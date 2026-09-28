import mongoose, { Document, Schema } from 'mongoose';
import { IMatch } from '../types/match.types';

export interface IMatchDocument extends IMatch, Document { }

const ParticipantSchema = new Schema(
    {
        socketId: { type: String, required: true },
        username: { type: String, required: true },
        currentGroupSize: { type: Number, required: true },
        rank: { type: String, required: true },
    },
    { _id: false }
);

const MatchSchema = new Schema<IMatchDocument>(
    {
        roomId: { type: String, required: true, unique: true, index: true },
        region: { type: String, required: true },
        server: { type: String, required: true },
        partyCode: { type: String, default: null },
        participants: { type: [ParticipantSchema], required: true },
        createdAt: { type: Date, default: Date.now, expires: 3600 },
    },
    { versionKey: false }
);

export const MatchModel = mongoose.model<IMatchDocument>('Match', MatchSchema);