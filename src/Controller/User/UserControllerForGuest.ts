import { Request, Response, NextFunction } from 'express';
import UserModel from '../../Models/User';
import VideoPreferenceModel from '../../Models/VideosPreference';
import VideoModel from '../../Models/Video';
import { URL } from 'url';
import s3 from '../../Helper/DoSpace';
import AWS, { S3, ElasticTranscoder } from 'aws-sdk';
import Notification from '../../Helper/Notification';
import { getName } from '../../Helper/utilis';
import { generateUserName, constructName } from '../../Helper/auth';
import PrivacyModel from '../../Models/Privacy';
import BlockedUserModel from '../../Models/BlockedUser';

/**
 *  User Controller Guest Class
 *  @author Dolly Garg <dolly.garg@jploft.in>
 */
class UserController {
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

    generateUserName = () => {
        const unique = Math.floor(
            1000000000000000 + Math.random() * 9000000000000000
        );
        const username =
            'dramaking' + Math.floor(Math.random() * 100 + 1) + unique;
        return username;
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

    formatVideos = async (videos) => {
        let data: any = [];

        if (videos.length >= 1) {
            for (const video of videos) {
                //   console.log('video', video);
                const uploader: any = await UserModel.findById(video.uploader);
                video.postedByName = uploader.username;
                video.profileImage = uploader.image;
                video.isUserVerified = uploader.isUserVerified;

                data.push(video);
            }
        }
        return data;
    };

    getUser = async () => {
        try {
            const q = this.req.query.q;
            const id = this.req.params.id;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            let user;
            let count;
            let total;
            let query;
            let me;
            let following;
            let followers;
            switch (q) {
                case 'followers':
                    user = await UserModel.findById(id).populate({
                        path: 'follwersUsers',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified isFollow',
                        options: {
                            skip: parseInt(limit) * (parseInt(page) - 1),
                            limit: parseInt(limit),
                        },
                    });

                    me = await UserModel.findById(id);
                    count = me.follwersUsers.length;
                    followers = user ? user.follwersUsers : [];
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: followers,
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;

                case 'following':
                    user = await UserModel.findById(id).populate({
                        path: 'follwingUsers',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified isFollow',
                        options: {
                            skip: parseInt(limit) * (parseInt(page) - 1),
                            limit: parseInt(limit),
                        },
                    });
                    me = await UserModel.findById(id);
                    count = me.follwingUsers.length;
                    following = user ? user.follwingUsers : [];
                    // following = this.arrayRemove(following, uid);
                    //   console.log('following', following);
                    for (const followingUser of following) {
                        const other = await UserModel.findById(
                            followingUser._id
                        );

                        console.log('other user', other);
                    }
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: following,
                            count: following.length,
                        },

                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;
                case 'blocked':
                    user = await UserModel.findById(id).populate(
                        'blockedUsers',
                        'id  username  firstName middleName lastName name image isUserVerified isFollow'
                    );
                    const blocked = user ? user.blockedUsers : [];
                    for (const u of blocked) {
                        u.isBlocked = true;
                        u.isFollow = false;
                        await u.save();
                    }
                    count = blocked.length;
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: blocked,
                            count: blocked.length,
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;

                case 'uploaded':
                    query = {
                        uploader: id,
                    };
                    let uploadedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count =
                        uploadedVideos.length > 0
                            ? await VideoModel.countDocuments(query)
                            : 0;
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(uploadedVideos),
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;

                case 'liked':
                    let likedVideos = [];
                    query = {
                        userLiked: id,
                    };
                    likedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count =
                        likedVideos.length > 0
                            ? await VideoModel.countDocuments(query)
                            : 0;
                    total = Math.ceil(count / limit);

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(likedVideos),
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;
                case 'shared':
                    query = {
                        userShared: id,
                    };
                    const sharedVideos = await VideoModel.find(query)
                        //  .select('id  originalVideo thumbnails ')
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(sharedVideos),
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });
                    break;

                case 'viewed':
                    query = {
                        userViewed: id,
                    };
                    const viewedVideos = await VideoModel.find(query)
                        // .select('id  originalVideo thumbnails ')
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(viewedVideos),
                        },
                        pagination: {
                            total,
                            page: parseInt(page),
                            next:
                                parseInt(page) < total
                                    ? parseInt(page) + 1
                                    : null,
                            prev:
                                parseInt(page) <= total && parseInt(page) !== 1
                                    ? parseInt(page) - 1
                                    : null,
                        },
                    });

                    break;

                default:
                    console.log('deafult');
                    user = await UserModel.findById(id)
                        .select('-password ')
                        .exec();

                    const myVideos = await VideoModel.find({
                        uploader: id,
                    });
                    let likes = 0;
                    myVideos.forEach(video => {
                        likes += video.userLiked.length;
                    });
                    user.likes = likes;

                    await user.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: user,
                        },
                    });
                    break;
            }
        } catch (error) {
            console.log(error);
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

export default UserController;
