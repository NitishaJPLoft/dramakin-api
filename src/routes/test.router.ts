import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import jwtverify from '../Middlewares/jwtVerify';
import UserModel from '../Models/User';
router.get(
    '/',
    jwtverify,
    async (req: Request, res: Response, next: NextFunction) => {
        const users = await UserModel.find({});

        for (const user of users) {
            if (user.usersBlockedMe.length > 0) {
                console.log('user.usersBlockedMe', user.usersBlockedMe);
            }

            if (user.blockedUsers.length > 0) {
                console.log('user.blockedUsers', user.blockedUsers);
                //  user.blockedUsers = [];
                // await user.save();
                //console.log(user.blockedUsers);
            }
        }
        // get all users
        res.json({
            users,
        });
    }

    // get token user.  get list of users who has been blocked by this user.

    // now when sending notification dont send notification if uid is in this array

    // on serach

    // get user blocked me array and  .  _id should not be in that array
);

export default router;
