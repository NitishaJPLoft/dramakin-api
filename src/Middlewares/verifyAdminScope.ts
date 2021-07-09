import { Response, NextFunction } from 'express';

const verifyAdminScope = (req: any, res: Response, next: NextFunction) => {
    const allowedScopes = ['admin'];
    if (allowedScopes.includes(req.scope)) {
        next();
    } else {
        res.status(403).json({
            status: 403,
            message: 'error',
            data: {
                message: 'You are not allowed to view this resoure',
            },
        });
    }
};

export default verifyAdminScope;
