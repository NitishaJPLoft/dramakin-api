import { Schema, model, Model } from 'mongoose';
import { IClearedChat } from '../Interface/IClearedChat';
const clearedChatSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        conversationID: { type: Schema.Types.ObjectId, ref: 'Conversations' },
        chat: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
       
    },
    {
        collection: 'cleared_chats',
        timestamps: true,
    }
);

clearedChatSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const ClearedChat: Model<IClearedChat, {}> = model('ClearedChat',clearedChatSchema);
export default ClearedChat;
