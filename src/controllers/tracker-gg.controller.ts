import { Request, Response } from 'express';

export class TrackerController {
    public async getValorantMatches(req: Request, res: Response): Promise<void> {
        try {
            const { riotId } = req.params;

            if (!riotId) {
                res.status(400).json({
                    status: false,
                    message: 'Riot ID is required',
                });
                return;
            }

            const response = await fetch(
                `https://api.tracker.gg/api/v2/valorant/standard/matches/riot/Ginger%23DIAGO`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'Mozilla/5.0',
                    },
                },
            );

            if (!response.ok) {
                res.status(response.status).json({
                    status: false,
                    message: 'Failed to fetch Valorant matches',
                });
                return;
            }

            const data = await response.json();

            res.status(200).json({
                status: true,
                data,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred';

            res.status(500).json({
                status: false,
                message: errorMessage,
            });
        }
    }
}