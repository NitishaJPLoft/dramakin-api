import { Request, Response, NextFunction } from 'express';
import { verify, decode } from 'jsonwebtoken';
import UserModel from '../Models/User';

/**
 *  Extract token from request
 * @param req  express.Request
 */
const extractToken = (req: Request) => {
    if (req.headers.authorization) {
        const header = req.headers.authorization.split(' ');
        const type = header[0]; // Bearer
        const token = header[1]; // jwt token
        if (type === 'Bearer') {
            return token;
        }
        return null;
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
};

/**
 *  jwt verify middleware
 * @param req  express.Request
 * @param res  express.Response
 * @param next  express.NextFunction
 */
const jwtVerify = async (req: any, res: Response, next: NextFunction) => {
    if (req.query.token || req.headers.authorization) {
        try {
            const token: any = extractToken(req);
            const appSecret: any = process.env.JWT_SECRET;
            verify(token, appSecret); // verify token
            const decodedToken: any = decode(token); // decode
            const { uid, scope } = decodedToken; // destructure
            // check if valid id
            const user = await UserModel.findOne({ _id: uid }).exec();
            if (!user)
                throw new Error(
                    'Oh no ! Looks like you are not logged in. Please login again. If the problem continues please clear your app data and cache'
                );
            req.token = token;
            req.uid = uid;
            req.scope = scope;
            req.user = user;
            next();
        } catch (error) {
            res.status(403).json({
                status: 403,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    } else {
        res.status(403).json({
            status: 403,
            message: 'error',
            data: {
                message: 'jwt token not found in req. Please send jwt token',
            },
        });
    }
};

export default jwtVerify;
