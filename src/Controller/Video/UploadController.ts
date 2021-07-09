import { Request, Response, NextFunction } from 'express';
import AWS, { S3, ElasticTranscoder } from 'aws-sdk';
import VideoModel from '../../Models/Video';
import UserModel from '../../Models/User';
import MusicModel from '../../Models/Music';
import { v4 as uuidv4 } from 'uuid';
import { getSongIDAndType } from '../../Helper/utilis';
class UploadController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: string;
    region: string;
    s3: S3;
    endpoint: string;
    cdn: string;
    transcoder: ElasticTranscoder;

    /**
     * Constructor
     * @param req express.Request
     * @param res  express.Response
     * @param next   express.NextFunction
     */

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.bucket = process.env.AWS_S3_BUCKET_NAME;
        this.region = process.env.AWS_S3_REGION;
        this.endpoint = process.env.AWS_S3_ENDPOINT;
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        });
        this.cdn = process.env.AWS_CLOUDFRONT_DOMAIN;
        this.transcoder = new AWS.ElasticTranscoder({
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
            region: this.region,
        });
    }

    getCdnUrl = path => {
        return this.cdn + '/' + path;
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
    };

    upload = async () => {
        try {
            if (!this.req.files || Object.keys(this.req.files).length === 0)
                throw new Error('please provide files');
            const video = this.req.files.video;
            const thumbnail = this.req.files.thumbnail;
            const path = 'videos/' + uuidv4() + '/';
            const videopath = path + uuidv4() + video.name;
            const thumbnailPath =
                path + 'thumbnail/' + uuidv4() + thumbnail.name;
            const videoMimeType =
                video && video.mimetype ? video.mimetype : 'video/mpeg';
            // const thumbnailMimeType =
            //     thumbnail && thumbnail.mimetype
            //         ? thumbnail.mimetype
            //         : 'image/jpeg';
            const mp3 = this.req.files.mp3;

            // check which song type is
            const songID = this.req.body.songID;
            const { id, type } = getSongIDAndType(songID);
            console.log('id', id, 'type', type);
            const uploader: any = await UserModel.findById(this.req.uid);
            await this.uploadObject({
                Bucket: this.bucket,
                Key: videopath,
                Body: video.data,
                ACL: 'public-read',
                ContentType: videoMimeType,
                ContentDisposition: 'inline',
            });
            await this.uploadObject({
                Bucket: this.bucket,
                Key: thumbnailPath,
                Body: thumbnail.data,
                ACL: 'public-read',
                // ContentType: thumbnailMimeType,
                ContentType: 'image/jpeg',
                ContentDisposition: 'inline',
            });
            //const videoUrl = this.getCdnUrl(videopath);
            const thumbnailurl = this.getCdnUrl(thumbnailPath);
            const postedById = this.req.uid;
            const postedByName = this.req.user.username;
            const inputKey = videopath;
            const outputKey = inputKey.substring(0, inputKey.lastIndexOf('.'));
            const hlsUrl = this.getCdnUrl(`hls/${outputKey}.m3u8`);
            const mp4WatermarkedUrl = this.getCdnUrl(
                `watermarked/${outputKey}`
            );
            // mp4 watermark
            await this.transcoder
                .createJob({
                    PipelineId: '1607666300406-140s9v',
                    Input: {
                        Key: inputKey,
                        AspectRatio: 'auto',
                        FrameRate: 'auto',
                        Resolution: 'auto',
                        Container: 'auto',
                        Interlaced: 'auto',
                    },

                    OutputKeyPrefix: 'watermarked/',
                    Output: {
                        Key: outputKey,
                        // PresetId: '1351620000001-200040',
                        //PresetId: '1607354281492-7n3lu8',
                        PresetId: '1607667787289-xgmtjm',
                        Watermarks: [
                            {
                                InputKey: 'logo/dk-logo1.png',
                                PresetWatermarkId: 'TopLeft',
                            },
                        ],
                    },
                })
                .promise();

            // HLS
            await this.transcoder
                .createJob({
                    PipelineId: '1602745577713-2vlftw',
                    Input: {
                        Key: inputKey,
                        AspectRatio: 'auto',
                        FrameRate: 'auto',
                        Resolution: 'auto',
                        Container: 'auto',
                        Interlaced: 'auto',
                    },

                    OutputKeyPrefix: 'hls/',
                    Output: {
                        Key: outputKey,
                        PresetId: '1607598838497-tidce1',
                        SegmentDuration: '2',
                        // Watermarks: [
                        //     {
                        //         InputKey: 'logo/dk-logo1.png',
                        //         PresetWatermarkId: 'TopLeft',
                        //     },
                        // ],
                    },
                })
                .promise();

            // upload music

            if (mp3) {
                const mp3Path = 'mp3/' + uuidv4() + '/' + mp3.name;
                const mp3Url = this.getCdnUrl(mp3Path);
                const songName = this.req.body.songName
                    ? this.req.body.songName
                    : 'unknown';
                const singer = this.req.body.songName
                    ? this.req.body.songName
                    : 'unknown';
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: mp3Path,
                    Body: mp3.data,
                    ACL: 'public-read',
                    ContentType: 'audio/mpeg',
                    ContentDisposition: 'inline',
                });
                const videodb = await new VideoModel({
                    ...this.req.body,
                    originalVideo: mp4WatermarkedUrl,
                    postedById,
                    postedByName,
                    profileImage: this.req.user.image,
                    thumbnails: thumbnailurl,
                    description: this.req.body.description,
                    songName: songName,
                    songID: type === 'local' || type === 'camera' ? id : songID,
                    tags: this.req.body.tags,
                    category: this.req.body.category,
                    uploader,
                    hlsUrl,
                }).save();

                console.log(' videodb', videodb);

                // save music model
                const mm = await new MusicModel({
                    video: videodb,
                    user: uploader,
                    url: mp3Url,
                    songName,
                    songID: type === 'local' || type === 'camera' ? id : songID,
                    singer,
                }).save();

                console.log('mm', mm);
                console.log('mp3url', mp3Url);
                uploader.uploadedVideos.push(videodb);
                await uploader.save();
            } else {
                // update in db
                const videodb = await new VideoModel({
                    ...this.req.body,
                    originalVideo: mp4WatermarkedUrl,
                    postedById,
                    postedByName,
                    profileImage: this.req.user.image,
                    thumbnails: thumbnailurl,
                    description: this.req.body.description,
                    songName: this.req.body.songName,
                    songID: type === 'local' || type === 'camera' ? id : songID,
                    tags: this.req.body.tags,
                    category: this.req.body.category,
                    uploader,
                    hlsUrl,
                }).save();

                console.log('videodb', videodb);
                uploader.uploadedVideos.push(videodb);
                await uploader.save();
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'video uploaded succesfully',
                    mp4WatermarkedUrl,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    };
}

export default UploadController;
