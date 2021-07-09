import mongoose from 'mongoose';

const url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

mongoose.connection.on('connected', () => {
    console.log('Mongo has connected succesfully');
});
mongoose.connection.on('reconnected', () => {
    console.log('Mongo has reconnected');
});
mongoose.connection.on('error', error => {
    console.log('Mongo connection has an error', error);
    mongoose.disconnect();
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongo connection is disconnected');
});

export { mongoose as db };
