import { Request, Response, NextFunction } from 'express';
import WalletModel from '../../Models/Wallet';

/**
 * Wallet Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class WalletController {
    req: any;
    res: Response;
    next: NextFunction;

    /**
     * Constructor
     * @param req express.Request
     * @param res  express.Response
     * @param next   express.NextFunction
     */

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
    }

    add = async () => {
        try {
            const balance = this.req.body.balance;
            const userID = this.req.body.userID;
            if (!balance || !userID)
                throw new Error('Please provide balance and userID');
            const wallet = await new WalletModel({
                balance,
                userID,
            }).save();

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'wallet created',
                    wallet,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };

    show = async () => {
        try {
            const uid = this.req.uid;
            const wallet = await WalletModel.findOne({
                userID: uid,
            });
            const balance = wallet ? wallet.balance : 0;
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'wallet balance',
                    balance,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    crown: {},
                },
            });
        }
    };
}

export default WalletController;
