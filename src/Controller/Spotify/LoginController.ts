import { Request, Response, NextFunction } from 'express';
import Spotify from './Spotify';
import { stringifyUrl } from 'query-string';
import logger from '../../utilis/logger';
import SpotifyModel from '../../Models/Spotify';
class LoginController {
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

    /**
     * Initiate facebook Login Dialog
     */
    initiateLogin = () => {
        try {
            const url = Spotify.getOauthUri();
            console.log('url', url);
            this.res.redirect(url);
        } catch (error) {
            console.log('error1', error);
            const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
            const redirectUri = stringifyUrl({
                url: messegeUri,
                query: {
                    error: 'true',
                    provider: 'spotify',
                    reason: error.message,
                },
            });
            this.res.redirect(redirectUri);
        }
    };

    /**
     * Login with facebook
     */
    login = async () => {
        console.log('query', this.req.query);
        if (this.req.query.code) {
            const type: any = this.req.query.state;
            const code: any = this.req.query.code;
            try {
                const tokens = await Spotify.getToken(code);
                console.log('tokens', tokens);

                //update or create one
                const doc = await SpotifyModel.findOneAndUpdate(
                    { isManuallyAdded: true },
                    { ...tokens },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
                const redirectUri = stringifyUrl({
                    url: messegeUri,
                    query: {
                        success: 'true',
                        provider: 'spotify',
                        ...tokens,
                        doc,
                    },
                });
                this.res.redirect(redirectUri);
            } catch (error) {
                console.log(error);
                const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
                const redirectUri = stringifyUrl({
                    url: messegeUri,
                    query: {
                        error: 'true',
                        provider: type,
                        reason: error.message,
                    },
                });
                logger.error(error);
                this.res.redirect(redirectUri);
            }
        } else {
            const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
            const redirectUri = stringifyUrl({
                url: messegeUri,
                query: {
                    error: 'true',
                    provider: 'shopify',
                    reason: 'You are not authorized to view this resource',
                },
            });
            this.res.redirect(redirectUri);
        }
    };

    /**
     * Show Message after login is successful, failed or cancelled by user
     */
    showMessage = () => {
        console.log('show message', this.req.query);
        if (Object.keys(this.req.query).length !== 0) {
            this.res.status(200).json(this.req.query);
        } else {
            const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
            const redirectUri = stringifyUrl({
                url: messegeUri,
                query: {
                    error: 'true',
                    reason: 'You are not authorized to view this resource',
                },
            });
            this.res.redirect(redirectUri);
        }
    };
}

export default LoginController;
