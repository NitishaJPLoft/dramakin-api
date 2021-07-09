import { stringifyUrl } from 'query-string';
import axios from 'axios';
import moment from 'moment';

class Facebook {
    /**
     * Get Oauth Uri
     */
    static getOauthUri = (type: string) => {
        const url = stringifyUrl({
            url: 'https://www.facebook.com/v7.0/dialog/oauth',
            query: {
                scope:
                    type === 'facebook'
                        ? 'email,user_friends,user_age_range,user_birthday,user_gender,user_hometown'
                        : 'email,instagram_basic',
                access_type: 'offline',
                include_granted_scopes: 'true',
                response_type: 'code',
                state: type,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                client_id: process.env.FACEBOOK_CLIENT_ID,
            },
        });

        return url;
    };

    /**
     * Get oauth token
     */
    static getToken = async (code: string) => {
        const url = stringifyUrl({
            url: 'https://graph.facebook.com/v7.0/oauth/access_token',
            query: {
                code: code,
                client_id: process.env.FACEBOOK_CLIENT_ID,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                grant_type: 'authorization_code',
            },
        });

        const response = await axios.get(url);
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
    static refreshToken = async (code: string) => {
        const url = stringifyUrl({
            url: 'https://graph.facebook.com/v7.0/oauth/access_token',
            query: {
                fb_exchange_token: code,
                client_id: process.env.FACEBOOK_CLIENT_ID,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                grant_type: 'fb_exchange_token',
            },
        });

        const response = await axios.get(url);
        const tokens = response.data;
        const generated_at = moment().unix();

        return {
            ...tokens,
            generated_at,
        };
    };

    static getUserInfo = async (token: string) => {
        const url = stringifyUrl({
            url: 'https://graph.facebook.com/v7.0/me',
            query: {
                fields:
                    'gender,email,about,address,birthday,age_range,first_name,last_name,middle_name,name',
                access_token: token,
            },
        });
        const response = await axios.get(url);
        const data = response.data;
        return data;
    };

    static getUserProfilePic = async (id: number, token: string) => {
        const url = stringifyUrl({
            url: `https://graph.facebook.com/v7.0/${id}/picture`,
            query: {
                redirect: 'false',
                access_token: token,
            },
        });
        const response = await axios.get(url);
        const data = response.data.data;
        return data;
    };
}

export default Facebook;
