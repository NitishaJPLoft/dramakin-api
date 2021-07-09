import { Schema, model, Model } from 'mongoose';
import { IAppUpdate } from '../Interface/IAppUpdate';
const appUpdateSchema = new Schema(
    {
        versionCode: { type: String || Number },
        versionName: { type: String || Number },
        os: { type: String, default: 'android' },
        status: { type: Boolean, default: 0 },
    },
    {
        collection: 'app_update',
        timestamps: true,
    }
);

appUpdateSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const AppUpdate: Model<IAppUpdate, {}> = model('AppUpdate', appUpdateSchema);
export default AppUpdate;
