import {Request, Response, NextFunction} from 'express';
import AWS, {S3} from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';
import {isEmpty} from 'lodash';
import VideoModel from '../../Models/Video';
import Spotify from '../Spotify/Spotify';
import moment from 'moment';
import SpotifyModel from '../../Models/Spotify';
import FavoriteModel from '../../Models/Favorite';
import UserModel from '../../Models/User';
import MusicModel from '../../Models/Music';
import EditorChoiceModel from '../../Models/EditorChoice';
import {getSongIDAndType, formatSong} from '../../Helper/utilis';

/**
 * Crown Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class MusicController {
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

    getCdnUrl = path => {
        return this.cdn + '/' + path;
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
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
            // console.log('jjj');
            const tokens = await Spotify.refreshToken(refresh_token);
            // console.log(' tokens', tokens);
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

        // console.log(doc);

        return access_token;
    };

    addMusic = async () => {
        try {
            const {songName, singer} = this.req.body;
            const song = this.req.files.url;
            const path = 'mp3/' + uuidv4() + '/';
            const songpath = path + song.name;
            const songMimeType =
                song && song.mimetype ? song.mimetype : 'audio/mpeg';
            const songUrl = this.getCdnUrl(songpath);
            await this.uploadObject({
                Bucket: this.bucket,
                Key: songpath,
                Body: song.data,
                ACL: 'public-read',
                ContentType: songMimeType,
                ContentDisposition: 'inline',
            });
            const thumbnail =this.req.files.thumbnail;
            const thumbPath = 'thumbnail/' + uuidv4() + '/';
            const thumbnailPath = thumbPath + thumbnail.name;
            const thumbnailMimeType =
                thumbnail && thumbnail.mimetype ? thumbnail.mimetype : 'image/jpeg';
            const thumbUrl = this.getCdnUrl(thumbnailPath);
            await this.uploadObject({
                Bucket: this.bucket,
                Key: thumbnailPath,
                Body: thumbnail.data,
                ACL: 'public-read',
                ContentType: thumbnailMimeType,
                ContentDisposition: 'inline',
            });
                await new MusicModel({
                    songName,
                    singer,
                    url: songUrl,
                    thumbnail: thumbUrl,
                    songID: 'admin-' + uuidv4(),
                    user: this.req.uid
                }).save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Music data added',
                    songName,
                    singer,
                    url: songUrl,
                    thumbnail: thumbUrl,
                    user: this.req.uid
                },
            });

        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    musics: [],
                },
            });
        }
    };

    getSong = async () => {
        try {
            const trackID = this.req.query.songID;
            const uid = this.req.uid;
            const user = await UserModel.findById(uid);
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            let isFavourite = false;
            const {id, type} = getSongIDAndType(trackID);
            let music = {};
            let songID = null;
            let song = null;
            const fav = await FavoriteModel.findOne({
                songID: trackID,
                user: uid,
            });
            // we need to get id and get song data and  other information accordingy
            if (fav) {
                isFavourite = true;
            }

            // get all videos belongs to this songID
            const query = {
                uploader: {$nin: [user.blockedUsers, uid]},
                songID: trackID,
            };

            console.log('query ', query);
            const videos = await VideoModel.find(query)
            //  .select('id  originalVideo thumbnails ')
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await VideoModel.countDocuments(query);
            const total = Math.ceil(count / limit);
            switch (type) {
                case 'local':
                    songID = trackID;
                    song = await MusicModel.findOne({
                        songID,
                    });
                    music = formatSong(
                        trackID,
                        song.songName,
                        song.thumbnail,
                        song.url,
                        song.singer
                    );
                    break;
                case 'camera':
                    songID = trackID;
                    song = await MusicModel.findOne({
                        songID,
                    });

                    console.log(song);
                    music = formatSong(
                        trackID,
                        song.songName,
                        song.thumbnail,
                        song.url,
                        song.singer
                    );
                    break;
                case 'db':
                    songID = id;
                    song = await EditorChoiceModel.findById(songID);
                    music = formatSong(
                        trackID,
                        song.name,
                        song.thumbnail,
                        song.song,
                        song.singer
                    );
                    break;

                case 'spotify':
                    songID = id;
                    const token = await this.getToken();
                    const result = await Spotify.getTrack(songID, token);
                    const {
                        id: spotifyID,
                        name,
                        preview_url,
                        uri,
                        album,
                        artists,
                    } = result;
                    // get first thumbnail
                    const thumbnail = album.images ? album.images.shift() : {};
                    music = {
                        id: spotifyID,
                        name,
                        thumbnail,
                        preview_url,
                        uri,
                        artists,
                    };
                    break;

                default:
                    music = {
                        id: '',
                        name: '',
                        thumbnail: {
                            height: 640,
                            url: 'https://dramaking.in/images/icons/logo.png',
                            width: 640,
                        },
                        preview_url: '',
                        uri: '',
                        artists: [
                            {
                                external_urls: {
                                    spotify: '',
                                },
                                href: '',
                                id: '',
                                name: 'unknown',
                                type: 'artist',
                                uri: '',
                            },
                        ],
                    };

                    break;
            }
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'list',
                    song: music,
                    videos,
                    count,
                    isFavMusic: isFavourite,
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
                    lists: [],
                    pagination: {},
                },
            });
        }

        // we need do multiple things here

        //get music details
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
            const populateFields = [{path: 'user', select: 'username'}, {path: 'video', select: 'thumbnails'}];
            const musics = await MusicModel.find({}, ['url', 'songID', 'songName', 'singer', 'thumbnail', 'video', 'user'])
                .populate(populateFields)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await MusicModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    musics
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
                    musics: [],
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const {id} = this.req.params;
            const music: any = await MusicModel.findById(id);
            /*const comments: any = await CommentModel.find({
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
                    console.log(user);
                    await user.uploadedVideos.pull(video);
                    await user.likedVideos.pull(video);
                    await user.dislikedVideos.pull(video);
                    await user.sharedVideos.pull(video);
                    await user.dislikedVideos.pull(video);
                    await user.viewedVideos.pull(video);
                }
            }*/

            await music.deleteOne();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Music deleted successfully',
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

export default MusicController;
