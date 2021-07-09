import express, { Response, NextFunction } from 'express';
import UserControllerForGuest from '../Controller/User/UserControllerForGuest';
const router = express.Router();

/**
 * Users Route
 */

router.get('/:id', (req: any, res: Response, next: NextFunction) => {
    new UserControllerForGuest(req, res, next).getUser();
});

export default router;
