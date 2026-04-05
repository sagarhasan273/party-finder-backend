import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { BaseRouter } from './base-router';

export class UserRoutes extends BaseRouter {
  private userController = new UserController();

  protected routes(): void {
    this.router.get('/me', authMiddleware, (req, res) => this.userController.getUserMe(req, res));
    this.router.post('/create', authMiddleware, (req, res) => this.userController.createUser(req, res));
    this.router.post('/update', authMiddleware, (req, res) => this.userController.updateUser(req, res));
  }
}
