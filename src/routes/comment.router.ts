import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import CommentController from '../Controller/Comment/CommentController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
router.put(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).update();
    }
);
router.delete(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).deleteEntry();
    }
);

export default router;
