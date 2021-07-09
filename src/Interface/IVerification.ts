import { Document } from 'mongoose';
export interface IVerification extends Document {
    user: string;
    document: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}
