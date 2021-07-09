import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import SpotifyControllerForGuest from '../Controller/Spotify/SpotifyControllerForGuest';
import MusicControllerForGuest from '../Controller/Music/MusicControllerForGuest';
router.get(
    '/search',
    (req: Request, res: Response, next: NextFunction) => {
        new SpotifyControllerForGuest(req, res, next).search();
    }
);

router.get(
    '/:id',
    (req: Request, res: Response, next: NextFunction) => {
        new SpotifyControllerForGuest(req, res, next).getTrack();
    }
);

router.get(
    '/',
    (req: Request, res: Response, next: NextFunction) => {
        new MusicControllerForGuest(req, res, next).getSong();
    }
);

export default router;
