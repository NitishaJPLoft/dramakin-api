import { Document } from 'mongoose';
export interface IOrder extends Document {
    userID: string;
    amount: number;
    currency: string;
    receipt: string;
    createdAt: string;
    updatedAt: string;
}
