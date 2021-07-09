import { Schema, Model, model } from 'mongoose';
import { IFavorite } from '../Interface/IFavorite';

const properties = {
    isFavorite: { type: Boolean, default: true },
    songID: { type: String },
    songName: { type: String, default: '' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
};

const FavoriteSchema = new Schema(properties, {
    collection: 'favorites',
});

FavoriteSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Favorite: Model<IFavorite, {}> = model('Favorite', FavoriteSchema);
export default Favorite;
