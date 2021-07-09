import { Request, Response, NextFunction } from 'express';
import CrownModel from '../../Models/Crown';

/**
 * Crown Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class CrownController {
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
            const platform = this.req.query.platform || 'android';
            const query = {};
            if (platform !== 'all') {
                query['platform'] = platform;
            }
            const crowns = await CrownModel.find(query)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['crown', 1]]);
            const count = await CrownModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'crown plan list',
                    crowns,
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
            const {crown, description, amount, platform, packageId} = this.req.body;

            if (!crown || !description || !amount || !platform)
                throw new Error(
                    'Please provide crown, description, amount and platform in request body'
                );
            const crownData = await new CrownModel({
                crown,
                description,
                amount,
                platform,
                packageId
            }).save();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'crown plan created',
                    crown: crownData,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };

    show = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const crown = await CrownModel.findById(id);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'crown plan',
                    crown,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };

    update = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const crown = await CrownModel.findOneAndUpdate(
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
                    message: 'crown plan updated',
                    crown,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const id = this.req.params.id;
            if (!id) throw new Error('Please provide id');
            const crown: any = await CrownModel.findById(id);
            crown.deleteOne();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'deleted successfully',
                    crown,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };
}

export default CrownController;
