import { IMatchDocument, MatchModel } from '../models/match.model';
import { IMatch } from '../types/match.types';

export class MatchRepository {
    public async createMatch(data: IMatch): Promise<IMatchDocument> {
        return await MatchModel.create(data);
    }

    public async findByRoomId(roomId: string): Promise<IMatchDocument | null> {
        return await MatchModel.findOne({ roomId }).exec();
    }

    public async updatePartyCode(roomId: string, partyCode: string): Promise<IMatchDocument | null> {
        return await MatchModel.findOneAndUpdate(
            { roomId },
            { partyCode },
            { new: true }
        ).exec();
    }

    public async deleteMatch(roomId: string): Promise<IMatchDocument | null> {
        return await MatchModel.findOneAndDelete({ roomId }).exec();
    }
}