import mongoose from 'mongoose';
import logger from './utils/logger';
import { dbConfig } from './config';
import { DatabaseError } from './utils/errors';

let isConnected = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const MONGO_URI = dbConfig.url;

    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    const conn = await mongoose.connect(MONGO_URI, {
      dbName: process.env.DB_NAME, // optional
    });

    isConnected = true;

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    return mongoose;
  } catch (error) {
    logger.error('❌ Mongoose connection error:', error);
    throw new DatabaseError(error as Error, 'initializing Mongoose connection');
  }
}