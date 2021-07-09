import { Schema, model, Model } from 'mongoose';
import { ITransfer } from '../Interface/ITransfer';
const transferSchema = new Schema(
    {
        senderID: { type: Schema.Types.ObjectId, ref: 'User' },
        receiverID: { type: Schema.Types.ObjectId, ref: 'User' },
        crown: { type: Number, required: true },
        orderID: { type: String, required: true },
        status: { type: String, default: 'processing' },
    },
    {
        collection: 'transfer',
        timestamps: true,
    }
);

transferSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Transfer: Model<ITransfer, {}> = model('Transfer', transferSchema);
export default Transfer;
