import { Request, Response, NextFunction } from 'express';
import EditorCategoryModel from '../../Models/EditorCategory';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
class EditorCategoryController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: string;
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

    add = async () => {
        try {
            const { name } = this.req.body;
            if (!name) throw new Error('Please provide category name');
            if (this.req.files && this.req.files.image) {
                const image = this.req.files.image;
                const path = 'editor/image/' + uuidv4() + '/';
                const imagepath = path + image.name;
                const imageMimeType =
                    image && image.mimetype ? image.mimetype : 'image/png';
                const imageUrl = this.getCdnUrl(imagepath);
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: imagepath,
                    Body: image.data,
                    ACL: 'public-read',
                    ContentType: imageMimeType,
                    ContentDisposition: 'inline',
                });
                const category = await new EditorCategoryModel({
                    name,
                    image: imageUrl,

                    ...this.req.body,
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice category added',
                        category,
                    },
                });
            } else {
                const category = await new EditorCategoryModel({
                    name,
                    ...this.req.body,
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice category added',
                        category,
                    },
                });
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    category: {},
                },
            });
        }
    };

    index = async () => {
        try {
            const categories = await EditorCategoryModel.find({});
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice categories',
                    categories,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    categories: [],
                },
            });
        }
    };

    show = async () => {
        try {
            const { id } = this.req.params;
            if (!id) throw new Error('Please provide category id');
            const category = await EditorCategoryModel.findById(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice category details',
                    category,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    category: {},
                },
            });
        }
    };

    update = async () => {
        try {
            const { id } = this.req.params;
            if (!id) throw new Error('Please provide category id');
            if (this.req.files && this.req.files.image) {
                const image = this.req.files.image;
                const path = 'editor/image/' + uuidv4() + '/';
                const imagepath = path + image.name;
                const imageMimeType =
                    image && image.mimetype ? image.mimetype : 'image/png';
                const imageUrl = this.getCdnUrl(imagepath);
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: imagepath,
                    Body: image.data,
                    ACL: 'public-read',
                    ContentType: imageMimeType,
                    ContentDisposition: 'inline',
                });

                const category = await EditorCategoryModel.findOneAndUpdate(
                    { _id: id },
                    {
                        image: imageUrl,

                        ...this.req.body,
                    },
                    { new: true }
                );
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice category updated',
                        category,
                    },
                });
            } else {
                const category = await EditorCategoryModel.findOneAndUpdate(
                    { _id: id },
                    {
                        ...this.req.body,
                    },
                    { new: true }
                );
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice category updated',
                        category,
                    },
                });
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    category: {},
                },
            });
        }
    };

    delete = async () => {
        try {
            const { id } = this.req.params;
            if (!id) throw new Error('Please provide category id');
            await EditorCategoryModel.findByIdAndDelete(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice category deleted',
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

export default EditorCategoryController;
