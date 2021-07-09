import Bull, { Queue } from 'bull';
import fs from 'fs';
import axios from 'axios';
import transcodeQueue from './TranscodeVideo';
class DownloadVideo {
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

        this.queue = new Bull('download-video', this.queueOptions);
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
        this.queue.process(async (job, done) => {
            try {
                const fileName = job.data.fileName;
                const dir = job.data.dir;
                const file = fs.createWriteStream(fileName);
                const url = job.data.url;
                const response = await axios.get(url, {
                    responseType: 'stream',
                });
                await response.data.pipe(file);
                done();
                job.moveToCompleted();
                // add job for transcoding
                await transcodeQueue.addToQueue({
                    fileName,
                    dir,
                });
                // process the job
                await transcodeQueue.process();
            } catch (error) {
                console.log('error', error);
                if (error.response) {
                    job.moveToFailed({ message: error.message });
                }
            }
        });
    };
}

export default DownloadVideo;
