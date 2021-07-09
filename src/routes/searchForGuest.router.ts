import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import SearchControllerForGuest from '../Controller/Search/SearchControllerForGuest';
import Mail from '../Helper/Mail';

router.get(
    '/',
    (req: Request, res: Response, next: NextFunction) => {
        new SearchControllerForGuest(req, res, next).search();
    }
);

router.get(
    '/users',
    (req: Request, res: Response, next: NextFunction) => {
        new SearchControllerForGuest(req, res, next).searchAllUsers();
    }
);

router.get(
    '/user/:id/videos',
    (req: Request, res: Response, next: NextFunction) => {
        new SearchControllerForGuest(req, res, next).getAllVideosOFusers();
    }
);

router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await Mail.send('jaiprakash.sharma44@gmail.com', 'test', 'test');
        res.send('ok');
    } catch (error) {
        console.error(error.message);
        res.send('error');
    }
});

export default router;
