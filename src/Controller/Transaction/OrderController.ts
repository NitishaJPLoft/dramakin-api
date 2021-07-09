import { Request, Response, NextFunction } from 'express';
import OrderModel from '../../Models/Order';
import { v4 as uuidv4 } from 'uuid';
/**
 * Wallet Controller Class
 * @author Dolly Garg
 */
class OrderController {
    req: any;
    res: Response;
    next: NextFunction;

    /**
     * Constructor
     * @param req express.Request
     * @param res express.Response
     * @param next express.NextFunction
     */

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
    }

    getOrderId = async () => {
        try {
            const userID = this.req.uid;
            const amount = this.req.body.amount;
            const currency = this.req.body.currency;
            const receipt = uuidv4();
            if (!amount)
                throw new Error('Please provide amount in request body');
            // save order
            const order = await new OrderModel({
                userID,
                amount,
                currency,
                receipt,
            }).save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'order created',
                    order,
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

export default OrderController;
