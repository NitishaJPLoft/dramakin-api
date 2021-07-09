import { Request, Response, NextFunction } from 'express';
import ReportCategoryModel from '../../Models/ReportCategory';

/**
 * Video Report Category Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class ReportCategoryController {
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

            const categories = await ReportCategoryModel.find({})
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', 1]]);
            const count = await ReportCategoryModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Report category list',
                    categories,
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
                    categories: [],
                },
            });
        }
    };

    create = async () => {
        try {
            const name = this.req.body.name;
            const description = this.req.body.description;

            if (!name || !description)
                throw new Error(
                    'Please provide name and description in request body'
                );
            const category = await new ReportCategoryModel({
                name,
                description,
            }).save();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'report category created',
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

    show = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const category = await ReportCategoryModel.findById(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'report category',
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
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const category = await ReportCategoryModel.findOneAndUpdate(
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
                    message: 'report category updated',
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
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const category: any = await ReportCategoryModel.findById(id);
            category.deleteOne();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'report category deleted successfully',
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

export default ReportCategoryController;
