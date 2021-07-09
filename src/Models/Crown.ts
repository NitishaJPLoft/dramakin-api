import { Schema, model, Model } from 'mongoose';
import { ICrown } from '../Interface/ICrown';
const crownSchema = new Schema(
    {
        crown: { type: Number, required: true },
        description: { type: String },
        amount: { type: Number, required: true },
        platform: { type: String, required: true },
        packageId: { type: String },
    },
    {
        collection: 'crowns',
        timestamps: true,
    }
);

crownSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Crown: Model<ICrown, {}> = model('Crown', crownSchema);
export default Crown;
