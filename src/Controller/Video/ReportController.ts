import { Request, Response, NextFunction } from 'express';
import FlagModel from '../../Models/Flag';
import CategoryModel from '../../Models/ReportCategory';
import VideoModel from '../../Models/Video';

/**
 * Video Report Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class ReportController {
    req: any;
    res: Response;
    next: NextFunction;

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
    }

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

            const reports = await FlagModel.find({})
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', 1]]);
            const count = await FlagModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'video flag report list',
                    reports,
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    next: parseInt(page) < total ? parseInt(page) + 1 : null,
                    prev:
                        parseInt(page) <= total && parseInt(page) !== 1
                            ? parseInt(page) - 1
                            : null,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    chats: [],
                },
            });
        }
    };

    create = async () => {
        try {
            const categoryID = this.req.body.categoryID;
            const category = await CategoryModel.findById(categoryID);
            if (!category)
                throw new Error('This report category doesnt exsist');
            const videoID = this.req.body.videoID;
            const video = await VideoModel.findById(videoID);
            if (!video) throw new Error('This video doesnt exsist');
            const userID = this.req.uid;
            if (!categoryID || !videoID)
                throw new Error(
                    'Please provide categoryID and videoID in request body'
                );
            const report = await new FlagModel({
                categoryID,
                videoID,
                userID,
            }).save();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message:
                        'We have recived your request. Our team will review it',
                    report,
                },
            });
        } catch (error) {
            console.log('hhhh', error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    report: {},
                },
            });
        }
    };

    show = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const report = await FlagModel.findById(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'video flag report',
                    report,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    report: {},
                },
            });
        }
    };

    update = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const report = await FlagModel.findOneAndUpdate(
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
                    message: 'video flag report updated',
                    report,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    report: {},
                },
            });
        }
    };

    delete = async () => {
        try {
            const id = this.req.params.id;
            console.log(id);
            if (!id) throw new Error('Please provide id');
            const report = await FlagModel.findById(id);
            if (!report) throw new Error('invalid id');
            report.deleteOne();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'deleted successfully',
                },
            });
        } catch (error) {
            console.log('jjjjjjj', error);
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

export default ReportController;
