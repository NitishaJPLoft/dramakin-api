import { Document } from 'mongoose';
export interface ICrown extends Document {
    crown: number;
    description: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
}
