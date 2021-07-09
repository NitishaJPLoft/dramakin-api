import { Document } from 'mongoose';
export interface ISNS extends Document {
    user: object;
    deviceID: string;
    deviceToken: string;
    awsArnEndpoint: string;
    plateform: string;
    createdAt: string;
    updatedAt: string;
}
