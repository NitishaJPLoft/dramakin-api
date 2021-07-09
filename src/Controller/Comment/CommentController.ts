import { Request, Response, NextFunction } from 'express';
import VideoModel from '../../Models/Video';
import UserModel from '../../Models/User';
import CommentModel from '../../Models/Comment';
import Notification from '../../Helper/Notification';
import { getName } from '../../Helper/utilis';
class CommentController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: any;

    /**
     * Constructor
     * @param req express.Request
     * @param res  express.Response
     * @param next   express.NextFunction
     */

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.bucket = process.env.DIGITAL_OCEAN_SPACE_NAME
            ? process.env.DIGITAL_OCEAN_SPACE_NAME
            : 'dramaking';
    }

    show = async () => {
        try {
            const { id } = this.req.params;
            console.log('id', id);
            const video: any = await VideoModel.findById(id)
                .select('-password')
                .populate('comments')
                .populate('commentor');

            if (!video) throw new Error('This video does not exsist');
            const comments: any = video.comments ? video.comments : [];
            const commentsCounts = comments.length;
            let data: any = [];
            for (let index = 0; index < commentsCounts; index++) {
                const comment = comments[index];
                const commmentor: any = await UserModel.findById(
                    comment.commentor
                );

                data.push({
                    video: comment.video,
                    like: comment.like,
                    isLiked: comment.like.includes(this.req.uid),
                    body: comment.body,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    id: comment._id,
                    commentedByImage: commmentor ? commmentor.image : '',
                    commmentorID: commmentor._id,
                    commentedByUserName: commmentor ? commmentor.username : '',
                    isUserVerified: commmentor
                        ? commmentor.isUserVerified
                        : false,
                });
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    comments: data,
                    commentsCounts,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    };

    shwoLike = async () => {
        try {
            const { commentID } = this.req.params;
            const uid = this.req.uid;
            const comment: any = await CommentModel.findById(commentID);
            const user: any = await UserModel.findById(comment.commentor);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    comment: {
                        body: comment.body,
                        isLiked: comment.like.includes(uid),
                        count: comment.like.length,
                        like: comment.like,
                        video: comment.video,
                        id: comment._id,
                        createdAt: comment.createdAt,
                        updatedAt: comment.updatedAt,
                        commentedByImage: user ? user.image : '',
                        commentedByUserName: user ? user.username : '',
                        isUserVerified: user ? user.isUserVerified : false,
                    },
                },
            });
        } catch (error) {
            console.log('error', error);

            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    comment: {},
                },
            });
        }
    };
    like = async () => {
        try {
            console.log('dfgdfgdf');
            const { commentID } = this.req.params;
            const { action } = this.req.body;
            console.log('action', action);
            const uid = this.req.uid;
            const user: any = await UserModel.findById(uid);
            const comment: any = await CommentModel.findById(commentID);
            const isLiked = comment.like.includes(uid);
            const commmentor: any = await UserModel.findById(comment.commentor);
            let name = getName(user);
            console.log('comment', comment);
            const isCommmentorrAndUserSame =
                commmentor.id.toString() === uid.toString();
            console.log('isUploaderAndUserSame', isCommmentorrAndUserSame);
            const video: any = await VideoModel.findById(comment.video);
            switch (action) {
                case 'like':
                    if (isLiked) {
                        comment.isLiked = true;
                        await comment.save();
                    } else {
                        comment.like.push(user);
                        comment.isLiked = true;
                        await comment.save();
                    }

                    console.log('commmentor', commmentor._id, 'uid', uid);
                    // send notification

                    console.log({
                        title: name,
                        body: name + ' liked your comment',
                        intent: 'video-comment-like',
                        targetID: comment.video,
                        ll: commmentor._id,
                        imageUrl: video.thumbnails,
                    });

                    if (!isCommmentorrAndUserSame) {
                        await Notification.send(commmentor._id, {
                            title: name,
                            body: name + ' liked your comment',
                            intent: 'video-comment-like',
                            targetID: comment.video,
                            targetUser: user,
                            otherUserID: commmentor._id,
                            tokenUserID: uid,
                            imageUrl: video.thumbnails,
                        });
                    }

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'Your have liked this comment',
                            comment: {
                                body: comment.body,
                                isLiked: true,
                                count: comment.like.length,
                                like: comment.like,
                                video: comment.video,
                                id: comment._id,
                                createdAt: comment.createdAt,
                                updatedAt: comment.updatedAt,
                                commentedByImage: commmentor
                                    ? commmentor.image
                                    : '',
                                commentedByUserName: commmentor
                                    ? commmentor.username
                                    : '',
                                isUserVerified: commmentor
                                    ? commmentor.isUserVerified
                                    : false,
                            },
                        },
                    });

                    break;

                case 'dislike':
                    comment.isLiked = false;
                    comment.like.pull(user);
                    await comment.save();

                    this.res.status(200).json({
                        status: 200,
                        message: 'success',
                        data: {
                            message: 'Your have unliked this comment',
                            comment: {
                                body: comment.body,
                                isLiked: true,
                                count: comment.like.length,
                                like: comment.like,
                                video: comment.video,
                                id: comment._id,
                                createdAt: comment.createdAt,
                                updatedAt: comment.updatedAt,
                                commentedByImage: commmentor
                                    ? commmentor.image
                                    : '',
                                commentedByUserName: commmentor
                                    ? commmentor.username
                                    : '',
                                isUserVerified: commmentor
                                    ? commmentor.isUserVerified
                                    : false,
                            },
                        },
                    });

                    break;

                default:
                    throw new Error('this action is not supported');
            }
        } catch (error) {
            console.log('error', error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    comment: {},
                },
            });
        }
    };

    create = async () => {
        try {
            const { comment } = this.req.body;
            const { id } = this.req.params;
            const uid = this.req.uid;
            const video: any = await VideoModel.findById(id);
            if (!video) throw new Error('This video does not exsist');
            const user: any = await UserModel.findById(uid);
            let name = getName(user);
            // create comment
            const commentDoc: any = await new CommentModel({
                body: comment,
                video: video,
                commentor: user,
            }).save();
            video.comments.push(commentDoc);
            user.comments.push(commentDoc);
            await user.save();
            await video.save();
            console.log(
                'video.uploader._id.toString()',
                video.uploader._id.toString()
            );
            console.log('uid.toString()', uid.toString());
            const isUploaderAndUserSame =
                video.uploader._id.toString() === uid.toString();
            console.log('isUploaderAndUserSame', isUploaderAndUserSame);
            if (!isUploaderAndUserSame) {
                // send notification
                await Notification.send(video.uploader, {
                    title: name,
                    body: name + ' commented on your video',
                    intent: 'video-comment',
                    targetID: video._id,
                    targetUser: user,
                    otherUserID: video.uploader,
                    tokenUserID: uid,
                    imageUrl: video.thumbnails,
                });
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Your comment is posted',
                    comment: {
                        id: commentDoc._id,
                        body: commentDoc.body,
                        video: video._id,
                        commentedByImage: user.image,
                        commentedByUserName: user.username,
                        isUserVerified: user.isUserVerified,
                        createdAt: commentDoc.createdAt,
                        updatedAt: commentDoc.updatedAt,
                    },
                },
            });
        } catch (error) {
            console.log('error', error);

            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    comment: {},
                },
            });
        }
    };

    update = async () => {
        try {
            //5f488abf528fed1964dbf4aa
            const { commentID } = this.req.params;
            const uid = this.req.uid;
            const body = this.req.body.comment;
            console.log(body);
            const comment = await CommentModel.findById(commentID);
            if (!comment) throw new Error('invalid comment id');
            console.log('uid', uid, 'comment.commentor', comment.commentor);
            if (uid.toString() !== comment.commentor.toString())
                throw new Error('you can not edit other user comment');
            const doc = await CommentModel.findOneAndUpdate(
                {
                    _id: commentID,
                },
                {
                    body,
                },
                { new: true }
            );
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'comment',
                    comment: doc,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    comment: {},
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const { commentID, videoID } = this.req.params;
            const uid = this.req.uid;
            const commentDoc = await CommentModel.findById(commentID);
            if (!commentDoc) throw new Error('invalid comment id');
            const user: any = await UserModel.findById(uid);
            const video: any = await VideoModel.findById(videoID);
            if (!video) throw new Error('invalid video id');
            await commentDoc.deleteOne();
            video.comments.pull(commentDoc);
            user.comments.pull(commentDoc);
            await user.save();
            await video.save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'comment deleted',
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    comment: {},
                },
            });
        }
    };
}

export default CommentController;
