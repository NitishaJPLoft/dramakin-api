import { Document } from 'mongoose';
export interface ITransaction extends Document {
    userID: string;
    crown: number;
    amount: number;
    orderID: string;
    transactionID: string;
    token: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
