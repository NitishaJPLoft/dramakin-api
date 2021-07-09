import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import WalletController from '../Controller/Wallet/WalletController';
import jwtverify from '../Middlewares/jwtVerify';
import verifyAdminScope from '../Middlewares/verifyAdminScope';
router.get(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new WalletController(req, res, next).show();
    }
);
router.post(
    '/',
    jwtverify,
    verifyAdminScope,
    (req: Request, res: Response, next: NextFunction) => {
        new WalletController(req, res, next).add();
    }
);

export default router;
