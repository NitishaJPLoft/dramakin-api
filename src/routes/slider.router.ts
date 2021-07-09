import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import SliderController from '../Controller/Slider/SliderController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';

router.get(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new SliderController(req, res, next).show();
    }
);

router.delete(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new SliderController(req, res, next).delete();
    }
);

router.post(
    '/',
    jwtverify,
    // verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new SliderController(req, res, next).create();
    }
);

router.get(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new SliderController(req, res, next).index();
    }
);

export default router;
