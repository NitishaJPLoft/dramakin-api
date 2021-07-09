import { Schema, model, Model } from 'mongoose';
import { IFlag } from '../Interface/IFlag';
const flagSchema = new Schema(
    {
        categoryID: { type: Schema.Types.ObjectId, ref: 'ReportCategory' },
        videoID: { type: Schema.Types.ObjectId, ref: 'Video' },
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
        isApproved: { type: Boolean, default: false },
    },
    {
        collection: 'flag_report',
        timestamps: true,
    }
);

flagSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Flag: Model<IFlag, {}> = model('Flag', flagSchema);
export default Flag;
