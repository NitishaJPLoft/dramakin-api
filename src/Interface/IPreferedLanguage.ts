import { Document } from 'mongoose';
export interface IPreferedLanguage extends Document {
    language: Array<[]>;
    user: object;
    selected: boolean;
    createdAt: string;
    updatedAt: string;
}
