import { AnalyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
    private analyticsRepository: AnalyticsRepository;

    constructor() {
        this.analyticsRepository = new AnalyticsRepository();
    }

    public async recordVisit(): Promise<void> {
        await this.analyticsRepository.incrementVisit();
    }

    public async recordSearch(region: string, server: string): Promise<void> {
        const searchKey = `searches.${region} - ${server}`;
        await this.analyticsRepository.incrementSearch(searchKey);
    }

    public async getStats(): Promise<{ totalVisits: number; searches: Record<string, number> }> {
        const stats = await this.analyticsRepository.getOrCreateGlobalStats();

        // Convert the Mongoose Map to a standard JavaScript object for the frontend
        return {
            totalVisits: stats.totalVisits,
            searches: stats.searches instanceof Map
                ? Object.fromEntries(stats.searches)
                : stats.searches ?? {}
        };
    }
}

export const analyticsService = new AnalyticsService();