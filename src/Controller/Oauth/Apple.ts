import { Request, Response, NextFunction } from 'express';
import { sign } from 'jsonwebtoken';
import UserModel from '../../Models/User';
import AppleModel from '../../Models/Apple';
import logger from '../../utilis/logger';
import VideoPreferenceModel from '../../Models/VideosPreference';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class Apple {
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
     * generate jwt token
     */
    generateUserName = () => {
        const unique = Math.floor(
            1000000000000000 + Math.random() * 9000000000000000
        );
        const username =
            'dramaking' + Math.floor(Math.random() * 100 + 1) + unique;
        return username;
    };

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

    login = async () => {
        try {
            const userIdentifier = this.req.body.userIdentifier;
            const email = this.req.body.email;
            const name = this.req.body.name;
            let doc;
            let user;
            if ((userIdentifier && email) || name) {
                //  doc if not exsist
                doc = await AppleModel.findOneAndUpdate(
                    { userIdentifier },
                    { email, name },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } else {
                doc = await AppleModel.findOne({
                    userIdentifier,
                });
            }

            let data: any = {};
            data.email = doc.email;
            if (!doc.email) throw new Error('atleast email should be provided');
            if (doc.name) {
                const userName = doc.name;
                const nameArray = userName.split(' ');
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
            }
            // update or create user
            user = await UserModel.findOne({
                email: data.email,
            });

            if (!user) {
                user = new UserModel({
                    ...data,
                });

                await new VideoPreferenceModel({ user: user }).save();
            }
            // update or create videoPreference

            // generate token
            const token = this.generateToken(user._id);
            if (!user.username) {
                user.username = this.generateUserName();
                await user.save();
            } else {
                await user.save();
            }
            await doc.save();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'user logedin successfully',
                    user,
                    token,
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

export default Apple;
