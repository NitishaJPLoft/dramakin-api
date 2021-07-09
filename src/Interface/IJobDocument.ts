import { Document } from 'mongoose';
export interface IJobDocument extends Document {
    job: string;
    isProcessed: boolean;
}
