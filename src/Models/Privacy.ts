import { Schema, Model, model } from 'mongoose';
import { IPrivacy } from '../Interface/IPrivacy';

const properties = {
    isProfilePrivate: { type: Boolean, default: false },
    postIsPublic: { type: Boolean, default: true },
    pushNotification: { type: Boolean, default: true },
    silentNotification: { type: Boolean, default: false },
    chatNotification: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
};

const PrivacyPreferenceSchema = new Schema(properties, {
    collection: 'privacy',
});

PrivacyPreferenceSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Privacy: Model<IPrivacy, {}> = model('Privacy', PrivacyPreferenceSchema);
export default Privacy;
