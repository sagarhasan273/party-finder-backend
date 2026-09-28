export interface IParticipant {
    socketId: string;
    username: string;
    currentGroupSize: number;
    rank: string;
}

export interface IMatch {
    roomId: string;
    region: string;
    server: string;
    partyCode: string | null;
    participants: IParticipant[];
    createdAt?: Date;
}

export interface PlayerTicket {
    socketId: string;
    username: string;
    region: string;
    server: string;
    rank: string;
    minRank: string;
    maxRank: string;
    currentGroupSize: number;
}