import Bull, { Queue } from 'bull';
import VideoModel from '../Models/Video';
import s3 from './DoSpace';
import fs from 'fs';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

class Job {
    queueOptions: any;
    jobOptions: any;
    queue: Queue;

    constructor() {
        this.queueOptions = {
            redis: {
                host: process.env.REDIS_SERVER
                    ? process.env.REDIS_SERVER
                    : `127.0.0.1`,
                port: process.env.REDIS_PORT ? process.env.REDIS_PORT : '6379',
            },
        };

        this.jobOptions = {
            attempts: process.env.QUEUE_ATTEMPS ? process.env.QUEUE_ATTEMPS : 2,
        };

        this.queue = new Bull('dramaking', this.queueOptions);
    }

    addToQueue = async (data: object) => {
        const job = await this.queue.add(data, this.jobOptions);
        return job;
    };

    getJobs = async (options?: any) => {
        const jobs = await this.queue.getJobs(options);
        return jobs;
    };

    uploadVideo = async () => {
        this.queue.process(async (job, done) => {
            try {
                const file = job.data.file;
                const uid = job.data.uid;
                await s3.uploadObject({
                    Bucket: 'dramaking',
                    Key: file.name,
                    Body: file.data,
                    ACL: 'public-read',
                    ContentType: file.mimetype ? file.mimetype : 'video/mpeg',
                    ContentDisposition: 'inline',
                });

                const url = s3.getBucketUrl() + '/' + file.name;

                // update in db

                await new VideoModel({
                    originalVideo: url,
                    postedBy: uid,
                }).save();

                done();
            } catch (error) {
                done(new Error(error.message));
            }
        });
    };
    processVideo = async () => {
        this.queue.process((job, done) => {
            try {
                const fileName = job.data.fileName;
                const dir = job.data.dir;
                const command = ffmpeg();
                command
                    // .input(fs.createReadStream(fileName))
                    .input(fileName)
                    .inputFPS(29.7)
                    .withNativeFramerate()
                    .on('end', function () {
                        console.log('file has been converted succesfully');
                    })

                    .on('error', function (err, stdout, stderr) {
                        console.log('stderr', stderr);
                        console.log('stdout', stdout);
                        console.log('an error happened: ' + err.message);
                    })

                    .save(dir + '/' + 'your_target.m3u8');
                done(new Error('error transcoding'));
            } catch (error) {
                console.log('error', error);
                if (error.response) {
                    job.moveToFailed({ message: error.response });
                }
            }
        });
    };

    downloadVideo = async () => {
        this.queue.process(async (job, done) => {
            try {
                const fileName = job.data.fileName;
                const file = fs.createWriteStream(fileName);
                const url = job.data.url;
                const response = await axios.get(url, {
                    responseType: 'stream',
                });
                response.data.pipe(file);
                done();
                job.moveToCompleted();
            } catch (error) {
                console.log('error', error);
                if (error.response) {
                    job.moveToFailed({ message: error.message });
                }
            }
        });
    };
}

export default Job;
