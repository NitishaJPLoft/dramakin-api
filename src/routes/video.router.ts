import express, { Response, NextFunction } from 'express';
import jwtverify from '../Middlewares/jwtVerify';
import VideoController from '../Controller/Video/VideoController';
import CommentController from '../Controller/Comment/CommentController';
import UploadController from '../Controller/Video/UploadController';
const router = express.Router();

/**
 * get videos with pagination
 */
router.get(
    '/',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new VideoController(req, res, next).getVideos();
    }
);

router.get(
    '/search',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new VideoController(req, res, next).search();
    }
);

/**
 * upload video
 */
router.post(
    '/upload',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        // new VideoController(req, res, next).uploadVideo();
        new UploadController(req, res, next).upload();
    }
);

router.get(
    '/:videoID/comment/:commentID',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).shwoLike();
    }
);
router.post(
    '/:videoID/comment/:commentID',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).like();
    }
);

router.put(
    '/:videoID/comment/:commentID',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).update();
    }
);

router.delete(
    '/:videoID/comment/:commentID',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).deleteEntry();
    }
);
router.post(
    '/:id/comment',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).create();
    }
);

router.get(
    '/:id/comment',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new CommentController(req, res, next).show();
    }
);

router.post(
    '/:id',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new VideoController(req, res, next).action();
    }
);

router.delete(
    '/:id',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new VideoController(req, res, next).deleteEntry();
    }
);

router.get(
    '/:id',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new VideoController(req, res, next).getVideo();
    }
);

export default router;
