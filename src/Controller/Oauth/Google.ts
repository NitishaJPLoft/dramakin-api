import { stringifyUrl, stringify } from 'query-string';
import axios from 'axios';
import moment from 'moment';

class Google {
    /**
     * Get Oauth Uri
     */
    static getOauthUri = () => {
        const url = stringifyUrl({
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            query: {
                scope: 'email profile openid',
                access_type: 'offline',
                include_granted_scopes: 'true',
                response_type: 'code',
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                client_id: process.env.GOOGLE_CLIENT_ID,
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
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const response = await axios.post(
            'https://oauth2.googleapis.com/token',
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

    /**
     * Get refresh token
     */
    static refreshToken = async (refreshCode: string) => {
        const data = stringify({
            refresh_token: refreshCode,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'refresh_token',
        });

        const response = await axios.post(
            'https://oauth2.googleapis.com/token',
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

    //

    static getUserInfo = async (id_token: string) => {
        const url = stringifyUrl({
            url: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
            query: {
                id_token,
            },
        });

        const response = await axios.get(url);
        const data = response.data;
        return data;
    };
}

export default Google;
