import { Schema, model, Model } from 'mongoose';
import { ISpotify } from '../Interface/ISpotify';
const spotifySchema = new Schema(
    {
        access_token: { type: String },
        token_type: { type: String },
        expires_in: { type: String },
        generated_at: { type: String },
        refresh_token: { type: String },
        scope: { type: String },
        isManuallyAdded: { type: Boolean, default: true },
    },
    {
        collection: 'spotify',
        timestamps: true,
    }
);

spotifySchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const Spotify: Model<ISpotify, {}> = model('Spotify', spotifySchema);
export default Spotify;
