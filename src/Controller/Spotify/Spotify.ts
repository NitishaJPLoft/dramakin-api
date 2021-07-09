import { stringifyUrl, stringify } from 'query-string';
import axios from 'axios';
import moment from 'moment';

class Spotify {
    /**
     * Get Oauth Uri
     */
    static getOauthUri = () => {
        const url = stringifyUrl({
            url: 'https://accounts.spotify.com/authorize',
            query: {
                scope: 'user-read-private user-read-email',
                access_type: 'offline',
                include_granted_scopes: 'true',
                response_type: 'code',
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
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
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
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
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            grant_type: 'refresh_token',
        });

        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
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

    static search = async (
        q: string,
        token: string,
        limit: number,
        offset: number
    ) => {
        const url = 'https://api.spotify.com/v1/search';
        const response = await axios.get(url, {
            params: {
                q,
                limit,
                offset,
                type: 'track',
                market: 'from_token',
            },
            headers: {
                Authorization: `Bearer  ${token}`,
            },
        });

        return response.data.tracks;
    };

    static getTrack = async (id: string, token: string) => {
        const url = `https://api.spotify.com/v1/tracks/${id}`;
        const response = await axios.get(url, {
            params: {
                market: 'from_token',
            },
            headers: {
                Authorization: `Bearer  ${token}`,
            },
        });

        return response.data;
    };

    static getRecommendation = async (
        token: string,
        limit: number,
        offset: number
    ) => {
        const url = 'https://api.spotify.com/v1/recommendations';
        const response = await axios.get(url, {
            params: {
                limit,
                offset,
                market: 'from_token',
                seed_genres: 'comedy,roc,pop,hip-hop,disco',
            },
            headers: {
                Authorization: `Bearer  ${token}`,
            },
        });

        return response.data;
    };
}

export default Spotify;
