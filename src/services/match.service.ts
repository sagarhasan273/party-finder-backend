
import { VALORANT_RANKS } from '../configs/valorant.config';
import { IMatchDocument } from '../models/match.model';
import { MatchRepository } from '../repositories/match.repositories';

import { IMatch, PlayerTicket } from '../types/match.types';

export class MatchService {
    private matchRepository: MatchRepository;
    private queue: PlayerTicket[] = [];

    constructor() {
        this.matchRepository = new MatchRepository();
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    public removeSocketFromQueue(socketId: string): void {
        this.queue = this.queue.filter((ticket) => ticket.socketId !== socketId);
    }

    public checkRankCompatibility(playerA: PlayerTicket, playerB: PlayerTicket): boolean {
        const idxA = VALORANT_RANKS.indexOf(playerA.rank);
        const idxB = VALORANT_RANKS.indexOf(playerB.rank);
        const minB = VALORANT_RANKS.indexOf(playerB.minRank);
        const maxB = VALORANT_RANKS.indexOf(playerB.maxRank);
        const minA = VALORANT_RANKS.indexOf(playerA.minRank);
        const maxA = VALORANT_RANKS.indexOf(playerA.maxRank);

        if ([idxA, idxB, minA, maxA, minB, maxB].includes(-1)) return false;
        return idxA >= minB && idxA <= maxB && idxB >= minA && idxB <= maxA;
    }

    public async findMatch(newTicket: PlayerTicket): Promise<{ match: IMatchDocument; matchedPeer: PlayerTicket } | null> {
        this.removeSocketFromQueue(newTicket.socketId);

        const matchIndex = this.queue.findIndex((candidate) => {
            const isComplementary = newTicket.currentGroupSize + candidate.currentGroupSize === 5;
            const isSameLocation = newTicket.region === candidate.region && newTicket.server === candidate.server;
            const ranksValid = this.checkRankCompatibility(newTicket, candidate);
            return isComplementary && isSameLocation && ranksValid;
        });

        if (matchIndex === -1) {
            this.queue.push(newTicket);
            return null;
        }

        const matchedPeer = this.queue.splice(matchIndex, 1)[0];
        const roomId = `VAL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const matchData: IMatch = {
            roomId,
            region: newTicket.region,
            server: newTicket.server,
            partyCode: null,
            participants: [
                {
                    socketId: newTicket.socketId,
                    username: newTicket.username,
                    currentGroupSize: newTicket.currentGroupSize,
                    rank: newTicket.rank,
                },
                {
                    socketId: matchedPeer.socketId,
                    username: matchedPeer.username,
                    currentGroupSize: matchedPeer.currentGroupSize,
                    rank: matchedPeer.rank,
                },
            ],
        };

        const match = await this.matchRepository.createMatch(matchData);
        return { match, matchedPeer };
    }

    public async getMatch(roomId: string): Promise<IMatchDocument | null> {
        return await this.matchRepository.findByRoomId(roomId);
    }

    public async setPartyCode(roomId: string, partyCode: string): Promise<IMatchDocument | null> {
        return await this.matchRepository.updatePartyCode(roomId, partyCode);
    }
}

export const matchService = new MatchService();