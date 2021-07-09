import { Schema, model, Model } from 'mongoose';
import { ISlider } from '../Interface/ISlider';
const sliderSchema = new Schema(
    {
        hashtag: { type: String, required: true },
        type: { type: String, default: 'trending' },
        viewCount: { type: Number, default: 0 },
        image: {
            type: String,
            default: 'https://d2gez1ow03dagn.cloudfront.net/sliders/slider.png',
        },
    },
    { timestamps: true }
);

sliderSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Slider: Model<ISlider, {}> = model('Slider', sliderSchema);
export default Slider;
