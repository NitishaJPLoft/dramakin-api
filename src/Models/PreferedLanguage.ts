import { Schema, model, Model } from 'mongoose';
import { IPreferedLanguage } from '../Interface/IPreferedLanguage';
const preferedLanguageSchema = new Schema(
    {
        language: { type: Schema.Types.ObjectId, ref: 'Language' },
        selected: { type: Boolean, default: true },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        collection: 'prefered_languages',
        timestamps: true,
    }
);

preferedLanguageSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const PreferedLanguage: Model<IPreferedLanguage, {}> = model(
    'PreferedLanguage',
    preferedLanguageSchema
);
export default PreferedLanguage;
