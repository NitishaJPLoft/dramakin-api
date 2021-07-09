import { Document } from 'mongoose';
export interface INotification extends Document {
    user: object;
    title: string;
    message: string;
    action: string;
    intent: string;
    targetID: string;
    isRead: boolean;
    targetUser: object;
    createdAt: string;
    updatedAt: string;
}
