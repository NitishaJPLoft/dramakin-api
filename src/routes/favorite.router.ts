import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import FavouriteController from '../Controller/Favorite/FavouriteController';
import jwtverify from '../Middlewares/jwtVerify';
router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new FavouriteController(req, res, next).index();
    }
);
router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new FavouriteController(req, res, next).create();
    }
);
router.get(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new FavouriteController(req, res, next).show();
    }
);
router.put(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new FavouriteController(req, res, next).update();
    }
);
router.delete(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new FavouriteController(req, res, next).delete();
    }
);

export default router;
