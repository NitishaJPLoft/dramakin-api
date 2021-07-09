import { Document } from 'mongoose';
export interface IEditorCategory extends Document {
    name: string;
    image: string;
    createdAt: string;
    updatedAt: string;
}
