import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import PrivacyController from '../Controller/Privacy/PrivacyController';
import jwtverify from '../Middlewares/jwtVerify';
router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new PrivacyController(req, res, next).show();
    }
);
router.put(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new PrivacyController(req, res, next).update();
    }
);

export default router;
