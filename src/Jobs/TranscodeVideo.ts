import Bull, { Queue } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import logger from '../utilis/logger';

class TranscodeVideo {
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
            attempts: process.env.QUEUE_ATTEMPS ? process.env.QUEUE_ATTEMPS : 3,
        };

        this.queue = new Bull('transcode-video', this.queueOptions);
    }

    addToQueue = async (data: object) => {
        const job = await this.queue.add(data, this.jobOptions);
        return job;
    };

    getJobs = async (options?: any) => {
        const jobs = await this.queue.getJobs(options);
        return jobs;
    };

    process = async () => {
        this.queue.process((job, done) => {
            try {
                const fileName = job.data.fileName;
                const dir = job.data.dir;
                logger.info({
                    message: 'recived job ' + job.id,
                    data: job.data,
                });
                const command = ffmpeg();
                command
                    // .input(fs.createReadStream(fileName))
                    .input(fileName)
                    .format('dash')
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .audioChannels(2)
                    .audioFrequency(44100)
                    .outputOptions([
                        '-preset veryfast',
                        '-keyint_min 60',
                        '-g 60',
                        '-sc_threshold 0',
                        '-profile:v main',
                        '-use_template 1',
                        '-use_timeline 1',
                        '-b_strategy 0',
                        '-bf 1',
                        '-map 0:a',
                        '-b:a 96k',
                    ])
                    .on('end', () => {
                        logger.info({
                            message: 'job completed ' + job.id,
                        });
                        done();
                        job.moveToCompleted();
                    })
                    .on('error', (err, stdout, stderr) => {
                        console.log('stderr', stderr);
                        console.log('stdout', stdout);
                        console.log('an error happened: ' + err.message);
                        logger.error({
                            message: 'error while processing job ' + job.id,
                            stdout,
                            err,
                        });
                        done(new Error(err.message));
                    })

                    .save(dir + '/' + 'your_target.m3u8');
            } catch (error) {
                console.log('error', error);
                if (error.response) {
                    job.moveToFailed({ message: error.response });
                }
                logger.error({
                    message: 'error while processing job ' + job.id,
                    error,
                });
            }
        });
    };
}

export default new TranscodeVideo();
