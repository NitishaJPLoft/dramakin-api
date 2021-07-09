import { Schema, model, Model } from 'mongoose';
import { ISNS } from '../Interface/ISNS';
const snsSchema = new Schema(
    {
        deviceID: { type: String, default: '' },
        deviceToken: { type: String, default: '' },
        awsArnEndpoint: { type: String, default: '' },
        plateform: { type: String, default: 'android' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { collection: 'sns', timestamps: true }
);

snsSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const SNS: Model<ISNS, {}> = model('SNS', snsSchema);
export default SNS;
