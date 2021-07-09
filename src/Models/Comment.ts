import { Schema, Model, model } from 'mongoose';
import { ICommentDocument } from '../Interface/ICommentDocument';
const properties = {
    body: { type: String, required: true },
    video: { type: Schema.Types.ObjectId, ref: 'Video' },
    like: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isLiked: { type: Boolean, default: false },
    commentor: { type: Schema.Types.ObjectId, ref: 'User' },
};

const commentSchema = new Schema(properties, {
    collection: 'comments',
    timestamps: true,
});

commentSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Comment: Model<ICommentDocument, {}> = model('Comment', commentSchema);
export default Comment;
