import { Request, Response, NextFunction } from 'express';
import GoogleOauth from './Google';
import FacebookOauth from './Facebook';
import { stringifyUrl } from 'query-string';
import { sign } from 'jsonwebtoken';
import UserModel from '../../Models/User';
import logger from '../../utilis/logger';
import VideoPreferenceModel from '../../Models/VideosPreference';
import {
    constructName,
    generateUserName,
    generateOTP,
} from '../../Helper/auth';
import PreferedLanguageModel from '../../Models/PreferedLanguage';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class OAuthController {
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

    generateToken = (uid: any) => {
        const appSecret: any = process.env.JWT_SECRET;
        const token = sign(
            {
                uid: uid,
                scope: 'user',
            },
            appSecret
        );

        return token;
    };

    /**
     * Initiate facebook Login Dialog
     */
    initiateFacebookLogin = (type: string) => {
        try {
            const url = FacebookOauth.getOauthUri(type);
            this.res.redirect(url);
        } catch (error) {
            const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
            const redirectUri = stringifyUrl({
                url: messegeUri,
                query: {
                    error: 'true',
                    provider: type,
                    reason: error.message,
                },
            });
            this.res.redirect(redirectUri);
        }
    };

    /**
     * Login with facebook
     */
    loginWithFacebook = async () => {
        console.log('query', this.req.query);
        if (this.req.query.code) {
            const type: any = this.req.query.state;
            const code: any = this.req.query.code;
            try {
                // get facebook token
                const tokens = await FacebookOauth.getToken(code);
                const access_token = tokens.access_token;
                // get facebook user information
                const user = await FacebookOauth.getUserInfo(access_token);
                const ID = user.id;
                // get facebook profile url
                const image = await FacebookOauth.getUserProfilePic(
                    ID,
                    access_token
                );
                // create object to save in db

                const data = {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    ...user,
                    image: image.url,
                    username: generateUserName(),
                };

                console.log('data', data);

                // insert or update
                const doc: any = await UserModel.findOneAndUpdate(
                    { email: user.email },
                    data,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                const jwtToken = this.generateToken(doc._id);
                const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
                const redirectUri = stringifyUrl({
                    url: messegeUri,
                    query: {
                        success: 'true',
                        provider: type,
                        token: jwtToken,
                    },
                });
                this.res.redirect(redirectUri);
            } catch (error) {
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
                    provider: 'facebook',
                    reason: 'You are not authorized to view this resource',
                },
            });
            this.res.redirect(redirectUri);
        }
    };

    /**
     * Initiate Google Login Dialog
     */
    initiateGoogleLogin = () => {
        try {
            const url = GoogleOauth.getOauthUri();
            this.res.redirect(url);
        } catch (error) {
            const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
            const redirectUri = stringifyUrl({
                url: messegeUri,
                query: {
                    error: 'true',
                    provider: 'google',
                    reason: error.message,
                },
            });
            this.res.redirect(redirectUri);
        }
    };

    /**
     * Login with google
     */
    loginWithGoogle = async () => {
        if (this.req.query.code) {
            try {
                const tokens = await GoogleOauth.getToken(this.req.query.code);
                const id_token = tokens.id_token;
                const data = await GoogleOauth.getUserInfo(id_token);
                console.log('google oauth data', data);

                // insert or update
                const doc: any = await UserModel.findOneAndUpdate(
                    { email: data.email },
                    {
                        firstName: data.given_name,
                        lastName: data.family_name,
                        image: data.picture,
                        isEmailVerified: data.email_verified,
                        username: generateUserName(),
                        ...data,
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                const jwtToken = this.generateToken(doc._id);
                const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
                const redirectUri = stringifyUrl({
                    url: messegeUri,
                    query: {
                        success: 'true',
                        provider: 'google',
                        token: jwtToken,
                    },
                });
                this.res.redirect(redirectUri);
            } catch (error) {
                const messegeUri: any = process.env.OAUTH_MESSEGE_URI;
                const redirectUri = stringifyUrl({
                    url: messegeUri,
                    query: {
                        error: 'true',
                        provider: 'google',
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
                    provider: 'google',
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

    sdklogin = async () => {
        try {
            const email = this.req.body.email;
            const name = this.req.body.name;
            const mobile = this.req.body.mobile;
            let data: any = {};
            let user;
            let videoPreference;
            let isFound = false;

            // check if user exsist with email
            if (email) {
                user = await UserModel.findOne({ email });
                if (!user) data.email = email;
                user ? (isFound = true) : false;
            }
            if (mobile && !isFound) {
                user = await UserModel.findOne({ mobile });
                if (!user) data.mobile = mobile;
                user ? (isFound = true) : false;
            }

            if (name && !isFound) {
                console.log('case3');
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
                data.username = generateUserName();
                user = await new UserModel({
                    ...data,
                }).save();
                videoPreference = await new VideoPreferenceModel({
                    user,
                }).save();
            }

            // generate token
            const token = this.generateToken(user._id);
            const languages = await PreferedLanguageModel.find({
                user: user._id,
            }).populate('language');

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'user logedin successfully',
                    user,
                    token,
                    languages: languages ? languages : [],
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    user: '',
                    token: '',
                },
            });
        }
    };
}

export default OAuthController;
