import { Request, Response, NextFunction } from 'express';
import VideoModel from '../../Models/Video';
import FavoriteModel from '../../Models/Favorite';
import MusicModel from '../../Models/Music';
import EditorChoiceModel from '../../Models/EditorChoice';
import { getSongIDAndType, formatSong } from '../../Helper/utilis';
import SpotifyForGuest from '../Spotify/SpotifyForGuest';
/**
 * Crown Controller Class
 *  @author Dolly Garg <dolly.garg@jploft.in>
 */
class MusicControllerForGuest {
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

    getSong = async () => {
        try {
            const trackID = this.req.query.songID;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            let isFavourite = false;
            const { id, type } = getSongIDAndType(trackID);
            let music = {};
            let songID = null;
            let song = null;
            const fav = await FavoriteModel.findOne({
                songID: trackID
            });
            // we need to get id and get song data and  other information accordingy
            if (fav) {
                isFavourite = true;
            }

            // get all videos belongs to this songID
            const query = {
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
                    const result = await SpotifyForGuest.getTrack(songID);
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
}

export default MusicControllerForGuest;
