import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import LanguageController from '../Controller/Language/LanguageController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).index();
    }
);
router.post(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).create();
    }
);

router.get(
    '/prefered',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).getPrefered();
    }
);

router.get(
    '/prefered/:languageID',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).removePrefered();
    }
);

router.delete(
    '/prefered/:languageID',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).removePrefered();
    }
);

router.post(
    '/prefered',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new LanguageController(req, res, next).setPrefered();
    }
);

export default router;
