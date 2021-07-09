import { Document } from 'mongoose';
export interface IReportCategory extends Document {
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}
