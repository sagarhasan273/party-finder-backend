import { MatchController } from '../controllers/match.controller';
import { BaseRouter } from './base-router';

export class MatchRoutes extends BaseRouter {
    private matchController = new MatchController();

    protected routes(): void {
        this.router.get('/stats', (req, res) => this.matchController.getQueueStats(req, res));
        this.router.get('/:roomId', (req, res) => this.matchController.getMatchDetails(req, res));
        this.router.patch('/:roomId/party-code', (req, res) => this.matchController.setPartyCode(req, res));
    }
}