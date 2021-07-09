import { Schema, Model, model } from 'mongoose';
import { IVideoDocument } from '../Interface/IVideoDocument';
const properties = {
    originalVideo: {
        type: String,
        required: true,
    },
    allowDuet: {
        type: Boolean,
        default: true,
    },
    allowTriplet: {
        type: Boolean,
        default: true,
    },
    isProcessed: {
        type: Boolean,
        default: false,
    },
    isFlaged: {
        type: Boolean,
        default: false,
    },
    thumbnails: {
        type: String,
        default: '',
    },
    myLikeStatus: {
        type: Boolean,
        default: false,
    },
    songName: {
        type: String,
        default: '',
    },
    songID: {
        type: String,
        default: '',
    },

    viewCount: {
        type: Number,
        default: 0,
    },

    likeCount: {
        type: Number,
        default: 0,
    },

    dislikeCount: {
        type: Number,
        default: 0,
    },

    shareCount: {
        type: Number,
        default: 0,
    },

    followCount: {
        type: Number,
        default: 0,
    },

    commentCount: {
        type: Number,
        default: 0,
    },
    postedById: {
        type: String,
    },
    postedByName: {
        type: String,
    },
    followuser: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        default: '',
    },
    profileImage: {
        type: String,
    },
    videoType: {
        type: String,
    },
    myShareStatus: {
        type: Boolean,
        default: false,
    },
    myfollwStatus: {
        type: Boolean,
        default: false,
    },
    isUserVerified: {
        type: Boolean,
        default: false,
    },
    availableVideos: [],
    availableAudios: [],
    tags: [],
    mentions: [],
    category: [],
    userLiked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    userDisliked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    uploader: { type: Schema.Types.ObjectId, ref: 'User' },
    userFollowed: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    userUnfollwed: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    userBlocked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    userShared: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    userViewed: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    hlsUrl: { type: String },
    postedByUser: {}
};

const videoSchema = new Schema(properties, {
    collection: 'videos',
    timestamps: true,
});

videoSchema.set('toJSON', {
    transform: (doc, ret, opt) => {
        ret.id = ret._id;
        ret.isFlaged = ret.isFlaged ? 'yes' : 'no';
        ret.isProcessed = ret.isProcessed ? 'yes' : 'no';
        ret.postedByName = ret.postedByName ? ret.postedByName : '';
        ret.videoType = ret.videoType ? ret.videoType : '';
        ret.likeCount = ret.userLiked ? ret.userLiked.length : 0;
        ret.dislikeCount = ret.userDisliked ? ret.userDisliked.length : 0;
        ret.shareCount = ret.userShared ? ret.userShared.length : 0;
        ret.viewCount = ret.userViewed ? ret.userViewed.length : 0;
        ret.commentCount = ret.comments ? ret.comments.length : 0;
        ret.followCount = ret.userFollowed ? ret.userFollowed.length : 0;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Video: Model<IVideoDocument, {}> = model('Video', videoSchema);
export default Video;
