import { Schema, model, Model } from 'mongoose';
import { IEditorChoice } from '../Interface/IEditorChoice';
const editorChoiceSchema = new Schema(
    {
        name: { type: String, default: 'unknown' },
        song: { type: String },
        singer: { type: String, default: 'unknown' },
        category: { type: Schema.Types.ObjectId, ref: 'EditorCategory' },
        thumbnail: {
            type: String,
            default: 'http://dramaking.in/images/icons/logo.png',
        },
    },
    {
        collection: 'editor_choices',
        timestamps: true,
    }
);

editorChoiceSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const EditorChoice: Model<IEditorChoice, {}> = model(
    'EditorChoice',
    editorChoiceSchema
);
export default EditorChoice;
