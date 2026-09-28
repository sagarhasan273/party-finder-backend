import { Request, Response } from 'express';
import { matchService } from '../services/match.service';

export class MatchController {
    public async getMatchDetails(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const match = await matchService.getMatch(roomId);

            if (!match) {
                res.status(404).json({ success: false, message: 'Match room not found' });
                return;
            }

            res.status(200).json({ success: true, data: match });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    public async setPartyCode(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const { partyCode } = req.body;

            if (!partyCode) {
                res.status(400).json({ success: false, message: 'Party code is required' });
                return;
            }

            const updated = await matchService.setPartyCode(roomId, partyCode);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    public getQueueStats(req: Request, res: Response): void {
        res.status(200).json({
            success: true,
            inQueue: matchService.getQueueLength(),
        });
    }
}