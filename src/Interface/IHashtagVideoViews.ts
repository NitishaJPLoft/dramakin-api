import { Document } from 'mongoose';
export interface IHashtagVideoViews extends Document {
    hashtag: string;
    viewCount: number;
    videoCount: number;
    createdAt: string;
    updatedAt: string;
}
