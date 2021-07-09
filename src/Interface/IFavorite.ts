import { Document } from 'mongoose';
export interface IFavorite extends Document {
    user: object;
    isFavorite: boolean;
    songID: string;
    songName: string;
    createdAt: string;
    updatedAt: string;
}
