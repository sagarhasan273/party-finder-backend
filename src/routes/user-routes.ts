import { UserController } from 'src/controllers/user.controller';
import { googleAuthMiddleware } from 'src/middlewares/auth.middleware';
import { BaseRouter } from './base-router';

export class UserRoutes extends BaseRouter {
  private userController = new UserController();

  protected routes(): void {
    this.router.get('/user/login', (req, res) => this.userController.getUserByEmail(req, res));
    this.router.get('/user/:id', googleAuthMiddleware, (req, res) => this.userController.getUserById(req, res));
    this.router.post('/user/create', googleAuthMiddleware, (req, res) => this.userController.createUser(req, res));
    this.router.post('/user/update', googleAuthMiddleware, (req, res) => this.userController.updateUser(req, res));
  }
}
