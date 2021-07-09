import express, { Response, NextFunction } from 'express';
import VideoControllerForGuest from '../Controller/Video/videoControllerForGuest';
const router = express.Router();

/**
 * get videos with pagination
 */
router.get(
    '/',
    async (req: any, res: Response, next: NextFunction) => {
        new VideoControllerForGuest(req, res, next).getVideos();
    }
);

router.get(
    '/search',
    async (req: any, res: Response, next: NextFunction) => {
        new VideoControllerForGuest(req, res, next).search();
    }
);

router.get(
    '/:id',
    async (req: any, res: Response, next: NextFunction) => {
        new VideoControllerForGuest(req, res, next).getVideo();
    }
);

export default router;
