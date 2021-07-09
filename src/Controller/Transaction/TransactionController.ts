import { Request, Response, NextFunction } from 'express';
import WalletModel from '../../Models/Wallet';
import TransactionModel from '../../Models/Transaction';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wallet Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class TransactionController {
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
                throw new Error('crown can not be 0 or negative');
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

    getPaymentHistory = async () => {
        try {
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const populateFields = [{path: 'userID', select: 'firstName lastName middleName username'}];
            const history = await TransactionModel.find({}, ['userID', 'crown', 'amount', 'transactionID', 'status', 'createdAt'])
                .populate(populateFields)
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            for (let i in history) {
                if (history.hasOwnProperty(i)) {
                    history[i] = history[i].toObject();
                    const firstName = history[i].userID['firstName'] ? history[i].userID['firstName'] : '';
                    const middleName = history[i].userID['middleName'] ? history[i].userID['middleName'] : '';
                    const lastName = history[i].userID['lastName'] ? history[i].userID['lastName'] : '';
                    history[i].userID['name'] = firstName + ' ' + middleName + ' ' + lastName;
                }
            }
            const count = await TransactionModel.countDocuments({});
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    history
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    next: parseInt(page) < total ? parseInt(page) + 1 : null,
                    prev:
                        parseInt(page) <= total && parseInt(page) !== 1
                            ? parseInt(page) - 1
                            : null,
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

export default TransactionController;
