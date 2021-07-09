import { Document } from 'mongoose';
export interface IEditorChoice extends Document {
    name: string;
    song: string;
    singer: string;
    category: object;
    thumbnail: string;
    createdAt: string;
    updatedAt: string;
}
