import { Request, Response } from 'express';
import { CreateLobbySchema } from 'src/schemas/inventory.schema';
import { InventoryService } from 'src/services/inventory.service';
import { AppError } from 'src/utils/errors';
import logger from 'src/utils/logger';

export class InventoryController {
    private inventoryService = new InventoryService();

    public async getLobbies(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];
            if (!token) {
                throw new AppError('Authorization token is required', 401, 'User Service');
            }
            const inventory = await this.inventoryService.getLobbies(token);

            res.status(200).json({ data: inventory, status: true });
        } catch (error) {
            if (error instanceof AppError) {
                logger.error(`${error.at}: ${error.message}`);
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }

            logger.error('An error occurred while getting the inventory!');
            res.status(500).json({ message: 'An error occurred while getting the inventory!', status: false })
        }
    }

    public async getLobbyMe(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];
            if (!token) {
                throw new AppError('Authorization token is required', 401, 'User Service');
            }
            const inventory = await this.inventoryService.getLobbyMe(token);

            res.status(200).json({ data: inventory, message: inventory ? "Lobby not found!" : undefined, status: true });
        } catch (error) {
            if (error instanceof AppError) {
                logger.error(`${error.at}: ${error.message}`);
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }

            logger.error('An error occurred while getting the inventory!');
            res.status(500).json({ message: 'An error occurred while getting the inventory!', status: false })
        }
    }

    public async getJoinRequestedLobbies(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];
            if (!token) {
                throw new AppError('Authorization token is required', 401, 'User Service');
            }
            const inventory = await this.inventoryService.getJoinRequestedLobbies(token);

            res.status(200).json({ data: inventory, status: true });
        }
        catch (error) {
            if (error instanceof AppError) {
                logger.error(`${error.at}: ${error.message}`);
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }

            logger.error('An error occurred while getting the inventory!');
            res.status(500).json({ message: 'An error occurred while getting the inventory!', status: false })
        }
    }

    public async createLobby(req: Request, res: Response): Promise<void> {
        let validatedInput;
        try {
            validatedInput = CreateLobbySchema.parse(req.body);
        } catch (error) {
            console.log(error);
            logger.error('Invalid lobby create data!');
            res.status(400).json({ status: false, message: 'Invalid lobby data!' });
            return;
        }

        try {
            const lobby = await this.inventoryService.createLobby(validatedInput);

            res.status(201).json(lobby);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

            logger.error(`Failed to create lobby: ${errorMessage}`);
            res.status(500).json({ message: errorMessage, status: false });
        }
    }

    public async updateLobby(req: Request, res: Response): Promise<void> {
        try {
            const lobby = await this.inventoryService.updateLobby(req.body);
            res.status(201).json(lobby);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage });
        }
    }

    public async getLobbyById(req: Request, res: Response): Promise<void> {
        try {
            const lobby = await this.inventoryService.getLobbyById(req.params.id);
            if (!lobby) {
                res.status(404).json({ message: 'Lobby not found' });
                return;
            }
            res.status(200).json(lobby);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage });
        }
    }

    public async deleteLobby(req: Request, res: Response): Promise<void> {
        const { userId, lobbyId, applicantIds } = req.body;

        try {
            if (!userId) {
                res.status(400).json({ message: 'User ID not found in token', status: false });
                return;
            }

            const result = await this.inventoryService.deleteLobby(lobbyId, userId, applicantIds);

            res.status(200).json(result);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage });
        }
    }

    public async requestToJoinLobby(req: Request, res: Response): Promise<void> {
        const { applicantId, lobbyId } = req.body;

        try {
            const lobby = await this.inventoryService.requestToJoinLobby(lobbyId, applicantId);
            res.status(200).json(lobby);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage });
        }
    }

    public async acceptJoinRequest(req: Request, res: Response): Promise<void> {
        const { applicantId, lobbyId } = req.body;
        try {
            const lobby = await this.inventoryService.acceptJoinRequest(lobbyId, applicantId);
            res.status(200).json(lobby);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage, status: false });
        }
    }

    public async rejectJoinRequest(req: Request, res: Response): Promise<void> {
        const { applicantId, lobbyId } = req.body;
        try {
            const lobby = await this.inventoryService.rejectJoinRequest(lobbyId, applicantId);

            res.status(200).json(lobby);
        }
        catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage, status: false });
        }
    }

    public async cancelJoinRequest(req: Request, res: Response): Promise<void> {
        const { userId, lobbyId } = req.body;
        try {
            const lobby = await this.inventoryService.cancelJoinRequest(lobbyId, userId);
            res.status(200).json(lobby);
        }
        catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage, status: false });
        }
    }

    public async lobbyStatus(req: Request, res: Response): Promise<void> {
        const { userId, lobbyId } = req.body;
        try {
            const lobby = await this.inventoryService.lobbyStatus(lobbyId, userId);
            res.status(200).json({ data: lobby, status: true });
        }
        catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message, status: false });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message: errorMessage, status: false });
        }
    }
}
