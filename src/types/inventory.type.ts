import { z } from "zod";
import { CreateLobbySchema, LobbySchema, UpdateLobbySchema } from "../schemas/inventory.schema";

export type RankTier =
    | "Iron"
    | "Bronze"
    | "Silver"
    | "Gold"
    | "Platinum"
    | "Diamond"
    | "Ascendant"
    | "Immortal"
    | "Radiant";

export type ValorantMap =
    | "Any"
    | "Ascent"
    | "Bind"
    | "Breeze"
    | "Fracture"
    | "Haven"
    | "Icebox"
    | "Lotus"
    | "Pearl"
    | "Split"
    | "Sunset";

export type LobbyStatus = "open" | "full" | "in progress" | "closed";

export type LobbyType = z.infer<typeof LobbySchema>;
export type CreateLobbyInput = z.infer<typeof CreateLobbySchema>;
export type UpdateLobbyInput = z.infer<typeof UpdateLobbySchema>;