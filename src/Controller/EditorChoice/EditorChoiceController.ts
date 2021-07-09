import { Request, Response, NextFunction } from 'express';
import EditorChoiceModel from '../../Models/EditorChoice';
import EditorCategoryModel from '../../Models/EditorCategory';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

class EditorChoiceController {
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
            if (!this.req.files || Object.keys(this.req.files).length === 0)
                throw new Error('please provide audio file');
            const { categoryID, name, singer } = this.req.body;
            if (!categoryID) throw new Error('please provide category id');
            const category = await EditorCategoryModel.findById(categoryID);
            if (!category) throw new Error('please provide valid category id');
            const song = this.req.files.song;
            if (song.mimetype !== 'audio/mpeg')
                throw new Error('please provide mp3 file');
            const path = 'editor/' + uuidv4() + '/';
            const songpath = path + song.name;
            const songMimeType =
                song && song.mimetype ? song.mimetype : 'audio/mpeg';
            const songUrl = this.getCdnUrl(songpath);
            await this.uploadObject({
                Bucket: this.bucket,
                Key: songpath,
                Body: song.data,
                ACL: 'public-read',
                ContentType: songMimeType,
                ContentDisposition: 'inline',
            });
            await new EditorChoiceModel({
                name,
                singer,
                category: categoryID,
                song: songUrl,
            }).save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice song added',
                    categoryID,
                    name,
                    singer,
                    songMimeType,
                    songUrl,
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

    index = async () => {
        try {
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            if (this.req.query.categoryID) {
                const songs = await EditorChoiceModel.find({
                    category: this.req.query.categoryID,
                })
                    .populate('category')
                    .skip(parseInt(limit) * (parseInt(page) - 1))
                    .limit(parseInt(limit))
                    .sort([['createdAt', -1]]);
                const count = await EditorChoiceModel.countDocuments({});
                const total = Math.ceil(count / limit);
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice songs',
                        songs,
                    },
                    pagination: {
                        total,
                        page: parseInt(page),
                        next:
                            parseInt(page) < total ? parseInt(page) + 1 : null,
                        prev:
                            parseInt(page) <= total && parseInt(page) !== 1
                                ? parseInt(page) - 1
                                : null,
                    },
                });
            } else {
                const songs = await EditorChoiceModel.find({})
                    .populate('category')
                    .skip(parseInt(limit) * (parseInt(page) - 1))
                    .limit(parseInt(limit))
                    .sort([['createdAt', -1]]);
                const count = await EditorChoiceModel.countDocuments({});
                const total = Math.ceil(count / limit);
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Editor choice songs',
                        songs,
                    },
                    pagination: {
                        total,
                        page: parseInt(page),
                        next:
                            parseInt(page) < total ? parseInt(page) + 1 : null,
                        prev:
                            parseInt(page) <= total && parseInt(page) !== 1
                                ? parseInt(page) - 1
                                : null,
                    },
                });
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    songs: [],
                },
                pagination: {},
            });
        }
    };

    show = async () => {
        try {
            const { categoryID } = this.req.query;

            const songs = await EditorChoiceModel.find({
                category: categoryID,
            });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice songs',
                    songs,
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
            const category = await EditorChoiceModel.findById(id);
            category.name = name;
            await category.save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Editor choice category update',
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

    delete = async () => {
        try {
            const { id } = this.req.params;
            if (!id) throw new Error('Please provide category id');
            await EditorChoiceModel.findByIdAndDelete(id);
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

export default EditorChoiceController;
