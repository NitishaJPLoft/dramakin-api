import { Schema, model, Model } from 'mongoose';
import { ILastMessage } from '../Interface/ILastMessage';
const lastMessageSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        lastmessage: { type: String, default: '' },
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversations' },
    },
    {
        collection: 'lastmessages',
        timestamps: true,
    }
);

lastMessageSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Chat: Model<ILastMessage, {}> = model('LastMessage', lastMessageSchema);
export default Chat;
