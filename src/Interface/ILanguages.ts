import { Document } from 'mongoose';
export interface ILanguages extends Document {
    language: string;
    createdAt: string;
    updatedAt: string;
}
