import express, { Request, Response, NextFunction } from 'express';
import OAuthController from '../Controller/Oauth/OauthController';
import SpotifyLoginController from '../Controller/Spotify/LoginController';
import Apple from '../Controller/Oauth/Apple';
const router = express.Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
    new OAuthController(req, res, next).sdklogin();
});
router.post('/apple', (req: Request, res: Response, next: NextFunction) => {
    new Apple(req, res, next).login();
});

/**
 * Facebook Login Route
 */
router.get('/facebook', (req: Request, res: Response, next: NextFunction) => {
    new OAuthController(req, res, next).initiateFacebookLogin('facebook');
});

/**
 * facebook callback
 */
router.get(
    '/facebook/callback',
    async (req: Request, res: Response, next: NextFunction) => {
        new OAuthController(req, res, next).loginWithFacebook();
    }
);

/**
 * Facebook Login Route
 */
router.get('/spotify', (req: Request, res: Response, next: NextFunction) => {
    new SpotifyLoginController(req, res, next).initiateLogin();
});

/**
 * facebook callback
 */
router.get(
    '/spotify/callback',
    async (req: Request, res: Response, next: NextFunction) => {
        new SpotifyLoginController(req, res, next).login();
    }
);

/**
 * Google  Login Route
 */
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
    new OAuthController(req, res, next).initiateGoogleLogin();
});

/**
 * Google Callback
 */
router.get(
    '/google/callback',
    async (req: Request, res: Response, next: NextFunction) => {
        new OAuthController(req, res, next).loginWithGoogle();
    }
);

/**
 * Instagram Login
 */
router.get('/instagram', (req: Request, res: Response, next: NextFunction) => {
    new OAuthController(req, res, next).initiateFacebookLogin('instagram');
});

/**
 * Message Route
 */
router.get('/message', (req: Request, res: Response, next: NextFunction) => {
    new OAuthController(req, res, next).showMessage();
});
export default router;
