import { Schema, model, Model } from 'mongoose';
import { IHashtagVideoViews } from '../Interface/IHashtagVideoViews';
const hashtagVideoViewsSchema = new Schema(
    {
        hashtag: { type: String, default: '' },
        viewCount: { type: Number, default: 0 },
        videoCount: { type: Number, default: 0 },
    },
    {
        collection: 'hashtag_video_views',
        timestamps: true,
    }
);

hashtagVideoViewsSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const HashtagVideoViews: Model<IHashtagVideoViews, {}> = model(
    'HashtagVideoViews',
    hashtagVideoViewsSchema
);
export default HashtagVideoViews;
