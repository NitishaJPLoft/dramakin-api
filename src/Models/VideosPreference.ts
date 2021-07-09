import { Schema, Model, model } from 'mongoose';
import { IVideosPreferenceDocument } from '../Interface/IVideosPreferenceDocument';

const properties = {
    canDownloadVideo: {
        type: Boolean,
        default: true,
    },
    canShareVideos: {
        type: Boolean,
        default: true,
    },

    isPrivateVideo: {
        type: Boolean,
        default: false,
    },
    isProfilePrivate: {
        type: Boolean,
        default: false,
    },
    postIsPublic: {
        type: Boolean,
        default: true,
    },

    pushNotification: {
        type: Boolean,
        default: true,
    },
    silentNotification: {
        type: Boolean,
        default: false,
    },
    chatNotification: {
        type: Boolean,
        default: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
};

const VideosPreferenceSchema = new Schema(properties, {
    collection: 'videos_preference',
});

VideosPreferenceSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const VideosPreference: Model<IVideosPreferenceDocument, {}> = model(
    'VideosPreference',
    VideosPreferenceSchema
);
export default VideosPreference;
