import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import CategoryController from '../Controller/Video/ReportCategoryController';
import ReportController from '../Controller/Video/ReportController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';

router.get(
    '/category',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new CategoryController(req, res, next).index();
    }
);
router.post(
    '/category',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CategoryController(req, res, next).create();
    }
);
router.get(
    '/category/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CategoryController(req, res, next).show();
    }
);

router.put(
    '/category/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CategoryController(req, res, next).update();
    }
);

router.delete(
    '/category/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new CategoryController(req, res, next).delete();
    }
);

router.get(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new ReportController(req, res, next).index();
    }
);
router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new ReportController(req, res, next).create();
    }
);
router.get(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new ReportController(req, res, next).show();
    }
);

router.put(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new ReportController(req, res, next).update();
    }
);

router.delete(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new ReportController(req, res, next).delete();
    }
);

export default router;
