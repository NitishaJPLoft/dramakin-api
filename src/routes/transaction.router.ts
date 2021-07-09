import express, { Request, Response, NextFunction } from 'express';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
const router = express.Router();
import TransactionController from '../Controller/Transaction/TransactionController';
import PaytmController from '../Controller/Transaction/PaytmController';
import jwtverify from '../Middlewares/jwtVerify';

router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new TransactionController(req, res, next).buy();
    }
);
router.post(
    '/checksum',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new PaytmController(req, res, next).getToken();
    }
);

router.get(
    '/history',
    jwtverify,
    verifyAdminScope,
    (req: any, res: Response, next: NextFunction) => {
        new TransactionController(req, res, next).getPaymentHistory();
    }
);

export default router;
