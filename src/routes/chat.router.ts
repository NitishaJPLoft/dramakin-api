import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import ChatController from '../Controller/Chat/ChatController';
import jwtverify from '../Middlewares/jwtVerify';

router.get(
    '/search',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).search();
    }
);
router.get(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).show();
    }
);

router.delete(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).delete();
    }
);

router.post(
    '/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).message();
    }
);

router.post(
    '/:id/clear',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).clear();
    }
);
router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).create();
    }
);

router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ChatController(req, res, next).index();
    }
);

export default router;
