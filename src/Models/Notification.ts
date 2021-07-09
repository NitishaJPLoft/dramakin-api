import { Schema, model, Model } from 'mongoose';
import { INotification } from '../Interface/INotification';
const notificationShema = new Schema(
    {
        //video , user, comment, chat, crown
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, default: '' },
        title: { type: String, default: '' },
        action: { type: String, default: '' },
        intent: { type: String, default: '' },
        targetID: { type: String, default: '' },
        targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
        imageUrl: { type: String, default: '' },
        isRead: { type: Boolean, default: false },
    },
    {
        collection: 'notifications',
        timestamps: true,
    }
);

notificationShema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Notificatio: Model<INotification, {}> = model(
    'Notification',
    notificationShema
);
export default Notificatio;
