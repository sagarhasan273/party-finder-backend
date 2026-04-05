import { z as zod } from 'zod';
import { CreateUserSchema, UpdateUserRecentRoomsSchema, UpdateUserSchema, UserSchema } from '../schemas/user.schema';

// Type Definitions
export type UserType = zod.infer<typeof UserSchema>;
export type CreateUserInput = zod.infer<typeof CreateUserSchema>;
export type UpdateUserInput = zod.infer<typeof UpdateUserSchema>;
export type UpdateUserRecentRoomsInput = zod.infer<typeof UpdateUserRecentRoomsSchema>;