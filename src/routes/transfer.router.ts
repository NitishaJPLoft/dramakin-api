import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import TransferController from '../Controller/Transfer/TransferController';
import jwtverify from '../Middlewares/jwtVerify';
router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new TransferController(req, res, next).transfer();
    }
);

export default router;
