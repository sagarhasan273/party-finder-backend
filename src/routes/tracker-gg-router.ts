
import { TrackerController } from '../controllers/tracker-gg.controller';
import { BaseRouter } from './base-router';

export class TrackerRoutes extends BaseRouter {
    private trackerController = new TrackerController();

    protected routes(): void {
        this.router.get('/valorant/matches/:riotId', (req, res) =>
            this.trackerController.getValorantMatches(req, res),
        );
    }
}