import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import NotificationController from '../Controller/Notifications/NotificationController';
import jwtverify from '../Middlewares/jwtVerify';
router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).index();
    }
);
router.get(
    '/video',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).videos();
    }
);
router.get(
    '/update',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).getVersion();
    }
);
router.post(
    '/update',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).setVersion();
    }
);
router.get(
    '/test',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).test();
    }
);

router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).addToken();
    }
);

router.put(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).update();
    }
);

router.delete(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new NotificationController(req, res, next).deleteAll();
    }
);

export default router;
