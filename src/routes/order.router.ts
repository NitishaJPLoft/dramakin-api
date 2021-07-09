import express, { Request, Response, NextFunction } from 'express';
import OrderController from '../Controller/Transaction/OrderController';
const router = express.Router();
import jwtverify from '../Middlewares/jwtVerify';
router.post(
    '/',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new OrderController(req, res, next).getOrderId();
    }
);

export default router;
