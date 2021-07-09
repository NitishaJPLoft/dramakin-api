import { Schema, model, Model } from 'mongoose';
import { IVerification } from '../Interface/IVerification';
const verificationSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        document: { type: String },
        type: { type: String },
    },
    {
        collection: 'verification_documents',
        timestamps: true,
    }
);

verificationSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Verification: Model<IVerification, {}> = model(
    'Verification',
    verificationSchema
);
export default Verification;
