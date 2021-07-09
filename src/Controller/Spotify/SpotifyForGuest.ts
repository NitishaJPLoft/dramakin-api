import { stringifyUrl } from 'query-string';
import axios from 'axios';

class SpotifyForGuest {
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

    static getTrack = async (id: string) => {
        const url = `https://api.spotify.com/v1/tracks/${id}`;
        const response = await axios.get(url, {
            params: {
                market: 'from_token',
            }
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

export default SpotifyForGuest;
