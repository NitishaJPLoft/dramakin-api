import { Request, Response, NextFunction } from 'express';
import LanguageModel from '../../Models/Language';
import PreferedLanguageModel from '../../Models/PreferedLanguage';
/**
 * Crown Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class LanguageController {
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
            const uid = this.req.uid;

            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 15;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            let result = [];

            const preferedLanguages = await PreferedLanguageModel.find({
                user: uid,
            }).select('language');
            let userlanguages = [];

            preferedLanguages.forEach(element => {
                userlanguages.push(element.language.toString());
            });
            const languages = await LanguageModel.find({})
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await LanguageModel.countDocuments({});
            const total = Math.ceil(count / limit);
            languages.forEach(element => {
                result.push({
                    language: element.language,
                    id: element.id,
                    selected: userlanguages.includes(element.id.toString())
                        ? true
                        : false,
                });
            });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'languages',
                    languages: result,
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
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    notifications: [],
                },
                language: {},
            });
        }
    };

    create = async () => {
        try {
            const language = await LanguageModel.findOneAndUpdate(
                {
                    language: this.req.body.language,
                },
                {
                    ...this.req.body,
                },
                { upsert: true }
            );

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'New Language added',
                    language,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    data: {},
                },
            });
        }
    };

    getPrefered = async () => {
        try {
            const uid = this.req.uid;

            const languages = await PreferedLanguageModel.find({
                user: uid,
            }).populate('language');

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'User prefered languages',
                    languages: languages ? languages : [],
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    data: {},
                },
            });
        }
    };

    setPrefered = async () => {
        try {
            const uid = this.req.uid;
            const ids = this.req.body.languages;
            // delete other documents
            console.log('ids', ids, ids.length);
            const docs = await PreferedLanguageModel.find({
                user: uid,
            });

            console.log('docs', docs);
            for (const doc of docs) {
                await doc.deleteOne();
            }

            // insert new

            for (const id of ids) {
                console.log('id', id);
                console.log('this.req.body', this.req.body);
                await PreferedLanguageModel.findOneAndUpdate(
                    {
                        user: uid,
                        language: id,
                    },
                    {
                        ...this.req.body,
                    },
                    { upsert: true, new: true }
                ).select('-user');
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'New Language added',
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    data: {},
                },
            });
        }
    };

    removePrefered = async () => {
        try {
            const uid = this.req.uid;
            const { languageID } = this.req.params;
            const language = await PreferedLanguageModel.findOneAndDelete({
                user: uid,
                language: languageID,
            });

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'language removed',
                    language,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    data: {},
                },
            });
        }
    };
}

export default LanguageController;
