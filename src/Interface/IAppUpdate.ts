import { Document } from 'mongoose';
export interface IAppUpdate extends Document {
    versionCode: any;
    versionName: any;
    os: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}
