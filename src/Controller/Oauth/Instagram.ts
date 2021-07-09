import { stringifyUrl, stringify } from 'query-string';
import axios from 'axios';
import moment from 'moment';

/**
 * Instgram basic Display API . Not sutaible for oauth as it doent return email or mobile
 */
class Instagram {
    /**
     * Get Oauth Uri
     */
    static getOauthUri = () => {
        const url = stringifyUrl({
            url: 'https://api.instagram.com/oauth/authorize',
            query: {
                scope: 'user_profile,user_media',
                access_type: 'offline',
                include_granted_scopes: 'true',
                response_type: 'code',
                redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
                client_id: process.env.INSTAGRAM_CLIENT_ID,
            },
        });

        return url;
    };

    /**
     * Get oauth token
     */
    static getToken = async (code: any) => {
        const data = stringify({
            code: code,
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const response = await axios.post(
            'https://api.instagram.com/oauth/access_token',
            data,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const tokens = response.data;
        console.log('get token response', tokens);
        const generated_at = moment().unix();

        return {
            ...tokens,
            generated_at,
        };
    };

    /**
     * Get refresh token
     */
    static refreshToken = async (refreshCode: string) => {
        const data = stringify({
            refresh_token: refreshCode,
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
            grant_type: 'refresh_token',
        });

        const response = await axios.post(
            'https://graph.instagram.com/refresh_access_token',
            data,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const tokens = response.data;
        const generated_at = moment().unix();

        return {
            ...tokens,
            generated_at,
        };
    };

    static getUserInfo = async (token: string) => {
        const url = stringifyUrl({
            url: 'https://graph.instagram.com/me',
            query: {
                fields: 'id,username',
                access_token: token,
            },
        });
        const response = await axios.get(url);
        const data = response.data;
        console.log('get user info', data);
        return data;
    };
}

export default Instagram;
