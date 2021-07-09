import mongoose from 'mongoose';
import User from './User';
import Otp from './Otp';
import Video from './Video';
import Job from './Job';
import VideosPreference from './VideosPreference';
import Comment from './Comment';
import Conversations from './Conversations';
import Chat from './Chat';
import LastMessage from './LastMessage';
import Slider from './Slider';
import Spotify from './Spotify';
import Crown from './Crown';
import Wallet from './Wallet';
import Transfer from './Transfer';
import Transaction from './Transaction';
import Flag from './Flag';
import ReportCategory from './ReportCategory';

/**
 * Make Mongo DB connection URI
 */
const makeDbUri = () => {
    return `mongodb://${process.env.MONGO_HOST} : ${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;
};
const connectDb = () => {
    return mongoose.connect(makeDbUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    });
};

const models = {
    User,
    Otp,
    Job,
    Video,
    VideosPreference,
    Comment,
    Conversations,
    Chat,
    LastMessage,
    Slider,
    Spotify,
    Crown,
    Wallet,
    Transfer,
    Transaction,
    ReportCategory,
    Flag,
};

export { connectDb };

export default models;
