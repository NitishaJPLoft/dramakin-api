import { Schema, Model, model } from 'mongoose';
import { IJobDocument } from '../Interface/IJobDocument';
const jobProperties = {
    job: {
        type: Object,
    },

    isProcessed: {
        type: Boolean,
        default: false,
    },
};

const jobSchema = new Schema(jobProperties, {
    collection: 'jobs',
});

jobSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Job: Model<IJobDocument, {}> = model('Job', jobSchema);
export default Job;
