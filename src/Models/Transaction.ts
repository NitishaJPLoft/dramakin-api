import { Schema, model, Model } from 'mongoose';
import { ITransaction } from '../Interface/ITransaction';
const transactionSchema = new Schema(
    {
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
        crown: { type: Number, required: true },
        amount: { type: Number, required: true },
        orderID: { type: String, required: true },
        transactionID: { type: String, required: true },
        token: { type: String, default: '' },
        status: { type: String, default: 'processing' },
    },
    {
        collection: 'transaction',
        timestamps: true,
    }
);

transactionSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Transaction: Model<ITransaction, {}> = model(
    'Transaction',
    transactionSchema
);
export default Transaction;
