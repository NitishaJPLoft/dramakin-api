import express, { Response, NextFunction } from 'express';
import jwtverify from '../Middlewares/jwtVerify';
import UserController from '../Controller/User/UserController';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
import PrivacyController from '../Controller/Privacy/PrivacyController';
const router = express.Router();

/**
 * Users Route
 */
router.get(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new UserController(req, res, next).index();
    }
);

/**
 * User Create Route
 */
router.post(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new UserController(req, res, next).create();
    }
);

/**
 * User Profile Route
 */
router.get('/me', jwtverify, (req: any, res: Response, next: NextFunction) => {
    new UserController(req, res, next).show();
});

/**
 * User Privacy Get Route
 */
router.get(
    '/me/privacy',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new PrivacyController(req, res, next).show();
    }
);

/**
 * User Privacy Update Route
 */
router.put(
    '/me/privacy',
    jwtverify,
    async (req: any, res: Response, next: NextFunction) => {
        new PrivacyController(req, res, next).update();
    }
);

/**
 * Update User Route
 */
router.put('/', jwtverify, (req: any, res: Response, next: NextFunction) => {
    new UserController(req, res, next).update();
});

/**
 * Delete User Route
 */

router.delete(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new UserController(req, res, next).deleteEntry();
    }
);

router.get('/:id', jwtverify, (req: any, res: Response, next: NextFunction) => {
    new UserController(req, res, next).getUser();
});

router.post(
    '/:id',
    jwtverify,
    (req: any, res: Response, next: NextFunction) => {
        new UserController(req, res, next).action();
    }
);

router.get('/docs/:id',
    jwtverify,
    (req: any, res: Response, next: NextFunction) => {
    new UserController(req, res, next).getDocuments();
});

export default router;
