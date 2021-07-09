import { Document } from 'mongoose';
export interface IWallet extends Document {
    userID: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
}
