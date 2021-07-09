import { Schema, model, Model } from 'mongoose';
import { IMusic } from '../Interface/IMusic';
const musicSchema = new Schema(
    {
        video: { type: Schema.Types.ObjectId, ref: 'Video' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        url: { type: String, default: null },
        songID: { type: String, default: 'unknown' },
        songName: { type: String, default: 'unknwon' },
        singer: { type: String, default: 'unknwon' },
        thumbnail: {
            type: String,
            default: 'http://dramaking.in/images/icons/logo.png',
        },
    },
    {
        collection: 'musics',
        timestamps: true,
    }
);

musicSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Music: Model<IMusic, {}> = model('Music', musicSchema);
export default Music;
