import { Request, Response, NextFunction } from 'express';
import FavoriteModel from '../../Models/Favorite';
import Spotify from '../Spotify/Spotify';
import SpotifyModel from '../../Models/Spotify';
import moment from 'moment';
import UserModel from '../../Models/User';
import VideoModel from '../../Models/Video';
import { getSongIDAndType, formatSong } from '../../Helper/utilis';
import MusicModel from '../../Models/Music';
import EditorChoiceModel from '../../Models/EditorChoice';

class FavouriteController {
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
                { _id: doc.id },
                {
                    ...tokens,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token
                        ? tokens.refresh_token
                        : doc.refresh_token,
                    generated_at: moment().unix(),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        // console.log(doc);
        return access_token;
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
            const q = { user: this.req.uid };
            const favorites = await FavoriteModel.find(q)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            const count = await FavoriteModel.countDocuments(q);
            const total = Math.ceil(count / limit);

            let result = [];
            let music = {};
            let songID = null;
            let song = null;

            for (const favorite of favorites) {
                const trackID = favorite.songID;
                const { id, type } = getSongIDAndType(trackID);
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
                        const thumbnail = album.images
                            ? album.images.shift()
                            : {};
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
                                url:
                                    'https://dramaking.in/images/icons/logo.png',
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

                result.push({
                    favorite,
                    music,
                });
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Favorite list',
                    favorites: result,
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
                    favorites: [],
                },
                pagination: {},
            });
        }
    };

    create = async () => {
        try {
            const uid = this.req.uid;
            const { songID, songName } = this.req.body;
            const favorite = await new FavoriteModel({
                songID,
                songName,
                user: uid,
            }).save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Favorite added',
                    favorite,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    favorite: {},
                },
            });
        }
    };
    show = async () => {
        try {
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const uid = this.req.uid;
            const user = await UserModel.findById(uid);
            const { id } = this.req.params;
            const favorite = await FavoriteModel.findById(id);
            const trackID = favorite.songID;
            const token = await this.getToken();
            const result = await Spotify.getTrack(trackID, token);
            const { name, preview_url, uri, album, artists } = result;
            // get first thumbnail
            const thumbnail = album.images ? album.images.shift() : {};
            const music = {
                id,
                name,
                thumbnail,
                preview_url,
                uri,
                artists,
            };
            // get all videos belongs to this songID
            const query = {
                uploader: { $nin: [user.blockedUsers, uid] },
                songID: id,
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
                    message: 'Favorite details',
                    favorite,
                    music,
                    videoCount: count,
                    videos: await this.formatVideos(songVideos, uid),
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
                    favorite: {},
                    videos: [],
                },
                pagination: {},
            });
        }
    };

    update = async () => {
        try {
            const { id } = this.req.params;
            // find and update return new doc and exclude password
            const favorite = await FavoriteModel.findOneAndUpdate(
                { _id: id },
                {
                    ...this.req.body,
                },
                { new: true }
            ).exec();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Favorite updated successfully',
                    favorite,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    favorite: {},
                },
            });
        }
    };

    delete = async () => {
        try {
            const { songID } = this.req.query;
            const uid = this.req.uid;
            if (!songID) throw new Error('Please provide id');
            const dd = await FavoriteModel.findOneAndDelete({
                songID,
                user: uid,
            });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Favorite deleted successfully',
                    dd,
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

export default FavouriteController;
