import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export class UserController {
  private userService = new UserService();

  public async getUserMe(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.split(' ')[1];
      if (!token) {
        throw new AppError('Authorization token is required', 401, 'User Service');
      }
      const user = await this.userService.getUserMe(token);

      res.status(200).json({ data: user, status: true });
    } catch (error) {
      if (error instanceof AppError) {
        logger.error(`${error.at}: ${error.message}`);
        res.status(error.statusCode).json({ message: error.message, status: false });
        return;
      }

      logger.error('An error occurred while getting the user!');
      res.status(500).json({ message: 'An error occurred while getting the user!', status: false })
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.updateUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  }
}
