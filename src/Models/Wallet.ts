import { Schema, model, Model } from 'mongoose';
import { IWallet } from '../Interface/IWallet';
const walletSchema = new Schema(
    {
        balance: { type: Number, required: true },
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        collection: 'wallet',
        timestamps: true,
    }
);

walletSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Wallet: Model<IWallet, {}> = model('Wallet', walletSchema);
export default Wallet;
