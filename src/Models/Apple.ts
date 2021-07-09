import { Schema, model, Model } from 'mongoose';
import { IApple } from '../Interface/IApple';
const appleSchema = new Schema(
    {
        userIdentifier: { type: String },
        firstName: { type: String },
        middleName: { type: Boolean },
        lastName: { type: Number },
        name: { type: String },
        email: { type: String },
    },
    {
        collection: 'apple_login',
        timestamps: true,
    }
);

appleSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Apple: Model<IApple, {}> = model('Apple', appleSchema);
export default Apple;
