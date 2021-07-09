import express, { Request, Response, NextFunction } from 'express';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
const router = express.Router();
import SpotifyController from '../Controller/Spotify/SpotifyController';
import jwtverify from '../Middlewares/jwtVerify';
import MusicController from '../Controller/Music/MusicController';

router.post(
    '',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new MusicController(req, res, next).addMusic();
    }
);

router.get(
    '/search',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new SpotifyController(req, res, next).search();
    }
);
router.get(
    '/recommendation',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new SpotifyController(req, res, next).getRecommendation();
    }
);

router.get(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new SpotifyController(req, res, next).getTrack();
    }
);

router.get(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new MusicController(req, res, next).index();
    }
);

router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new MusicController(req, res, next).getSong();
    }
);

router.delete(
    '/:id',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new MusicController(req, res, next).deleteEntry();
    }
);

export default router;
