import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import EditorCategoryController from '../Controller/EditorChoice/EditorCategoryController';
import EditorChoiceController from '../Controller/EditorChoice/EditorChoiceController';
import jwtverify from '../Middlewares/jwtVerify';
router.get(
    '/category',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorCategoryController(req, res, next).index();
    }
);

router.post(
    '/category',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorCategoryController(req, res, next).add();
    }
);

router.get(
    '/category/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorCategoryController(req, res, next).show();
    }
);

router.put(
    '/category/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorCategoryController(req, res, next).update();
    }
);
router.delete(
    '/category/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorCategoryController(req, res, next).delete();
    }
);

router.get(
    '/song',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorChoiceController(req, res, next).index();
    }
);

router.post(
    '/song',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorChoiceController(req, res, next).add();
    }
);
router.get(
    '/song/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorChoiceController(req, res, next).show();
    }
);

router.delete(
    '/song/:id',
    jwtverify,
    (req: Request, res: Response, next: NextFunction) => {
        new EditorChoiceController(req, res, next).delete();
    }
);

export default router;
