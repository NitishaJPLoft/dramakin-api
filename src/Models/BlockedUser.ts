import { Schema, Model, model } from 'mongoose';
import { IBlockedUsers } from '../Interface/IBlockedUsers';

const properties = {
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
};

const BlockedUserSchema = new Schema(properties, {
    collection: 'blocked_users',
});

BlockedUserSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const blockedUser: Model<IBlockedUsers, {}> = model(
    'BlockedUser',
    BlockedUserSchema
);
export default blockedUser;
