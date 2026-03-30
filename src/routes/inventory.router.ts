
import { InventoryController } from 'src/controllers/inventory.controller';
import { authMiddleware } from 'src/middlewares/auth.middleware';
import { BaseRouter } from './base-router';

export class InventoryRoutes extends BaseRouter {
    private inventoryController = new InventoryController();

    protected routes(): void {
        this.router.get('/lobbies', (req, res) => this.inventoryController.getLobbies(req, res));
        this.router.get('/lobby/me', authMiddleware, (req, res) => this.inventoryController.getLobbyMe(req, res));
        this.router.get('/lobby/join-requests', authMiddleware, (req, res) => this.inventoryController.getJoinRequestedLobbies(req, res));
        this.router.get('/lobby/delete/:id', authMiddleware, (req, res) => this.inventoryController.getLobbyById(req, res));
        this.router.post('/lobby/create', authMiddleware, (req, res) => this.inventoryController.createLobby(req, res));
        this.router.post('/lobby/update', authMiddleware, (req, res) => this.inventoryController.updateLobby(req, res));
        this.router.post('/lobby/delete', authMiddleware, (req, res) => this.inventoryController.deleteLobby(req, res));
        this.router.post('/lobby/request-to-join', authMiddleware, (req, res) => this.inventoryController.requestToJoinLobby(req, res));
        this.router.post('/lobby/accept-join-request', authMiddleware, (req, res) => this.inventoryController.acceptJoinRequest(req, res));
    }
}
