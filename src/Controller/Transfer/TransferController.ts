import { Request, Response, NextFunction } from 'express';
import WalletModel from '../../Models/Wallet';
import UserModel from '../../Models/User';
import TransferModel from '../../Models/Transfer';
import { v4 as uuidv4 } from 'uuid';
import Notification from '../../Helper/Notification';
import { getName } from '../../Helper/utilis';

/**
 * Wallet Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class TransferController {
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

    transfer = async () => {
        try {
            const receiverID = this.req.body.receiverID;
            const receiver = await UserModel.findById(receiverID);
            if (!receiver)
                throw new Error('This receiverId user does not exsist');
            const senderID = this.req.uid;
            const sender: any = await UserModel.findById(senderID);
            const crown = parseInt(this.req.body.crown);
            let name = getName(sender);
            if (!crown)
                throw new Error('Please provide how many crown to be sent');
            console.log(30 + crown);
            if (Math.sign(crown) === -1 || crown === 0)
                throw new Error('crown can not be 0 or negetive');

            //check if in sender's wallet there is enough crown balance

            const senderWallet = await WalletModel.findOne({
                userID: senderID,
            });
            if (!senderWallet) throw new Error('Please purchase crown first');
            const senderBalance = senderWallet.balance;
            if (senderBalance < crown)
                throw new Error(
                    "You don't have enough crown balance. please purchase first"
                );

            const newSenderBalance = senderBalance - crown;
            // update balance in wallet
            await senderWallet.updateOne({
                balance: newSenderBalance,
            });

            // update reciver wallet

            let receiverWallet = await WalletModel.findOne({
                userID: receiverID,
            });

            const receiverWalletBalance = receiverWallet
                ? receiverWallet.balance
                : 0;

            if (!receiverWallet) {
                // create receiverWallet
                receiverWallet = await new WalletModel({
                    balance: crown,
                    userID: receiverID,
                }).save();
            } else {
                await receiverWallet.updateOne({
                    balance: receiverWalletBalance + crown,
                });
            }

            const orderID = uuidv4();
            const status = 'completed';
            // save transfer
            const transfer = await new TransferModel({
                senderID,
                receiverID,
                crown,
                orderID,
                status,
            }).save();
            // data to send
            const data = {
                senderID,
                receiverID,
                crown,
                orderID,
                status,
                balance: newSenderBalance,
            };

            // send notification
            await Notification.send(receiverID, {
                title: name,
                body: name + ' sent you ' + crown + ' crown',
                intent: 'crown',
                targetID: transfer._id,
                targetUser: sender,
                tokenUserID: this.req.uid,
            });

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'crown gifted',
                    transfer: data,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    transfer: {},
                },
            });
        }
    };
}

export default TransferController;
