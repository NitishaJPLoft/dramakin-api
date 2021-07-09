import { Document } from 'mongoose';
export interface IApple extends Document {
    userIdentifier: string;
    firstName: string;
    middleName: string;
    lastName: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}
