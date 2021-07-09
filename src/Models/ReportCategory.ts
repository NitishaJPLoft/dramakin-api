import { Schema, model, Model } from 'mongoose';
import { IReportCategory } from '../Interface/IReportCategory';
const reportSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
    },
    {
        collection: 'report_categories',
        timestamps: true,
    }
);

reportSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const ReportCategory: Model<IReportCategory, {}> = model(
    'ReportCategory',
    reportSchema
);
export default ReportCategory;
