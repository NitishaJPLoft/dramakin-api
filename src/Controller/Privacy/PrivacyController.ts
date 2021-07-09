import { Request, Response, NextFunction } from 'express';
import PrivacyModel from '../../Models/Privacy';
class PrivacyController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: any;

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

    show = async () => {
        try {
            const uid = this.req.uid;
            let privacy = await PrivacyModel.findOne({ user: uid });
            if (!privacy) {
                privacy = await new PrivacyModel({
                    user: uid,
                }).save();
            }
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    privacy,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    privacy: {},
                },
            });
        }
    };

    update = async () => {
        try {
            const uid = this.req.uid;
            const {
                isProfilePrivate,
                postIsPublic,
                pushNotification,
                silentNotification,
                chatNotification,
            } = this.req.body;
            let privacy = await PrivacyModel.findOne({ user: uid });
            if (privacy) {
                privacy.isProfilePrivate = isProfilePrivate;
                privacy.postIsPublic = postIsPublic;
                privacy.pushNotification = pushNotification;
                privacy.silentNotification = silentNotification;
                privacy.chatNotification = chatNotification;
                await privacy.save();
            } else {
                privacy = await new PrivacyModel({
                    user: uid,
                }).save();
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Privacy updated successfully',
                    privacy,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    privacy: {},
                },
            });
        }
    };
}

export default PrivacyController;
