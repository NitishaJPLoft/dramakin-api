import { Document } from 'mongoose';
export interface IVideosPreferenceDocument extends Document {
    canDownloadVideo: boolean;
    canShareVideos: boolean;
    isPrivateVideo: boolean;
    isProfilePrivate: boolean;
    postIsPublic: boolean;
    pushNotification: boolean;
    silentNotification: boolean;
    chatNotification: boolean;
    user: object;
}
