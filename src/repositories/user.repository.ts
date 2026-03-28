import { ObjectId } from 'mongodb';
import { UserModel } from 'src/models/user.model';

import { Types } from 'mongoose';
import { getDatabase } from 'src/database';
import { ReturnResponseType } from 'src/types/base.type';
import { UpdateUserInput, UserType } from 'src/types/user.type';
import { AppError } from 'src/utils/errors';

export class UserRepository {
  private static collectionName = 'users';

  private async getCollection() {
    const db = await getDatabase();
    return db.collection<UserType>(UserRepository.collectionName);
  }

  public async createUser(
    user: Omit<UserType, '_id' | 'createAt' | 'updateAt'>
  ): Promise<UserType> {
    const collection = await this.getCollection();

    const now = new Date();
    const newUser = {
      ...user,
      createAt: now,
      updateAt: now,
    };
    const result = await collection.insertOne(newUser);
    const { ...userWithoutPassword } = { ...newUser, _id: result.insertedId };
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
    const collection = await this.getCollection();
    const user = await collection.findOne({ email });
    if (!user) return null;

    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async getUserById(id: string): Promise<UserType | null> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
