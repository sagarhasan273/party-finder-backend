import { UserModel } from 'src/models/user.model';

import { Types } from 'mongoose';
import { ReturnResponseType } from 'src/types/base.type';
import { UpdateUserInput, UserType } from 'src/types/user.type';
import { AppError } from 'src/utils/errors';

export class UserRepository {

  public async getUserMe(userId: string): Promise<UserType> {

    const user = await UserModel.findById(userId);

    if (!user) throw new AppError('User not found!', 404, 'User Repository');

    return user.toJSON();
  }

  public async createUser(
    user: Omit<UserType, '_id' | 'createAt' | 'updateAt'>
  ): Promise<UserType> {


    const now = new Date();
    const newUser = {
      ...user,
      createAt: now,
      updateAt: now,
    };
    const result = await UserModel.insertOne(newUser);
    const { ...userWithoutPassword } = { ...newUser, _id: result._id };
    return userWithoutPassword;
  }

  public async updateUser(input: UpdateUserInput): Promise<ReturnResponseType> {
    try {
      const { id, ...updatableFields } = input;

      const user = await UserModel.updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: {
            ...updatableFields,
            updatedAt: new Date(),
          },
        }
      );

      if (!user.modifiedCount) {
        throw new AppError('Failed to update user', 404, 'User Repository');
      }

      return { message: 'Profile updated successfully', status: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to update user!', 500, 'User Repository');
    }
  }

  public async getUserByEmail(
    email: string,
  ): Promise<UserType | null> {
    const user = await UserModel.findOne({ email });

    if (!user) return null;

    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }


}
