import { Request, Response, NextFunction } from 'express';
import UserModel from '../../Models/User';
import { hashSync } from 'bcryptjs';
// import { pick } from 'lodash';
import VideoPreferenceModel from '../../Models/VideosPreference';
import VideoModel from '../../Models/Video';
import VerificationModel from '../../Models/Verification';
import WalletModel from '../../Models/Wallet';
import { URL } from 'url';
import s3 from '../../Helper/DoSpace';
import AWS, { S3, ElasticTranscoder } from 'aws-sdk';
import Notification from '../../Helper/Notification';
import { getName } from '../../Helper/utilis';
import { generateUserName, constructName } from '../../Helper/auth';
import PrivacyModel from '../../Models/Privacy';
import BlockedUserModel from '../../Models/BlockedUser';
import PreferedLanguageModel from '../../Models/PreferedLanguage';
/**
 *  User Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
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
    };

    getCdnUrl = path => {
        return this.cdn + '/' + path;
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
    };

    issAValidUrl = (s: string) => {
        try {
            new URL(s);
            return true;
        } catch (err) {
            return false;
        }
    };

    generateUserName = () => {
        const unique = Math.floor(
            1000000000000000 + Math.random() * 9000000000000000
        );
        return 'dramaking' + Math.floor(Math.random() * 100 + 1) + unique;
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
                video.myLikeStatus = !!userLiked.includes(uid);
                console.log('video', video);
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

    arrayRemove = (arr, uid) => {
        console.log('arr', arr);
        let array: string[] = [];

        arr.forEach(element => {
            if (element.id !== uid) {
                array.push(element);
            }
        });

        return array;
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
            const users = await UserModel.find({}, ['firstName', 'lastName', 'middleName', 'username', 'email', 'mobile', 'isUserVerified', 'image', 'password'])
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            for (let i in users) {
                if (users.hasOwnProperty(i)) {
                    users[i] = users[i].toObject();
                    const firstName = users[i].firstName ? users[i].firstName : ' ';
                    const middleName = users[i].middleName ? users[i].middleName : ' ';
                    const lastName = users[i].lastName ? users[i].lastName : ' ';
                    users[i].name = firstName + ' ' + middleName + ' ' + lastName;
                    users[i].docCount = await VerificationModel.countDocuments({user: users[i]._id});
                    users[i].wallet = await WalletModel.findOne({userID: users[i]._id}, ['balance']);
                }
            }
            const count = await UserModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    users
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
                    users: [],
                },
            });
        }
    };

    create = async () => {
        if (this.req.body.email || this.req.body.mobile) {
            try {
                const email = this.req.body.email;
                const name = this.req.body.name;
                const mobile = this.req.body.mobile;
                let data: any = {};
                const isEmailExsist = await UserModel.findOne({ email });
                if (isEmailExsist) throw new Error('This email already exsist');
                if (mobile && mobile !== '' && mobile !== ' ') {
                    const isMobileExsist = await UserModel.findOne({ mobile });
                    if (isMobileExsist)
                        throw new Error('This mobile already exsist');
                }
                if (name) {
                    const nameArray = name.split(' ');
                    const filteredArray = nameArray.filter(e => {
                        if (e && e !== '') {
                            return e.trim();
                        }
                    });
                    const firstName = filteredArray[0] ? filteredArray[0] : '';
                    const middleName = filteredArray[1] ? filteredArray[1] : '';
                    const lastName = filteredArray[2] ? filteredArray[2] : '';
                    data.firstName = firstName.trim();
                    data.middleName = middleName.trim();
                    data.lastName = lastName.trim();
                    data.username = this.generateUserName();
                }

                const user = await new UserModel({
                    ...this.req.body,
                    ...data,
                }).save();
                await new VideoPreferenceModel({
                    user,
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'User created successfully',
                        user,
                    },
                });
            } catch (error) {
                this.res.status(400).json({
                    status: 400,
                    message: 'error',
                    data: {
                        message: error.message,
                        user: {},
                    },
                });
            }
        } else {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: 'Please provide atleast email or mobile',
                    user: {},
                },
            });
        }
    };

    show = async () => {
        try {
            const q = this.req.query.q;
            const uid = this.req.uid;
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
            const languages = await PreferedLanguageModel.find({
                user: uid,
            }).populate('language');
            switch (q) {
                case 'followers':
                    user = await UserModel.findById(uid).populate({
                        path: 'follwersUsers',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified isFollow',
                        options: {
                            skip: parseInt(limit) * (parseInt(page) - 1),
                            limit: parseInt(limit),
                        },
                    });

                    me = await UserModel.findById(uid);
                    count = me.follwersUsers.length;
                    const followers = user ? user.follwersUsers : [];
                    total = Math.ceil(count / limit);
                    for (const follower of followers) {
                        const other = await UserModel.findById(follower._id);

                        // console.log('other user', other);
                        const otherUserFollwers: string[] = other
                            ? other.follwersUsers
                            : [];

                        if (otherUserFollwers.length >= 1) {
                            follower.isFollow = !!otherUserFollwers.includes(uid);
                        } else {
                            follower.isFollow = false;
                        }
                    }
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
                    user = await UserModel.findById(uid).populate({
                        path: 'follwingUsers',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified isFollow',
                        options: {
                            skip: parseInt(limit) * (parseInt(page) - 1),
                            limit: parseInt(limit),
                        },
                    });

                    const following = user ? user.follwingUsers : [];
                    me = await UserModel.findById(uid);
                    count = me.follwingUsers.length;
                    total = Math.ceil(count / limit);
                    for (const followingUser of following) {
                        const other = await UserModel.findById(
                            followingUser._id
                        );
                        //  console.log('other user', other);
                        const otherUserFollwers: string[] = other
                            ? other.follwersUsers
                            : [];

                        if (otherUserFollwers.length >= 1) {
                            followingUser.isFollow = !!otherUserFollwers.includes(uid);
                        } else {
                            followingUser.isFollow = false;
                        }
                    }
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: following,
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
                    user = await UserModel.findById(uid).populate(
                        'blockedUsers',
                        'id  username  firstName middleName lastName name image isUserVerified isFollow isBlocked'
                    );

                    const blocked = user ? user.blockedUsers : [];
                    // cha
                    for (const u of blocked) {
                        u.isBlocked = true;
                        u.isFollow = false;
                        await u.save();
                    }
                    count = blocked.length;
                    total = Math.ceil(count / limit);
                    // console.log('total', total);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: blocked,
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
                        uploader: uid,
                    };

                    const uploadedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(uploadedVideos, uid),
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
                    // user
                    //blocked
                    // nin uploder blocked

                    user = await UserModel.findById(uid);
                    const blockedUsers = user.blockedUsers;

                    query = {
                        userLiked: uid,
                        uploader: {
                            $nin: [...blockedUsers],
                        },
                    };

                    const likedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(likedVideos, uid),
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
                        userShared: uid,
                    };

                    const sharedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(sharedVideos, uid),
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
                        userViewed: uid,
                    };

                    const viewedVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(viewedVideos, uid),
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
                    user = await UserModel.findById(uid).select('-password ');
                    const myVideos = await VideoModel.find({
                        uploader: uid,
                    });
                    let likes = 0;
                    myVideos.forEach(video => {
                        likes += video.userLiked.length;
                    });
                    user.likes = likes;
                    user.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: user,
                            languages,
                        },
                    });
                    break;
            }
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

    getUser = async () => {
        try {
            const q = this.req.query.q;
            const id = this.req.params.id;
            const uid = this.req.uid;
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
            let privacy = await PrivacyModel.findOne({ user: id });

            // console.log('privacy', privacy);
            if (!privacy) {
                privacy = await new PrivacyModel({
                    user: uid,
                }).save();
            }

            const isProfilePrivate = privacy.isProfilePrivate;

            const requestUser = await UserModel.findById(uid);
            const requestUserFollowingUsers: any = requestUser.follwingUsers;
            // console.log('requestUser.follwingUsers', requestUserFollowingUsers);
            //  console.log('uid', uid);
            //  console.log('id', id);
            const blockedUsers: any = requestUser.blockedUsers;
            const isBlocked = blockedUsers.includes(id);
            const isRequestUserFollowing = requestUserFollowingUsers.includes(
                id
            );
            const isPostPublic = isRequestUserFollowing
                ? true
                : privacy.postIsPublic;
            //  console.log(isRequestUserFollowing);
            //  console.log('isPostPublic ', isPostPublic);
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");

                    me = await UserModel.findById(id);
                    count = me.follwersUsers.length;
                    followers = user ? user.follwersUsers : [];
                    // followers = this.arrayRemove(followers, uid);

                    for (const follower of followers) {
                        const other = await UserModel.findById(follower._id);

                        console.log('other user', other);
                        const otherUserFollwers: string[] = other
                            ? other.follwersUsers
                            : [];

                        if (otherUserFollwers.length >= 1) {
                            follower.isFollow = !!otherUserFollwers.includes(uid);
                        } else {
                            follower.isFollow = false;
                        }
                    }
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
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
                        const otherUserFollwers: string[] = other
                            ? other.follwersUsers
                            : [];

                        if (otherUserFollwers.length >= 1) {
                            followingUser.isFollow = !!otherUserFollwers.includes(uid);
                        } else {
                            followingUser.isFollow = false;
                        }
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
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
                    let uploadedVideos = [];
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
                    //    console.log(isBlocked);
                    if (!isBlocked && isPostPublic) {
                        query = {
                            uploader: id,
                        };
                        uploadedVideos = await VideoModel.find(query)
                            .skip(parseInt(limit) * (parseInt(page) - 1))
                            .limit(parseInt(limit))
                            .sort([['createdAt', -1]]);
                    }
                    count =
                        uploadedVideos.length > 0
                            ? await VideoModel.countDocuments(query)
                            : 0;
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(uploadedVideos, uid),
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
                    let likedVideos = [];
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
                    console.log(isBlocked);
                    if (!isBlocked) {
                        query = {
                            userLiked: id,
                        };
                        likedVideos = await VideoModel.find(query)
                            .skip(parseInt(limit) * (parseInt(page) - 1))
                            .limit(parseInt(limit))
                            .sort([['createdAt', -1]]);
                    }
                    count =
                        likedVideos.length > 0
                            ? await VideoModel.countDocuments(query)
                            : 0;
                    total = Math.ceil(count / limit);

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            info: await this.formatVideos(likedVideos, uid),
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
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
                            info: await this.formatVideos(sharedVideos, uid),
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
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
                            info: await this.formatVideos(viewedVideos, uid),
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
                    if (isProfilePrivate)
                        throw new Error("this user's profile is private.");
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

                    user.isBlocked = isBlocked;
                    // check if uid exsist in  user followers user

                    const OtherUserfollowers = user.follwersUsers
                        ? user.follwersUsers
                        : [];

                    if (OtherUserfollowers.length >= 1) {
                        user.isFollow = !!OtherUserfollowers.includes(uid);
                    } else {
                        user.isFollow = false;
                    }

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

    action = async () => {
        try {
            const { action, fname, lname, mname, email, mobile, username, password } = this.req.body;
            const { id } = this.req.params;
            // get user who want to block
            const userId = id === 'me' ? this.req.uid : id;
            const user: any = await UserModel.findById(this.req.uid);
            // get user whom he want to block
            console.log('user', user.firstName);
            const targetUser: any = await UserModel.findById(userId);
            console.log('targetUser', targetUser.firstName);
            const blockedUsers = user.blockedUsers;
            const follwingUsers = user.follwingUsers;
            const follwersUsers = targetUser.follwersUsers;
            const isTargetBlocked = blockedUsers.includes(userId);
            const isTargetfollowed = follwersUsers.includes(this.req.uid);

            let name = getName(user);
            switch (action) {
                case 'block':
                    // block user
                    console.log(
                        targetUser.usersBlockedMe.includes(this.req.uid)
                    );
                    if (isTargetBlocked)
                        throw new Error('User already blocked');
                    blockedUsers.push(targetUser);
                    // if(targetUser.usersBlockedMe)
                    if (!targetUser.usersBlockedMe.includes(this.req.uid)) {
                        targetUser.usersBlockedMe.push(user);
                    }

                    // unfollow user
                    follwingUsers.pull(targetUser);
                    follwersUsers.pull(user);

                    await BlockedUserModel.findOneAndUpdate(
                        {
                            targetUser,
                            blockedBy: user,
                        },
                        {
                            targetUser,
                            blockedBy: user,
                        },
                        {
                            upsert: true,
                        }
                    );

                    await user.save();
                    await targetUser.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'user blocked',
                            targetUser,
                            user,
                        },
                    });
                    break;

                case 'unblock':
                    // block user
                    targetUser.usersBlockedMe.pull(user);
                    blockedUsers.pull(targetUser);
                    await user.save();
                    await targetUser.save();
                    await BlockedUserModel.findOneAndDelete({
                        targetUser,
                        blockedBy: user,
                    });
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'user unblocked',
                        },
                    });
                    break;

                case 'follow':
                    if (isTargetBlocked)
                        throw new Error(
                            'You have blocked this user please unblock first'
                        );

                    if (isTargetfollowed)
                        throw new Error('You are already following this user');
                    //  folow user
                    follwingUsers.push(targetUser);
                    follwersUsers.push(user);
                    await user.save();
                    await targetUser.save();
                    // send notification
                    await Notification.send(targetUser, {
                        title: name,
                        body: name + ' started following you',
                        intent: 'user',
                        targetID: this.req.uid,
                        targetUser: user,
                        otherUserID: id,
                        tokenUserID: this.req.uid
                    });

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'user followed',
                        },
                    });
                    break;

                case 'unfollow':
                    if (isTargetBlocked)
                        throw new Error(
                            'You have blocked this user please unblock first'
                        );
                    //  folow user
                    follwingUsers.pull(targetUser);
                    follwersUsers.pull(user);
                    await user.save();
                    await targetUser.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'user unfollowed',
                        },
                    });
                    break;

                case 'admin':
                    await UserModel.findOneAndUpdate(
                        {
                            _id: userId,
                        },
                        {
                            firstName: fname,
                            middleName: mname,
                            lastName: lname,
                            email,
                            mobile,
                            username
                        }
                    );
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'User detail updated',
                        },
                    });
                    break;
                case 'changePassword':
                    await UserModel.findOneAndUpdate(
                        {
                            _id: userId,
                        },
                        {
                            password: hashSync(password.toString())
                        }
                    );
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'User detail updated',
                        },
                    });
                    break;
                default:
                    this.res.status(400).json({
                        status: 400,
                        message: 'error',
                        data: {
                            message: 'action type not supported',
                        },
                    });
                    break;
            }
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

    update = async () => {
        try {
            const body = this.req.body;
            const user: any = await UserModel.findById(this.req.uid);
            let socialProfile: any = {};
            const cleanedObject: any = Object.keys(body).reduce((acc, k) => {
                if (typeof body[k] === 'undefined') return acc;
                console.log('k', k);
                //  acc[k] = body[k];

                if (k === 'firstName') {
                    acc['firstName'] = body[k];
                }
                if (k === 'middleName') {
                    acc['middleName'] = body[k];
                }
                if (k === 'lastName') {
                    acc['lastName'] = body[k];
                }
                if (k === 'name') {
                    const name = body[k];
                    const array = name.split(' ');
                    const filtered = array.filter(e => {
                        if (e && e !== '') {
                            console.log('dddd');
                            return e.trim();
                        }
                    });
                    acc['firstName'] = filtered[0] ? filtered[0] : '';
                    acc['middleName'] = filtered[1] ? filtered[1] : '';
                    acc['lastName'] = filtered[2] ? filtered[2] : '';
                }
                if (k === 'instagram') {
                    socialProfile.instagram = body[k];
                }
                if (k === 'youtube') {
                    socialProfile.youtube = body[k];
                }

                if (socialProfile) {
                    acc['socialProfile'] = socialProfile;
                }

                if (k === 'password') {
                    acc['password'] = hashSync(body[k].toString());
                }

                if (k === 'about') {
                    acc['about'] = body[k];
                }

                if (
                    k === 'mobile' &&
                    body[k] !== user.mobile &&
                    body[k] !== ''
                ) {
                    console.log('kkkkk');
                    acc['mobile'] = body[k];
                }

                if (
                    k === 'username' &&
                    body[k] !== '' &&
                    body[k] !== user.username
                ) {
                    acc['username'] = generateUserName(body[k]);
                }

                return acc;
            }, {});

            if (
                cleanedObject.socialProfile &&
                cleanedObject.socialProfile.instagram
            ) {
                if (cleanedObject.socialProfile.instagram !== 'null') {
                    const issAValidUrl = this.issAValidUrl(
                        cleanedObject.socialProfile.instagram
                    );

                    if (!issAValidUrl)
                        throw new Error('instagram url should be a valid url');
                }
            }
            if (
                cleanedObject.socialProfile &&
                cleanedObject.socialProfile.youtube
            ) {
                if (cleanedObject.socialProfile.youtube !== 'null') {
                    const issAValidUrl = this.issAValidUrl(
                        cleanedObject.socialProfile.youtube
                    );

                    if (!issAValidUrl)
                        throw new Error('youtube url should be a valid url');
                }
            }

            if (cleanedObject.mobile) {
                const isMobileExsist = await UserModel.findOne({
                    mobile: cleanedObject.mobile,
                });

                console.log('isMobileExsist', isMobileExsist);

                if (isMobileExsist)
                    throw new Error('This mobile number already exsist');
            }

            if (cleanedObject.username) {
                const isUsernameExsist = await UserModel.findOne({
                    username: cleanedObject.username,
                });

                if (isUsernameExsist)
                    throw new Error('username already exsist');
            }

            let data: any = {};
            // update image

            if (this.req.files && Object.keys(this.req.files).length !== 0) {
                const file = this.req.files.file;
                const path = 'user/' + file.name;
                //upload file
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: path,
                    Body: file.data,
                    ACL: 'public-read',
                    ContentType: file.mimetype ? file.mimetype : 'image/jpg',
                    ContentDisposition: 'inline',
                });

                const url = this.getCdnUrl(path);
                console.log(url);
                data.image = url;
            }

            data = {
                ...data,
                ...cleanedObject,
            };

            console.log('data', data);

            // find and update return new doc and exclude password
            const doc = await UserModel.findOneAndUpdate(
                { _id: this.req.uid },
                {
                    ...data,
                },
                { new: true }
            )
                .select('-password')
                .populate('videoPreference')
                .exec();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'User details updated successfully',
                    user: doc,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    user: {},
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const { id } = this.req.params;
            // find and delete
            const user: any = await UserModel.findById(id);
            const videos = user.uploadedVideos;
            if (videos.length >= 1) {
                for (const video of videos) {
                    await video.deleteOne();
                }
            }

            await user.deleteOne();

            // find comments, video, userliked, userShared, user disliked
            // user who are folowing

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'User deleted successfully',
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

    getDocuments = async () => {
        try {
            const { id } = this.req.params;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const user: any = await UserModel.findById(id, ['firstName', 'lastName', 'middleName']);
            if (user && user._id) {
                const firstName = user.firstName ? user.firstName : ' ';
                const middleName = user.middleName ? user.middleName : ' ';
                const lastName = user.lastName ? user.lastName : ' ';
                user.name = firstName + ' ' + middleName + ' ' + lastName;
                const documents: any = await VerificationModel.find({user: id},['type', 'document'])
                    .skip(parseInt(limit) * (parseInt(page) - 1))
                    .limit(parseInt(limit))
                    .sort([['createdAt', -1]]);
                const count = await VerificationModel.countDocuments({user: id});
                const total = Math.ceil(count / limit);
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        documents,
                        user
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
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    users: [],
                },
            });
        }
    };
}

export default UserController;
