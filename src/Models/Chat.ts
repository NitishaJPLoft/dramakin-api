import { Schema, model, Model } from 'mongoose';
import { IChat } from '../Interface/IChat';
const chatSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        lastmessage: { type: String, default: '' },
        message: { type: String, required: true },
        isOnline: { type: Boolean, default: false },
        unreadCount: { type: Number, default: 0 },
        type: { type: String, default: 'sender' },
        last_messaged_at: { type: String, default: '' },
        senderID: { type: Schema.Types.ObjectId, ref: 'User' },
        receiverID: { type: Schema.Types.ObjectId, ref: 'User' },
        conversationID: { type: Schema.Types.ObjectId, ref: 'Conversations' },
        isRead: { type: Boolean, default: false },
        hideSendermessage : { type: Boolean, default: false },
        hideForUser : {type: String, default: false}
    },
    {
        collection: 'chats',
        timestamps: true,
    }
);

chatSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Chat: Model<IChat, {}> = model('Chat', chatSchema);
export default Chat;
