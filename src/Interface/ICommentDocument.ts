import { Document } from 'mongoose';
export interface ICommentDocument extends Document {
    body: string;
    video: Array<[]>;
    like: Array<[]>;
    isLiked: boolean;
    commentor: object;
}
