import { Document } from 'mongoose';
export interface IChat extends Document {
    user: object;
    isOnline: boolean;
    isInitiatedConversation: boolean;
    lastmessage: string;
    message: string;
    unreadCount: number;
    type: string;
    last_messaged_at: string;
    conversationID: object;
    senderID: string;
    receiverID: string;
    isRead: boolean;
    hideSendermessage : boolean;
    hideForUser : string;
    createdAt: string;
    updatedAt: string;
}
