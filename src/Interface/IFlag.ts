import { Document } from 'mongoose';
export interface IFlag extends Document {
    categoryID: object;
    videoID: object;
    userID: object;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
}
