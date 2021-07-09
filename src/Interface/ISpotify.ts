import { Document } from 'mongoose';
export interface ISpotify extends Document {
    access_token: string;
    token_type: string;
    expires_in: number;
    generated_at: number;
    refresh_token: string;
    scope: string;
    isManuallyAdded: boolean;
}
