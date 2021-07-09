import {Request, Response, NextFunction} from 'express';
import s3 from '../../Helper/DoSpace';
import VideoModel from '../../Models/Video';
import UserModel from '../../Models/User';
import CommentModel from '../../Models/Comment';
import logger from '../../utilis/logger';
import {v4 as uuidv4} from 'uuid';
import Spotify from '../Spotify/Spotify';
import SpotifyModel from '../../Models/Spotify';
import moment from 'moment';
import FavoriteModel from '../../Models/Favorite';
import PrivacyModel from '../../Models/Privacy';
import Notification from '../../Helper/Notification';
import {getName} from '../../Helper/utilis';

class VideoController {
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
        this.bucket = process.env.DIGITAL_OCEAN_SPACE_NAME
            ? process.env.DIGITAL_OCEAN_SPACE_NAME
            : 'dramaking';
    }

    getPrivateUsers = async uid => {
        const requestUser = await UserModel.findById(uid);
        const requestUserFollowingUsers: any = requestUser.follwingUsers;
        const privacyQuery = {
            postIsPublic: false,
        };
        const privacy = await PrivacyModel.find(privacyQuery);
        let privateUserProfile = [];
        privacy.forEach(element => {
            if (!requestUserFollowingUsers.includes(element.user)) {
                privateUserProfile.push(element.user.toString());
            }
        });

        return privateUserProfile;
    };

    getToken = async () => {
        let access_token: string;
        let doc: any = await SpotifyModel.findOne({
            isManuallyAdded: true,
        });
        const refresh_token = doc.refresh_token;
        const expires_in = doc.expires_in;
        const generated_at = doc.generated_at;
        const now = moment().unix();
        if (now <= parseInt(generated_at) + parseInt(expires_in)) {
            access_token = doc.access_token;
        } else {
            const tokens = await Spotify.refreshToken(refresh_token);
            access_token = tokens.access_token;
            doc = await SpotifyModel.findOneAndUpdate(
                {_id: doc.id},
                {
                    ...tokens,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token
                        ? tokens.refresh_token
                        : doc.refresh_token,
                    generated_at: moment().unix(),
                },
                {upsert: true, new: true, setDefaultsOnInsert: true}
            );
        }

        return access_token;
    };

    getname = ret => {
        const firstName = ret.firstName ? ret.firstName : ' ';
        const middleName = ret.middleName ? ret.middleName : ' ';
        const lastName = ret.lastName ? ret.lastName : ' ';
        const name = firstName + ' ' + middleName + ' ' + lastName;
        return name.trim();
    };

    formatVideos = async (videos, uid) => {
        let data: any = [];

        if (videos.length >= 1) {
            for (const video of videos) {
                const userLiked = video.userLiked;
                video.myLikeStatus = !!userLiked.includes(uid);
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
                video.postedByUser = await UserModel.findById(video.postedById, ('firstName lastName middleName username'));
                video.profileImage = uploader.image;
                video.isUserVerified = uploader.isUserVerified;
                data.push(video);
            }
        }

        return data;
    };

    search = async () => {
        try {
            const {q} = this.req.query;
            const uid = this.req.uid;
            if (!q) throw new Error('please provide ?q=');

            const privateUserProfile = await this.getPrivateUsers(uid);

            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const user = await UserModel.findById(uid);
            const userWhoBlockedMe = user.usersBlockedMe
                ? user.usersBlockedMe
                : [];

            const query = {
                $or: [
                    {songname: {$regex: q, $options: 'i'}},
                    {description: {$regex: q, $options: 'i'}},
                    {postedByName: {$regex: q, $options: 'i'}},
                ],
                uploader: {
                    $nin: [uid, ...privateUserProfile, ...userWhoBlockedMe],
                },
            };
            const result = await VideoModel.find(query)
                .select('id  originalVideo thumbnails ')
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await VideoModel.countDocuments(query);
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'serach result',
                    result,
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
                    result: [],
                },
            });
        }
    };

    action = async () => {
        try {
            const {action} = this.req.body;
            const {id} = this.req.params;
            const uid = this.req.uid;
            const video: any = await VideoModel.findById(id)
                .select('-password')
                .populate('uploader');
            if (!video) throw new Error('Video id is invalid');
            const uploader = video.uploader;
            const user: any = await UserModel.findById(uid);
            const isAlreadyLiked = user.likedVideos ? user.likedVideos.includes(id) : false;
            const isAlreadyDisliked = user.dislikedVideos ? user.dislikedVideos.includes(id) : false;

            const isUploaderBlocked = user.blockedUsers.includes(uploader._id);
            const isUploaderFollowed = user.follwingUsers.includes(uploader._id);
            const isUploaderAndUserSame = uploader.id.toString() === uid.toString();

            let name = getName(user);

            switch (action) {
                case 'like':
                    if (isAlreadyLiked) {
                        user.dislikedVideos.pull(video);
                        video.userDisliked.pull(user);
                        video.myLikeStatus = true;
                        await video.save();
                        await video.save();
                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'You have liked this video'
                            }
                        });
                    } else {
                        user.likedVideos.push(video);
                        video.userLiked.push(user);
                        video.myLikeStatus = true;
                        user.dislikedVideos.pull(video);
                        video.userDisliked.pull(user);
                        await user.save();
                        await video.save();
                        // send notification

                        if (!isUploaderAndUserSame) {
                            await Notification.send(uploader, {
                                title: name,
                                body: name + ' liked your video',
                                intent: 'video-liked',
                                targetID: video._id,
                                targetUser: user,
                                otherUserID: uploader._id,
                                tokenUserID: uid,
                                imageUrl: video.thumbnails,
                            });
                        }

                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'You have liked this video',
                            },
                        });
                    }

                    break;

                case 'dislike':
                    if (isAlreadyDisliked) {
                        user.likedVideos.pull(video);
                        video.userLiked.pull(user);
                        video.myLikeStatus = false;
                        await user.save();
                        await video.save();

                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'You have disliked this video',
                            },
                        });
                    } else {
                        user.likedVideos.pull(video);
                        user.dislikedVideos.push(video);
                        video.userLiked.pull(user);
                        video.userDisliked.push(user);
                        video.myLikeStatus = false;
                        await user.save();
                        await video.save();
                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'You have disliked this video',
                            },
                        });
                    }

                    break;

                case 'share':
                    user.sharedVideos.push(video);
                    video.userShared.push(user);
                    video.myShareStatus = true;
                    await user.save();
                    await video.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have shared this video',
                        },
                    });
                    break;

                case 'follow':
                    if (isUploaderBlocked)
                        throw new Error(
                            'You have blocked this user please unblock first'
                        );

                    if (isUploaderFollowed)
                        throw new Error('You are already following this user');
                    //  folow user
                    user.follwingUsers.push(uploader);
                    user.isFollow = true;
                    uploader.follwersUsers.push(user);
                    video.myfollwStatus = true;
                    video.userFollowed.push(user);
                    if (!isUploaderAndUserSame) {
                        // send notification
                        await Notification.send(uploader, {
                            title: name,
                            body: name + ' started followinfg you',
                            intent: 'user',
                            targetID: uid,
                            targetUser: user,
                            otherUserID: uploader._id,
                            tokenUserID: uid,
                            imageUrl: video.thumbnails,
                        });
                    }

                    await user.save();
                    await uploader.save();
                    await video.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You are now following this user',
                        },
                    });

                    break;

                case 'unfollow':
                    if (isUploaderBlocked)
                        throw new Error(
                            'You have blocked this user please unblock first'
                        );

                    user.follwingUsers.pull(uploader);
                    user.isFollow = false;
                    uploader.follwersUsers.pull(user);
                    video.myfollwStatus = false;
                    video.userFollowed.pull(user);
                    await user.save();
                    await uploader.save();
                    await video.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have unfollowed this user',
                        },
                    });

                    break;

                case 'block':
                    if (isUploaderBlocked)
                        throw new Error('You have already blocked this user');

                    user.blockedUsers.push(uploader);
                    await user.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have blocked this user',
                        },
                    });

                    break;

                case 'unblock':
                    user.blockedUsers.pull(uploader);
                    await user.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have unblocked this user',
                        },
                    });

                    break;

                case 'view+':
                    user.viewedVideos.push(video);
                    for (let i = 0; i <= 9; i++) {
                        video.userViewed.push(user);
                    }
                    await user.save();
                    const videoSaved = await video.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have viewed this video',
                            video: videoSaved,
                        },
                    });
                    break;

                case 'share+':
                    user.sharedVideos.push(video);
                    video.userShared.push(user);
                    await user.save();
                    await video.save();
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'You have shared this video',
                        },
                    });

                    break;

                default:
                    this.res.status(200).json({
                        status: 400,
                        message: 'error',
                        data: {
                            message:
                                'Please provide action like, share, follow, unfollow, block and unblock',
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

    getVideos = async () => {
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
            const privateUserProfile = await this.getPrivateUsers(uid);
            user = await UserModel.findById(uid);
            const userWhoBlockedMe = user.usersBlockedMe
                ? user.usersBlockedMe
                : [];

            switch (q) {
                case 'liked':
                    query = {
                        userLiked: uid,
                        uploader: {
                            $nin: [
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
                    };
                    const likedVideos = await VideoModel.find(query)
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
                            message: 'video list',
                            videos: await this.formatVideos(likedVideos, uid),
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
                        uploader: {
                            $nin: [
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
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
                            message: 'video list',
                            videos: await this.formatVideos(sharedVideos, uid),
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
                        uploader: {
                            $nin: [
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
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
                            message: 'video list',
                            videos: await this.formatVideos(viewedVideos, uid),
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
                            message: 'video list',
                            videos: await this.formatVideos(
                                uploadedVideos,
                                uid
                            ),
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
                    // get  user following users
                    const following = user ? user.follwingUsers : [];
                    // now get videos where uploader in following
                    query = {
                        uploader: {
                            $in: following,
                            $nin: [
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
                    };
                    const followingUsersVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);

                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'video list',
                            videos: await this.formatVideos(
                                followingUsersVideos,
                                uid
                            ),
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

                case 'followers':
                    const followers = user ? user.follwersUsers : [];
                    query = {
                        uploader: {
                            $in: followers,
                            $nin: [
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
                    };
                    const followersVideos = await VideoModel.find(query)
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
                            message: 'video list',
                            videos: await this.formatVideos(
                                followersVideos,
                                uid
                            ),
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

                case 'hashtag':
                    user = await UserModel.findById(uid);
                    const reqQuery = this.req.query.hashtag;
                    query = {
                        uploader: {
                            $nin: [
                                user.blockedUsers,
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
                        description: {$regex: reqQuery, $options: 'i'},
                    };
                    const hashTagVideos = await VideoModel.find(query)
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'hashtag video list',
                            hashtag: reqQuery,
                            videos: await this.formatVideos(hashTagVideos, uid),
                            totalvideos: count,
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

                case 'song':
                    user = await UserModel.findById(uid);
                    const songName = this.req.query.songName;
                    const songID = this.req.query.songID;
                    if (songName) {
                        const query = {
                            uploader: {
                                $nin: [
                                    user.blockedUsers,
                                    uid,
                                    ...privateUserProfile,
                                    ...userWhoBlockedMe,
                                ],
                            },
                            songName: {$regex: songName, $options: 'i'},
                        };
                        const songVideos = await VideoModel.find(query)
                        //  .select('id  originalVideo thumbnails ')
                            .skip(parseInt(limit) * (parseInt(page) - 1))
                            .limit(parseInt(limit))
                            .sort([['createdAt', -1]]);
                        const count = await VideoModel.countDocuments(query);
                        const total = Math.ceil(count / limit);
                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'by song video list',
                                videoCount: count,
                                music: {},
                                isFavorite: false,
                                videos: await this.formatVideos(
                                    songVideos,
                                    uid
                                ),
                            },
                            pagination: {
                                total,
                                page: parseInt(page),
                                next:
                                    parseInt(page) < total
                                        ? parseInt(page) + 1
                                        : null,
                                prev:
                                    parseInt(page) <= total &&
                                    parseInt(page) !== 1
                                        ? parseInt(page) - 1
                                        : null,
                            },
                        });
                    } else {
                        const query = {
                            uploader: {
                                $nin: [
                                    user.blockedUsers,
                                    uid,
                                    ...privateUserProfile,
                                    ...userWhoBlockedMe,
                                ],
                            },
                            songID: songID,
                        };
                        const trackID = songID;
                        const token = await this.getToken();
                        const result = await Spotify.getTrack(trackID, token);
                        const {
                            id,
                            name,
                            preview_url,
                            uri,
                            album,
                            artists,
                        } = result;
                        // get first thumbnail
                        const thumbnail = album.images
                            ? album.images.shift()
                            : {};
                        const music = {
                            id,
                            name,
                            thumbnail,
                            preview_url,
                            uri,
                            artists,
                        };
                        const songVideos = await VideoModel.find(query)
                            .skip(parseInt(limit) * (parseInt(page) - 1))
                            .limit(parseInt(limit))
                            .sort([['createdAt', -1]]);
                        const count = await VideoModel.countDocuments(query);
                        const total = Math.ceil(count / limit);
                        // get if it is in fovorite
                        const favorite = await FavoriteModel.findOne({
                            songID: songID,
                        });
                        const isFavorite = favorite
                            ? favorite.isFavorite
                            : false;
                        this.res.status(200).json({
                            status: 200,
                            message: 'success',
                            data: {
                                message: 'by song video list',
                                videoCount: count,
                                music,
                                isFavorite,
                                videos: await this.formatVideos(
                                    songVideos,
                                    uid
                                ),
                            },
                            pagination: {
                                total,
                                page: parseInt(page),
                                next:
                                    parseInt(page) < total
                                        ? parseInt(page) + 1
                                        : null,
                                prev:
                                    parseInt(page) <= total &&
                                    parseInt(page) !== 1
                                        ? parseInt(page) - 1
                                        : null,
                            },
                        });
                    }

                    break;

                default:
                    // get all type of videos except user who blcoked
                    user = await UserModel.findById(uid);
                    const blocked = user ? user.blockedUsers : [];
                    query = {
                        uploader: {
                            $nin: [
                                ...blocked,
                                uid,
                                ...privateUserProfile,
                                ...userWhoBlockedMe,
                            ],
                        },
                    };
                    count = await VideoModel.countDocuments(query);
                    let allvideos: any;
                    if (page % 2 !== 0) {
                        const videos = await VideoModel.aggregate([
                            {
                                $unwind: '$userLiked',
                            },
                            {
                                $group: {
                                    _id: '$_id',
                                    likedCount: { $sum: 1 },
                                },
                            },
                            {
                                $skip: (page - 1) * limit,
                            },
                            {
                                $limit: parseInt(limit),
                            },
                            {
                                $sort: { likedCount: -1 },
                            },
                        ]);
                        const v = await VideoModel.populate(videos, { path: '_id' });
                        allvideos = v.map(video => video._id);
                    } else {
                        const random = Math.floor(Math.random() * count);
                        allvideos = await VideoModel.find(query)
                            .skip(random)
                            .limit(parseInt(limit))
                            .sort([]);
                    }

                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'video list',
                            videos: await this.formatVideos(allvideos, uid),
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
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    videos: [],
                },
                pagination: {},
            });
        }
    };

    uploadVideo = async () => {
        if (this.req.files || Object.keys(this.req.files).length === 0) {
            try {
                const video = this.req.files.video;
                const thumbnail = this.req.files.thumbnail;
                const postedById = this.req.uid;
                const postedByName = this.req.user.username;
                const path = 'videos/' + uuidv4() + '/';
                const videopath = path + uuidv4() + video.name;
                const thumbnailPath =
                    path + 'thumbnail/' + uuidv4() + thumbnail.name;
                const uploader: any = await UserModel.findById(this.req.uid);

                const videoMimeType =
                    video && video.mimetype ? video.mimetype : 'video/mpeg';

                const thumbnailMimeType =
                    thumbnail && thumbnail.mimetype
                        ? thumbnail.mimetype
                        : 'image/jpeg';
                const videoUrl = s3.getBucketUrl() + '/' + videopath;
                const thumbnailUrl = s3.getBucketUrl() + '/' + thumbnailPath;

                await s3.uploadObject({
                    Bucket: this.bucket,
                    Key: videopath,
                    Body: video.data,
                    ACL: 'public-read',
                    ContentType: videoMimeType,
                    ContentDisposition: 'inline',
                });

                await s3.uploadObject({
                    Bucket: this.bucket,
                    Key: thumbnailPath,
                    Body: thumbnail.data,
                    ACL: 'public-read',
                    ContentType: thumbnailMimeType,
                    ContentDisposition: 'inline',
                });

                // update in db

                const videodb = await new VideoModel({
                    originalVideo: videoUrl,
                    postedById,
                    postedByName,
                    profileImage: this.req.user.image,
                    thumbnails: thumbnailUrl,
                    description: this.req.body.description,
                    songName: this.req.body.songName,
                    tags: this.req.body.tags,
                    category: this.req.body.category,
                    uploader,
                }).save();

                uploader.uploadedVideos.push(videodb);

                await uploader.save();

                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'video uploaded succesfully',
                    },
                });
            } catch (error) {
                logger.error(error);
                this.res.status(400).json({
                    status: 400,
                    message: 'error',
                    data: {
                        message: error.message,
                    },
                });
            }

            // upload file to space
        } else {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: 'please upload video with name video',
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const {id} = this.req.params;
            const video: any = await VideoModel.findById(id);
            const comments: any = await CommentModel.find({
                video: video._id,
            });

            for (const comment of comments) {
                await comment.deleteOne();
            }

            const users: any = await UserModel.find({
                $or: [
                    {
                        uploadedVideos: video._id,
                    },
                    {
                        likedVideos: video._id,
                    },
                    {
                        dislikedVideos: video._id,
                    },
                    {
                        sharedVideos: video._id,
                    },
                    {
                        viewedVideos: video._id,
                    },
                ],
            });

            if (users.length >= 1) {
                for (const user of users) {
                    await user.uploadedVideos.pull(video);
                    await user.likedVideos.pull(video);
                    await user.dislikedVideos.pull(video);
                    await user.sharedVideos.pull(video);
                    await user.dislikedVideos.pull(video);
                    await user.viewedVideos.pull(video);
                }
            }

            await video.deleteOne();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Video deleted successfully',
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

    getVideo = async () => {
        try {
            const uid = this.req.uid;
            const {id} = this.req.params;
            const video: any = await VideoModel.findById(id);
            if (!video) throw new Error('Please provide valid id');
            // // now need to make sure same video response format
            const userLiked = video.userLiked;
            video.myLikeStatus = !!userLiked.includes(uid);
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
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'video info',
                    video,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    video: {},
                },
            });
        }
    };
}

export default VideoController;
