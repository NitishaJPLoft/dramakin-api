import { Schema, model, Model } from 'mongoose';
import { ILanguages } from '../Interface/ILanguages';
const languageSchema = new Schema(
    {
        language: { type: String, required: true },
    },
    {
        collection: 'languages',
        timestamps: true,
    }
);

languageSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Language: Model<ILanguages, {}> = model('Language', languageSchema);
export default Language;
