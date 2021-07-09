import { Request, Response, NextFunction } from 'express';
import Spotify from './Spotify';
import SpotifyModel from '../../Models/Spotify';
import MusicModel from '../../Models/Music';
import moment from 'moment';
import { getSongIDAndType, formatSong } from '../../Helper/utilis';

/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class SpotifyController {
    req: Request;
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

    search = async () => {
        try {
            const query: any = this.req.query.q;
            const requestLimit: any = this.req.query.limit;
            const requestPage: any = this.req.query.page;

            const limit =
                requestLimit && parseInt(requestLimit) !== 0
                    ? parseInt(requestLimit)
                    : 20;
            const page =
                requestPage && parseInt(requestPage) !== 0
                    ? parseInt(requestPage)
                    : 1;

            const offset = (page - 1) * limit + 1;
            const access_token = await this.getToken();

            const result = await Spotify.search(
                query,
                access_token,
                limit,
                offset
            );

            const count = result.total;
            const total = Math.ceil(count / (page * limit));

            // total limit offset
            let music: any = [];
            result.items.forEach(element => {
                // remove null preview url
                if (element.preview_url) {
                    music.push({
                        preview_url: element.preview_url,
                        uri: element.uri,
                        id: element.id,
                        name: element.name,
                        artists: element.artists,
                        thumbnail: element.album.images.pop(),
                    });
                }
            });
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'music list',
                    music,
                },
                pagination: {
                    total,
                    page,
                    next: page < total ? page + 1 : null,
                    prev: page <= total && page !== 1 ? page - 1 : null,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.response
                        ? error.response.data
                        : error.message,
                    music: [],
                },
            });
        }
    };

    getTrack = async () => {
        try {
            const trackID = this.req.params.id;
            const { id, type } = getSongIDAndType(trackID);
            let music = {};
            let song = null;
            let songID = null;
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
                        artists: [],
                    };
                    break;
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'music',
                    music,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.response
                        ? error.response.data
                        : error.message,
                    music: {},
                },
            });
        }
    };

    getRecommendation = async () => {
        try {
            const requestLimit: any = this.req.query.limit;
            const requestPage: any = this.req.query.page;

            const limit =
                requestLimit && parseInt(requestLimit) !== 0
                    ? parseInt(requestLimit)
                    : 20;
            const page =
                requestPage && parseInt(requestPage) !== 0
                    ? parseInt(requestPage)
                    : 1;

            const offset = (page - 1) * limit + 1;
            const access_token = await this.getToken();
            const result = await Spotify.getRecommendation(
                access_token,
                limit,
                offset
            );
            let music: any = [];
            result.tracks.forEach(element => {
                // remove null preview url
                if (element.preview_url) {
                    music.push({
                        preview_url: element.preview_url,
                        uri: element.uri,
                        id: element.id,
                        name: element.name,
                        thumbnail: element.album.images.pop(),
                    });
                }
            });

            const lastSeed = result.seeds.pop();
            const count = lastSeed.afterRelinkingSize;
            const total = Math.ceil(count / (page * limit));
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'music',
                    music: result,
                    pagination: {
                        total,
                        page,
                        next: page < total ? page + 1 : null,
                        prev: page <= total && page !== 1 ? page - 1 : null,
                    },
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.response
                        ? error.response.data
                        : error.message,
                    music: [],
                },
            });
        }
    };
}

export default SpotifyController;
