import { Schema, Model, model } from 'mongoose';
import { IUserDocument } from '../Interface/IUserDocument';
export const userSchema: Schema = new Schema(
    {
        firstName: {
            type: String,
            default: '',
        },
        lastName: {
            type: String,
            default: '',
        },
        middleName: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },

        password: {
            type: String,
        },

        mobile: {
            type: String,
            unique: true,
            sparse: true,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isMobileVerified: {
            type: Boolean,
            default: false,
        },
        isUserVerified: {
            type: Boolean,
            default: false,
        },
        isFollow: {
            type: Boolean,
            default: false,
        },
        isBlocked: { type: Boolean, default: false },

        role: {
            type: String,
            default: 'user',
        },

        image: {
            type: String,
            default: 'http://dramaking.in/images/icons/logo.png',
        },

        followers: {
            type: Number,
            default: 0,
        },
        following: {
            type: Number,
            default: 0,
        },

        about: {
            type: String,
            default: '',
        },

        username: {
            type: String,
            unique: true,
            required: true,
        },

        socialProfile: {
            youtube: { type: String, default: '' },
            instagram: { type: String, default: '' },
        },

        fcm: {
            token: { type: String, default: '' },
            plateform: { type: String, default: '' },
        },
        likes: {
            type: Number,
            default: 0,
        },
        video: {
            type: String,
            default: '',
        },

        accountStatus: {
            type: Boolean,
            default: 1,
        },
        likedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        uploadedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        dislikedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        follwingUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        blockedUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        usersBlockedMe: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        follwersUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        sharedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        viewedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video',
            },
        ],
        videoPreference: {
            type: Schema.Types.ObjectId,
            ref: 'VideosPreference',
        },
        name: String,
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    },
    { timestamps: true }
);

const getname = ret => {
    const firstName = ret.firstName ? ret.firstName : ' ';
    const middleName = ret.middleName ? ret.middleName : ' ';
    const lastName = ret.lastName ? ret.lastName : ' ';
    const name = firstName + ' ' + middleName + ' ' + lastName;
    return name.trim();
};
userSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        ret.name = getname(ret);
        ret.email = ret.email ? ret.email : '';
        ret.mobile = ret.mobile ? ret.mobile : '';
        ret.isMobileVerified = ret.isMobileVerified ? 'yes' : 'no';
        ret.isEmailVerified = ret.isEmailVerified ? 'yes' : 'no';
        ret.accountStatus = ret.accountStatus ? 'active' : 'inactive';
        //  ret.likes = ret.likedVideos ? ret.likedVideos.length : 0;
        ret.followers = ret.follwersUsers ? ret.follwersUsers.length : 0;
        ret.following = ret.follwingUsers ? ret.follwingUsers.length : 0;
        return ret;
    },
});

const User: Model<IUserDocument, {}> = model('User', userSchema);
export default User;
