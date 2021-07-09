import { Document } from 'mongoose';
export interface IPrivacy extends Document {
    isProfilePrivate: boolean;
    postIsPublic: boolean;
    pushNotification: boolean;
    silentNotification: boolean;
    chatNotification: boolean;
    user: object;
}
