// schemas/user.schema.ts

import { z as zod } from 'zod';
import { objectIdSchema } from './base.schema';

const AgentEnum = zod.enum([
    "Astra",
    "Breach",
    "Brimstone",
    "Chamber",
    "Clove",
    "Cypher",
    "Deadlock",
    "Fade",
    "Gekko",
    "Harbor",
    "Iso",
    "Jett",
    "KAY/O",
    "Killjoy",
    "Miks",
    "Neon",
    "Omen",
    "Phoenix",
    "Raze",
    "Reyna",
    "Sage",
    "Skye",
    "Sova",
    "Viper",
    "Vyse",
    "Yoru",
]);

const PlaystyleEnum = zod.enum(["😌 Chill", "⚖️ Balanced", "🔥 Competitive", "🎯 Serious", "🔥 Tryhard"]);

export const ApplicantSchema = zod.object({
    user: objectIdSchema,
    status: zod.enum(["pending", "accepted", "rejected"]),
});

// Main User Schema

export const UserSchema = zod.object({
    id: objectIdSchema,

    userId: zod.string().regex(/^USR\d{6}\d{4}$/, {
        message: "User ID must follow the format USRYYMMDDCOUNTER",
    }),

    googleId: zod.string(),

    name: zod.string().optional(),
    username: zod.string().optional(),

    email: zod
        .string()
        .email({ message: "Invalid email address" })
        .min(1, { message: "Email is required" }),

    profilePhoto: zod
        .string()
        .url({ message: "Invalid URL for profile photo" })
        .optional(),

    gender: zod.enum([
        "male",
        "female",
        "other",
        "prefer-not-to-say",
    ]),

    verified: zod.boolean(),

    // 🔥 NEW FIELDS

    country: zod.string().optional(),

    rank: zod.string().optional(),

    pickRank: zod.string().optional(),

    mainRole: zod
        .enum(["Duelist", "Initiator", "Controller", "Sentinel"])
        .optional(),

    gamename: zod.string().min(1).optional(),

    tagline: zod
        .string()
        .optional(),

    playstyle: zod
        .enum(PlaystyleEnum.options)
        .optional(),

    region: zod.string().optional(),

    agents: zod.array(AgentEnum).optional(),
}).strict();

// Derived Schemas
export const CreateUserSchema = UserSchema.pick({
    username: true,
    email: true,
    name: true,
}).extend({
    password: zod.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export const LogInUserSchema = UserSchema.pick({
    email: true,
}).extend({
    password: zod.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export const UpdateUserSchema = UserSchema.pick({
    id: true,
    userId: true,
    username: true,
    email: true,
    name: true,
    profilePhoto: true,
}).partial().required({
    id: true,
});

export const UpdateUserRecentRoomsSchema = UserSchema.pick({
    id: true,
}).partial().required({
    id: true,
}).extend({
    roomId: zod.string()
});

export const UserAccountUpdateSchema = UserSchema.pick({
    id: true,
    userId: true,
    username: true,
}).extend({
    password: zod.string().min(8, { message: 'Password must be at least 8 characters' }),
    newPassword: zod.string().min(8, { message: 'New password must be at least 8 characters' })
})

export const UserAccountActivateSchema = UserSchema.pick({
    id: true,
}).required({ id: true })

export const UserAccountSessionSchema = UserSchema.pick({
    id: true,
}).required({ id: true })

export const ParticipantUserSchema = UserSchema.pick({
    id: true,
    userId: true,
    username: true,
    email: true,
    name: true,
    profilePhoto: true,
}).partial().required({
    id: true,
}).extend({ roomId: zod.string() });


