import { Schema, model, Model } from 'mongoose';
import { IOrder } from '../Interface/IOrder';

const orderSchema = new Schema(
    {
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        receipt: { type: String },
    },
    {
        collection: 'order',
        timestamps: true,
    }
);

orderSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.orderID = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Order: Model<IOrder, {}> = model('Order', orderSchema);
export default Order;
