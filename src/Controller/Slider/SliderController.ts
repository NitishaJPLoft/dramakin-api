import { Request, Response, NextFunction } from 'express';
import SliderModel from '../../Models/Slider';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class SliderController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: any;
    region: string;
    s3: S3;
    endpoint: string;
    cdn: string;

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
    }
    getCdnUrl = path => {
        return this.cdn + '/' + path;
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
    };
    index = async () => {
        try {
            const sliders = await SliderModel.find({})
                .limit(4)
                .sort([['createdAt', -1]]);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'slider list',
                    sliders,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    sliders: [],
                },
            });
        }
    };

    create = async () => {
        try {
            const { hashtag, viewCount } = this.req.body;

            if (!hashtag || !viewCount)
                throw new Error(
                    'please provide  hashtag, viewCount and image as multipart'
                );
            let url;
            if (this.req.files && this.req.files.image) {
                const image = this.req.files.image;
                const path = 'sliders/' + uuidv4() + '/';
                const imagePath = path + 'thumbnail/' + uuidv4() + image.name;
                const mimeType =
                    image && image.mimetype ? image.mimetype : 'image/jpeg';
                // const url = s3.getBucketUrl() + '/' + imagePath;
                url = this.getCdnUrl(imagePath);
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: imagePath,
                    Body: image.data,
                    ACL: 'public-read',
                    ContentType: mimeType,
                    ContentDisposition: 'inline',
                });

                await new SliderModel({
                    image: url,
                    hashtag,
                    viewCount,
                }).save();
            } else {
                await new SliderModel({
                    hashtag,
                    viewCount,
                }).save();
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'slider created',
                    bucket: this.bucket,
                    url,
                },
            });
        } catch (error) {
            console.log('error', error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    };

    show = async () => {
        try {
            const { id } = this.req.params;
            const slider = await SliderModel.findById(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'slider',
                    slider,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    slider: {},
                },
            });
        }
    };

    delete = async () => {
        try {
            const { id } = this.req.params;
            const slider: any = await SliderModel.findById(id);
            await slider.remove();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'slider deleted',
                },
            });
        } catch (error) {
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

export default SliderController;
