import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import AuthController from '../Controller/Auth/AuthController';
import jwtverify from '../Middlewares/jwtVerify';

router.post('/otp', (req: Request, res: Response, next: NextFunction) => {
    new AuthController(req, res, next).sendOTP();
});

router.post(
    '/otp/verify',
    (req: Request, res: Response, next: NextFunction) => {
        new AuthController(req, res, next).verifyOtp();
    }
);

router.post('/signup', (req: Request, res: Response, next: NextFunction) => {
    new AuthController(req, res, next).signupWithEmail();
});

/**
 * Login Route
 */
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    new AuthController(req, res, next).login();
});

/**
 * Logout route
 */
router.post(
    '/logout',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new AuthController(req, res, next).logout();
    }
);

/**
 * Password Forgot Route
 */
router.post(
    '/password/forgot',
    (req: Request, res: Response, next: NextFunction) => {
        new AuthController(req, res, next).passwordForgot();
    }
);

/**
 * password reset
 */
router.post(
    '/password/reset',
    (req: Request, res: Response, next: NextFunction) => {
        new AuthController(req, res, next).passwordReset();
    }
);

export default router;
