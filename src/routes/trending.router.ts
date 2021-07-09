import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import HashtagController from '../Controller/Hashtag/HashtagController';
import jwtverify from '../Middlewares/jwtVerify';
router.get(
    '/hashtag',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new HashtagController(req, res, next).trending();
    }
);

export default router;
