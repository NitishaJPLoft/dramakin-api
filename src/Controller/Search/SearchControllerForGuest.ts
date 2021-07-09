import { Request, Response, NextFunction } from 'express';
import UserModel from '../../Models/User';
import Videomodel from '../../Models/Video';
import SliderModel from '../../Models/Slider';
import PrivacyModel from '../../Models/Privacy';
import { isEmpty } from 'lodash';
import HashtagVideoViewsModel from '../../Models/HashtagVideoViews';
/**
 *  Search Guest Controller Class
 *  @author Dolly Garg <dolly.garg@jploft.in>
 */
class SearchControllerForGuest {
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

    getPrivateUsers = async () => {
        const privacy = await PrivacyModel.find({
            isProfilePrivate: true,
        });
        let privateUserProfile = [];
        privacy.forEach(element => {
            privateUserProfile.push(element.user.toString());
        });

        return privateUserProfile;
    };

    getusers = async (q: string) => {
        try {
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            let query;
            let privateUserProfile = await this.getPrivateUsers();
            query = {
                _id: {
                    $nin: [ ...privateUserProfile],
                },
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { firstName: { $regex: q, $options: 'i' } },
                    { lastName: { $regex: q, $options: 'i' } },
                    { middleName: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                ],
            };
            const users = await UserModel.find(query)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            
            const count = await UserModel.countDocuments(query);
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'search result',
                    result: users,
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
    formatVideos = async (trending) => {
        let data: any = [];
        let temp = [];
        for (const trend of trending) {
            const videos = trend.videos;
            if (videos.length >= 1) {
                for (const video of videos) {
                    video.myLikeStatus = false;
                    const uploader: any = await UserModel.findById(
                        video.uploader
                    );
                    video.myfollwStatus = false;
                    video.followuser = false;
                    video.postedByName = uploader.username;
                    video.profileImage = uploader.image;
                    video.isUserVerified = uploader.isUserVerified;
                    temp.push(video);
                }
            }
            data.push({
                hashtag: trend.hashtag,
                viewCount: trend.viewCount,
                videos: temp,
            });
            temp = [];
        }

        return data;
    };
    gethashtags = async () => {
        const videos = await Videomodel.find({});
        let hashTags: any = [];
        for (const video of videos) {
            const description = video.description;
            const array = description.split('#');
            let trimmedArray = [];
            array.forEach(text => {
                if (!isEmpty(text)) {
                    const text1 = text
                        .replace(
                            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                            ''
                        )
                        .trim();
                    const text2 = text1.replace(/[^\w\s]/gi, '').trim();

                    const text3 = text2.replace(/(\r\n|\n|\r)/gm, '');

                    if (!isEmpty(text3)) {
                        trimmedArray.push(text3);
                    }
                }
            });

            hashTags.push(...trimmedArray);
        }
        const uniqueHashTags = Array.from(new Set(hashTags));
        return uniqueHashTags;
    };

    getTrendingVideos = async () => {
        //const hashtags: any = await this.gethashtags();
        let hashtags = [
            'dramaking',
            'comedy',
            'dance',
            'singing',
            'entertainment',
            'wedding',
            'education',
            'fun',
            'famouscollab',
            'famous',
            'india',
            'bigboss',
            'trending',
            'travel',
            'nature',
            'newsong',
            'viral',
            'temporarypyar',
            'galatfehmi',
        ];
        console.log('hashtags', hashtags);
        let result: any = [];
        for (const tag of hashtags) {
            const videos = await Videomodel.find({
                description: { $regex: tag }
            })
                .sort([['userViewed', -1]])
                .limit(5);

            // get viewCount and other
            const hashtagVideoViewsModel = await HashtagVideoViewsModel.findOne(
                {
                    hashtag: tag,
                }
            );
            result.push({
                hashtag: tag,
                viewCount: hashtagVideoViewsModel
                    ? hashtagVideoViewsModel.viewCount
                    : 0,
                videoCount: hashtagVideoViewsModel
                    ? hashtagVideoViewsModel.viewCount
                    : 0,
                videos,
            });
        }

        const result1 = result.sort((a, b) => b.viewCount - a.viewCount);
        const spliced = result1.splice(0, 20);
        return spliced;
    };

    trending = async (limit, page) => {
        try {
            const sliders = await SliderModel.find({})
                .limit(4)
                .sort([['createdAt', -1]]);
            const trending = await this.getTrendingVideos();
            console.log(trending);
            const data = await this.formatVideos(trending);
            const count = 20;
            const total = Math.ceil(count / limit);

            console.log('limit', limit, 'page', page);

            let start = 0;
            let end = 5;

            switch (page) {
                case '4':
                    console.log('4');
                    start = 15;
                    end = 20;
                    break;
                case '3':
                    console.log('3');
                    start = 10;
                    end = 15;
                    break;
                case '2':
                    console.log('2');
                    start = 5;
                    end = 10;
                    break;
                case '1':
                    console.log('1');
                    start = 0;
                    end = 5;
                    break;

                default:
                    console.log('default');
                    break;
            }

            // get limited hashtag
            console.log('start', start, 'end', end);
            const paginated = data.slice(start, end);
            // const paginated = data.splice(start, end);

            const result = {
                sliders,
                trending: paginated,
                // trending,
            };

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'serach result',
                    result,
                    pagination: {
                        total,
                        page: parseInt(page),
                        next:
                            parseInt(page) < total ? parseInt(page) + 1 : null,
                        prev:
                            parseInt(page) <= total && parseInt(page) !== 1
                                ? parseInt(page) - 1
                                : null,
                    },
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

    search = async () => {
        try {
            const { q } = this.req.query;
            const uid = this.req.uid;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 5;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            if (q) {
                this.getusers(q);
            } else {
                this.trending(limit, page);
            }
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

    searchAllUsers = async () => {
        try {
            const { q } = this.req.query;
            if (!q) throw new Error('Please provide a query');
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 10;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            const query = {
                $or: [
                    { firstName: { $regex: q, $options: 'i' } },
                    { lastname: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                    { username: { $regex: q, $options: 'i' } },
                ],
            };
            const users = await UserModel.find(query)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);

            const count = await UserModel.countDocuments(query);
            const total = Math.ceil(count / limit);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'search result',
                    users,
                    pagination: {
                        total,
                        page: parseInt(page),
                        next:
                            parseInt(page) < total ? parseInt(page) + 1 : null,
                        prev:
                            parseInt(page) <= total && parseInt(page) !== 1
                                ? parseInt(page) - 1
                                : null,
                    },
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    users: [],
                    pagination: {},
                },
            });
        }
    };

    getAllVideosOFusers = async () => {
        try {
            const { id } = this.req.params;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 10;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const user: any = await UserModel.findById(id);

            if (!user) throw new Error('Please provide valid id');
            const query = {
                uploader: user.id,
            };
            const videos = await Videomodel.find(query)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);

            const count = await UserModel.countDocuments(query);
            const total = Math.ceil(count / limit);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'search result',
                    videos,
                    pagination: {
                        total,
                        page: parseInt(page),
                        next:
                            parseInt(page) < total ? parseInt(page) + 1 : null,
                        prev:
                            parseInt(page) <= total && parseInt(page) !== 1
                                ? parseInt(page) - 1
                                : null,
                    },
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    users: [],
                    pagination: {},
                },
            });
        }
    };
}

export default SearchControllerForGuest;
