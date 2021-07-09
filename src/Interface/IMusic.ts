import { Document } from 'mongoose';
export interface IMusic extends Document {
    video: object;
    user: object;
    url: string;
    songID: string;
    songName: string;
    singer: string;
    thumbnail: string;
    createdAt: string;
    updatedAt: string;
}
