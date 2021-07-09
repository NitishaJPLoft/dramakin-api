import { Document } from 'mongoose';
export interface IConversations extends Document {
    users: [
        {
            user: object;
            isOnline: boolean;
            isInitiatedConversation: boolean;
            unreadCount: number;
        }
    ];
    messages: [];
    user: object;
    me: object;
    totalchats: number;
    isSoftDeleted: boolean;
    softDeletedBy: string;
    createdAt: string;
    updatedAt: string;
}
