import { Request, Response, NextFunction } from 'express';
import WalletModel from '../../Models/Wallet';
import TransactionModel from '../../Models/Transaction';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import PaytmChecksum from 'paytmchecksum';

/**
 * Wallet Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class PaytmController {
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

    getToken = async () => {
        const { mid, orderId } = this.req.body;
        const url = `https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;
        const body = JSON.stringify({ ...this.req.body });

        const checksum = await PaytmChecksum.generateSignature(
            body,
            'gkWnaXaddaxmgx1Y'
        );

        const paytmParams = {
            head: {
                signature: checksum,
            },
            body: {
                ...this.req.body,
            },
        };
        const { data } = await axios.post(url, {
            ...paytmParams,
        });
        this.res.json({
            paytmParams,
            body,
            checksum,
            data,
        });
    };

    buy = async () => {
        try {
            const userID = this.req.uid;
            const crown = parseInt(this.req.body.crown);
            const amount = this.req.body.amount;
            const transactionID = this.req.body.transactionID;
            if (!crown || !amount || !transactionID)
                throw new Error(
                    'Please provide crown, amount and transactionID in request body'
                );
            if (Math.sign(crown) === -1 || crown === 0)
                throw new Error('crown can not be 0 or negetive');
            // check if user wallet available
            let wallet = await WalletModel.findOne({
                userID: userID,
            });
            // get balance
            let balance = wallet ? wallet.balance : 0;
            // if no wallet available create
            if (!wallet) {
                wallet = await new WalletModel({
                    balance: 0,
                    userID: userID,
                }).save();
            }

            const newBalance = balance + crown;

            // update wallet balance
            await wallet.updateOne({
                balance: newBalance,
            });

            // save transaction
            const orderID = uuidv4();
            const status = 'completed';
            // save transaction
            await new TransactionModel({
                userID,
                crown,
                amount,
                transactionID,
                orderID,
                status,
            }).save();

            const data = {
                userID,
                crown,
                amount,
                transactionID,
                orderID,
                status,
                balance: newBalance,
            };

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'transaction completed',
                    transaction: data,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    transaction: {},
                },
            });
        }
    };
}

export default PaytmController;
