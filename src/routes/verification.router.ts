import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import VerificationController from '../Controller/Verification/VerificationController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
router.post(
    '/otp',
    // jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).sendOTP();
    }
);
router.post(
    '/otp/verify',
    // jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).verifyOtp();
    }
);

router.get(
    '/document',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).getDocuments();
    }
);
router.post(
    '/document',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).uploadDocuments();
    }
);

router.post(
    '/approve',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).approve();
    }
);

router.delete(
    '/:id',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new VerificationController(req, res, next).deleteEntry();
    }
);

export default router;
