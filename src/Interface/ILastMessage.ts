import { Document } from 'mongoose';
export interface ILastMessage extends Document {
    user: object;
    conversation: object;
    lastmessage: string;
    createdAt: string;
    updatedAt: string;
}
