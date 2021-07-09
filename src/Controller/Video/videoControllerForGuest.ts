import { Request, Response, NextFunction } from 'express';
import VideoModel from '../../Models/Video';
import UserModel from '../../Models/User';
import PrivacyModel from '../../Models/Privacy';
class VideoControllerForGuest {
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

    formatVideos = async videos => {
        let data: any = [];
        // console.log('videos : ', videos);
        if (videos.length >= 1) {
            for (const video of videos) {
                video.myLikeStatus = false;
                console.log('video.uploader : ', video.uploader);
                const uploader: any = await UserModel.findById(video.uploader);
                console.log('uploader : ', uploader);
                video.myfollwStatus = false;
                video.followuser = false;
                video.postedByName = uploader.username;
                video.profileImage = uploader.image;
                video.isUserVerified = uploader.isUserVerified;

                data.push(video);
            }
        }

        return data;
    };

    search = async () => {
        try {
            const { q } = this.req.query;
            const uid = this.req.uid;
            if (!q) throw new Error('please provide ?q=');

            const privateUserProfile = await this.getPrivateUsers();

            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const query = {
                $or: [
                    { songname: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { postedByName: { $regex: q, $options: 'i' } },
                ],
                uploader: {
                    $nin: [...privateUserProfile],
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
            console.log(error);
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

    getVideos = async () => {
        try {
            const q = this.req.query.q;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            let count;
            let total;
            let query;
            const privateUserProfile = await this.getPrivateUsers();
            switch (q) {
                case 'hashtag':
                    const reqQuery = this.req.query.hashtag;
                    query = {
                        uploader: {
                            $nin: [
                                ...privateUserProfile
                            ],
                        },
                        description: { $regex: reqQuery, $options: 'i' },
                    };
                    const hashTagVideos = await VideoModel.find(query)
                        //  .select('id  originalVideo thumbnails ')
                        .skip(parseInt(limit) * (parseInt(page) - 1))
                        .limit(parseInt(limit))
                        .sort([['createdAt', -1]]);
                    count = await VideoModel.countDocuments(query);
                    console.log(count);
                    total = Math.ceil(count / limit);
                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'hashtag video list',
                            hashtag: reqQuery,
                            videos: await this.formatVideos(hashTagVideos),
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
                default:
                    query = {
                        uploader: {
                            $nin: [...privateUserProfile],
                        },
                    };
                    let allvideos: any;
                    count = await VideoModel.countDocuments(query);
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
                        // console.log('-------------- all videos ------ : ', allvideos);
                    } else {
                        var random = Math.floor(Math.random() * count);
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
                            videos: await this.formatVideos(allvideos),
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
            console.log(error);
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

    getVideo = async () => {
        try {
            const { id } = this.req.params;
            const video: any = await VideoModel.findById(id);
            if (!video) throw new Error('Please provide valid id');
            // // now need to make sure same video response format
            video.myLikeStatus = false;
            const uploader: any = await UserModel.findById(video.uploader);
            const uploaderFollwers: string[] = uploader
                ? uploader.follwersUsers
                : [];

            video.myfollwStatus = false;
            video.followuser = false;
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
}

export default VideoControllerForGuest;
