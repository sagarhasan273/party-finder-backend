import { AnalyticsModel, IAnalytics } from '../models/analytics.model';

export class AnalyticsRepository {
    public async getOrCreateGlobalStats(): Promise<IAnalytics> {
        let stats = await AnalyticsModel.findOne({ statId: 'GLOBAL_STATS' }).exec();
        if (!stats) {
            stats = await AnalyticsModel.create({ statId: 'GLOBAL_STATS' });
        }
        return stats;
    }

    public async incrementVisit(): Promise<void> {
        await AnalyticsModel.findOneAndUpdate(
            { statId: 'GLOBAL_STATS' },
            { $inc: { totalVisits: 1 } },
            { upsert: true }
        ).exec();
    }

    public async incrementSearch(searchKey: string): Promise<void> {
        await AnalyticsModel.findOneAndUpdate(
            { statId: 'GLOBAL_STATS' },
            { $inc: { [searchKey]: 1 } },
            { upsert: true }
        ).exec();
    }
}