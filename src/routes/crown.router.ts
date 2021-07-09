import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import CrownController from '../Controller/Crown/CrownController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';

router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new CrownController(req, res, next).index();
    }
);
router.post(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CrownController(req, res, next).create();
    }
);
router.get(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CrownController(req, res, next).show();
    }
);

router.put(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CrownController(req, res, next).update();
    }
);

router.delete(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new CrownController(req, res, next).deleteEntry();
    }
);

export default router;
