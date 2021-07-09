import { Document } from 'mongoose';
export interface IClearedChat extends Document {
    user: object;
    conversationID: object;
    chat :  Array<[]>
}
