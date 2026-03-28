import { CreateUserSchema, UpdateUserRecentRoomsSchema, UpdateUserSchema, UserSchema } from 'src/schemas/user.schema';
import { z as zod } from 'zod';

// Type Definitions
export type UserType = zod.infer<typeof UserSchema>;
export type CreateUserInput = zod.infer<typeof CreateUserSchema>;
export type UpdateUserInput = zod.infer<typeof UpdateUserSchema>;
export type UpdateUserRecentRoomsInput = zod.infer<typeof UpdateUserRecentRoomsSchema>;