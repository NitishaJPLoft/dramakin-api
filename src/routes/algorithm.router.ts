import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import AlgorithmController from '../Controller/Algorithm/AlgorithmController';
import jwtverify from '../Middlewares/jwtVerify';
import Mail from '../Helper/Mail';

router.get(
    '/viewcount',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new AlgorithmController(req, res, next).trending();
    }
);

export default router;
