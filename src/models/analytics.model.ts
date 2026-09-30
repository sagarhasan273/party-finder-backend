import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
    statId: string;
    totalVisits: number;
    searches: Record<string, number>; // e.g. { "AP-Mumbai": 150, "NA-Ashburn": 80 }
}

const AnalyticsSchema = new Schema<IAnalytics>(
    {
        statId: { type: String, default: 'GLOBAL_STATS', unique: true, index: true },
        totalVisits: { type: Number, default: 0 },
        searches: { type: Map, of: Number, default: {} },
    },
    { versionKey: false }
);

export const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);