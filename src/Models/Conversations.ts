import { Schema, model, Model } from 'mongoose';
import { IConversations } from '../Interface/IConversations';
const conversationsSchema = new Schema(
    {
        users: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                isOnline: { type: Boolean, default: false },
                isInitiatedConversation: { type: Boolean, default: false },
                unreadCount: { type: Number, default: 0 },
                _id: false,
            },
        ],
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        me: { type: Schema.Types.ObjectId, ref: 'User' },
        messages: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
        totalchats: { type: Number, default: 0 },
        isSoftDeleted: { type: Boolean, default: false },
        softDeletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        collection: 'conversations',
        timestamps: true,
    }
);

conversationsSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        ret.totalchats = ret.messages.length;
        ret.softDeletedBy = ret.softDeletedBy ? ret.softDeletedBy : '';
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Conversations: Model<IConversations, {}> = model(
    'Conversations',
    conversationsSchema
);
export default Conversations;
