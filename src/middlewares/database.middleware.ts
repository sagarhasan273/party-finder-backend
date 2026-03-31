import { NextFunction, Request, Response } from 'express';
import { connectToDatabase } from 'src/database';

export async function databaseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}