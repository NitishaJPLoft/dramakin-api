import { Request, Response, NextFunction } from 'express';
import SNS from './SNS';
import SNSModel from '../../Models/SNS';
import NotificationModel from '../../Models/Notification';
import Notification from '../../Helper/Notification';
import AppUpdateModel from '../../Models/AppUpdate';
import UserModel from '../../Models/User';
import VideoModel from '../../Models/Video';
import PrivacyModel from '../../Models/Privacy';
/**
 * Crown Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class NotificationController {
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

    addToken = async () => {
        try {
            const uid = this.req.uid;
            const { deviceToken, plateform, deviceID } = this.req.body;
            let plateformEndpointArn = null;
            if (plateform && plateform === 'ios') {
                plateformEndpointArn = process.env.AWS_SNS_IOS_ARN;
            } else {
                plateformEndpointArn = process.env.AWS_SNS_ANDROID_ARN;
            }
            console.log(plateformEndpointArn);
            const sns = await SNSModel.findOneAndUpdate(
                { user: uid },
                { deviceToken, plateform, deviceID },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            const plateformEndpoint = await SNS.createEndpoint(
                plateformEndpointArn,
                sns.deviceToken,
                uid
            );
            sns.awsArnEndpoint = plateformEndpoint.EndpointArn;
            await sns.save();

            // // register for Arnendpoint update anyway
            // // check if deviceToken already exsist
            // // if not create
            // const isExistAwsArnEndpoint = await SNSModel.findOne({
            //     deviceToken,
            // });

            // if (isExistAwsArnEndpoint) {
            //     console.log('1');
            //     // do not create just assign
            //     sns.awsArnEndpoint = isExistAwsArnEndpoint.awsArnEndpoint;
            //     await sns.save();
            // } else {
            //     console.log('2');
            //     //create
            //     const plateformEndpoint = await SNS.createEndpoint(
            //         plateformEndpointArn,
            //         sns.deviceToken,
            //         uid
            //     );
            //     sns.awsArnEndpoint = plateformEndpoint.EndpointArn;
            //     await sns.save();
            // }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'device token added successfully',
                    sns,
                    plateformEndpointArn,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    sns: {},
                    plateformEndpoint: {},
                },
            });
        }
    };

    getPrivateUsers1 = async () => {
        const privacy = await PrivacyModel.find({
            postIsPublic: false,
        });
        let privateUserProfile = [];
        privacy.forEach(element => {
            privateUserProfile.push(element.user.toString());
        });

        return privateUserProfile;
    };

    test = async () => {
        try {
            const uid = this.req.uid;
            const sns = await SNSModel.findOne({
                user: uid,
            });

            const privateUsers = await this.getPrivateUsers1();

            const users = await UserModel.find({
                _id: {
                    $nin: [...privateUsers],
                },
            });

            // const title = 'Test Notification';
            // const message = 'Hello this is a test notification';
            // const notification = await Notification.send(uid, {
            //     title,
            //     body: message,
            //     action: 'test',
            //     intent: 'test',
            //     targetID: '1',
            //     targetUser: uid,
            // });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Notification sent successfully',
                    sns,
                    privateUsers,
                    users,
                    // notification,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    notification: {},
                    text: {},
                },
            });
        }
    };

    index = async () => {
        try {
            const uid = this.req.uid;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const q = { user: uid, isRead: false };
            const notifications = await NotificationModel.find(q)
                .populate({
                    path: 'targetUser',
                    select:
                        'id username firstName middleName lastName name image',
                })
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await NotificationModel.countDocuments(q);
            const total = Math.ceil(count / limit);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'notifications',
                    notifications,
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
                pagination: {},
            });
        }
    };

    update = async () => {
        try {
            const { id } = this.req.params;
            const uid = this.req.uid;
            // find and update return new doc and exclude password
            const notification = await NotificationModel.findById(id);
            notification.isRead = true;
            await notification.save();

            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const q = { user: uid, isRead: false };
            const notifications = await NotificationModel.find(q)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await NotificationModel.countDocuments(q);
            const total = Math.ceil(count / limit);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'notifications',
                    notifications,
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
                    data: {},
                    pagination: {},
                },
            });
        }
    };
    deleteAll = async () => {
        try {
            const uid = this.req.uid;
            await NotificationModel.deleteMany({
                user: uid,
            });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Notifications deleted successfully',
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

    getVersion = async () => {
        try {
            const { os } = this.req.query;
            console.log(os);
            if (!os) throw new Error('Please provide os as android or ios');
            const appVersion = await AppUpdateModel.findOne({
                os,
            });

            if (!appVersion) {
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Get app version',
                        appVersion: {},
                    },
                });
            } else {
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Get app version',
                        appVersion,
                    },
                });
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    appVersion: {},
                },
            });
        }
    };
    setVersion = async () => {
        try {
            const { os } = this.req.body;
            // create if not exsist or update
            const appVersion = await AppUpdateModel.findOneAndUpdate(
                { os: os ? os : 'android' },
                { ...this.req.body },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'App version set successfully',
                    appVersion,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    appVersion: {},
                },
            });
        }
    };
    getPrivateUsers = async () => {
        const privacyQuery = {
            postIsPublic: false,
        };
        const privacy = await PrivacyModel.find(privacyQuery);
        let privateUserProfile = [];
        privacy.forEach(element => {
            privateUserProfile.push(element.user.toString());
        });

        return privateUserProfile;
    };
    formatVideos = async (videos, uid) => {
        let data: any = [];

        if (videos.length >= 1) {
            for (const video of videos) {
                const userLiked = video.userLiked;
                if (userLiked.includes(uid)) {
                    video.myLikeStatus = true;
                } else {
                    video.myLikeStatus = false;
                }
                const uploader: any = await UserModel.findById(video.uploader);
                const uploaderFollwers: string[] = uploader
                    ? uploader.follwersUsers
                    : [];

                if (uploaderFollwers.length >= 1) {
                    if (uploaderFollwers.includes(uid)) {
                        video.myfollwStatus = true;
                        video.followuser = true;
                    } else {
                        video.myfollwStatus = false;
                        video.followuser = false;
                    }
                } else {
                    video.myfollwStatus = false;
                    video.followuser = false;
                }

                video.postedByName = uploader.username;
                video.profileImage = uploader.image;
                video.isUserVerified = uploader.isUserVerified;

                data.push(video);
            }
        }

        return data;
    };

    videos = async () => {
        try {
            const { id } = this.req.query;

            const video = await VideoModel.findById(id);

            const uid = this.req.uid;

            const privateUserProfile = await this.getPrivateUsers();

            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const user = await UserModel.findById(uid);
            const blocked = user ? user.blockedUsers : [];
            const query = {
                uploader: {
                    $nin: [blocked, uid, ...privateUserProfile],
                },
            };
            console.log(query);
            const allvideos: any = await VideoModel.find(query)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);

            const count = (await VideoModel.countDocuments(query)) + 1;
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'video list',
                    videos: [
                        video,
                        ...(await this.formatVideos(allvideos, uid)),
                    ],
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
                    videos: {},
                    pagination: {},
                },
            });
        }
    };
}

export default NotificationController;
