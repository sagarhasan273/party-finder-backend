import { z } from "zod";
import { objectIdSchema } from "./base.schema";

// -----------------
// Enums / Unions
// -----------------

export const RankTierEnum = z.enum([
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Ascendant",
    "Immortal",
    "Radiant",
]);

export const ValorantMapEnum = z.enum([
    "Any",
    "Ascent",
    "Bind",
    "Breeze",
    "Fracture",
    "Haven",
    "Icebox",
    "Lotus",
    "Pearl",
    "Split",
    "Sunset",
]);

export const LobbyStatusEnum = z.enum(["open", "full", "in progress", "closed"]);

export const LobbySchema = z.object({
    id: objectIdSchema,
    host: objectIdSchema,
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    partyCode: z.string().min(1, "Party code is required"),
    rankMin: RankTierEnum,
    rankMax: RankTierEnum,
    hostGamename: z.string().min(1, "Host gamename is required"),
    hostTagline: z.string().min(1, "Host tagline is required"),
    rolesNeeded: z.array(z.string()),
    region: z.string(),
    server: z.string(),
    status: LobbyStatusEnum,
    discordLink: z.string().url().optional(),
    currentPlayers: z.number().int().nonnegative().optional(),
    map: ValorantMapEnum.optional(), // optional map if needed
    createdAt: z.string(),

    applicants: z.array(z.object({
        user: objectIdSchema,
        status: z.enum(["pending", "accepted", "rejected", "joining", 'not-joining', "suspended", "cancelled"]),
        createdAt: z.string(),
        updatedAt: z.string(),
    })).optional(),
});

export const CreateLobbySchema = LobbySchema.omit({ id: true, host: true }).extend({
    host: z.string()
});

export const UpdateLobbySchema = LobbySchema.partial().required({
    id: true,
});
