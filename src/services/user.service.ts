import { UserRepository } from 'src/repositories/user.repository';
import { ReturnResponseType } from 'src/types/base.type';
import { UpdateUserInput, UserType } from 'src/types/user.type';
import { AppError, DatabaseError } from 'src/utils/errors';
import { JwtService } from './auth/jwt.service';

export class UserService {
  private userRepository = new UserRepository();

  public async createUser(
    user: Omit<UserType, '_id' | 'createAt' | 'updateAt'>
  ): Promise<UserType> {
    try {
      return await this.userRepository.createUser(user);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key error')) {
        throw new DatabaseError(error as Error, 'User already exists');
      }
      throw new DatabaseError(error as Error, 'Failed to create user');
    }
  }

  public async updateUser(input: UpdateUserInput): Promise<ReturnResponseType> {
    try {
      if (!input.id) throw new AppError('User ID is required', 400, 'User Repository');

      return await this.userRepository.updateUser(input);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to update user!', 500, 'User Service');
    }
  }

  public async getUserMe(
    token: string,
  ): Promise<UserType | null> {
    try {
      const decodedToken = JwtService.decodeToken(token);
      if (!decodedToken) throw new Error('Invalid token');

      const userId = decodedToken.id;
      if (!userId) throw new AppError('User ID not found in token', 400, 'User Service');

      const user = await this.userRepository.getUserMe(userId);

      return user;

    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key error')) {
        throw new DatabaseError(error as Error, "User doesn't exist");
      }
      throw new DatabaseError(error as Error, 'Failed to get user by email');
    }
  }

  public async getUserById(id: string): Promise<UserType | null> {
    try {
      return await this.userRepository.getUserById(id);
    } catch (error) {
      throw new DatabaseError(error as Error, 'Failed to get user by ID');
    }
  }
}
