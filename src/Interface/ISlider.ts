import { Document } from 'mongoose';
export interface ISlider extends Document {
    hashtag: string;
    viewCount: number;
    image: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}
