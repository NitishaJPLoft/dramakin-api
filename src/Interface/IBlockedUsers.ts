import { Document } from 'mongoose';
export interface IBlockedUsers extends Document {
    targetUser: object;
    blockedBy: object;
    isBlocked: boolean;
}
