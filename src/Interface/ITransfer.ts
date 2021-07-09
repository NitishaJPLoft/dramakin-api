import { Document } from 'mongoose';
export interface ITransfer extends Document {
    receiverID: string;
    senderID: string;
    crown: number;
    orderID: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
