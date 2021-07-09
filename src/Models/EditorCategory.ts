import { Schema, model, Model } from 'mongoose';
import { IEditorCategory } from '../Interface/IEditorCategory';
const editorCategorySchema = new Schema(
    {
        name: { type: String },
        image: {
            type: String,
            default: 'http://dramaking.in/images/icons/logo.png',
        },
    },
    {
        collection: 'editor_categories',
        timestamps: true,
    }
);

editorCategorySchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const EditorCategory: Model<IEditorCategory, {}> = model(
    'EditorCategory',
    editorCategorySchema
);
export default EditorCategory;
