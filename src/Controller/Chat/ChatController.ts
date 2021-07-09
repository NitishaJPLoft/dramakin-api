import { Request, Response, NextFunction } from 'express';
import UserModel from '../../Models/User';
import ConversationsModel from '../../Models/Conversations';
import ChatModel from '../../Models/Chat';
import LastMessageModel from '../../Models/LastMessage';
import ClearedChatModel from '../../Models/ClearedChat';
import { io } from '../../index';
import Notification from '../../Helper/Notification';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class ChatController {
    req: any;
    res: Response;
    next: NextFunction;

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
    }

    getname = (firstName, middleName, lastName) => {
        const fName = firstName ? firstName : ' ';
        const mName = middleName ? middleName : ' ';
        const lName = lastName ? lastName : ' ';
        const name = fName + ' ' + mName + ' ' + lName;
        return name;
    };

    index = async () => {
        try {
            const uid = this.req.uid;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            const user: any = await UserModel.findById(uid).select(
                'id  username  firstName middleName lastName name image isUserVerified blockedUsers'
            );

            console.log('blockedUsers', user.blockedUsers);
            const query = {
                $or: [{ user: user }, { me: user }],
                user: { $nin: [...user.blockedUsers] },
                me: { $nin: [...user.blockedUsers] },
            };
            console.log('query', query);
            const chats: any = await ConversationsModel.find(query)
                .populate([
                    {
                        path: 'user',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified email',
                    },
                    {
                        path: 'me',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified email',
                    },
                    {
                        path: 'messages',
                        populate: {
                            path: 'user',
                            select:
                                'id  username  firstName middleName lastName name image isUserVerified email',
                        },
                        options: {
                            limit: 1,
                            sort: { createdAt: -1 },
                        },
                    },
                ])
                .select('-users')
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit))
                .sort([['createdAt', -1]]);
            // console.log('uid', uid);
            for (const chat of chats) {
                if (user._id.toString() === chat.user._id.toString()) {
                    chat.user = chat.me;
                    chat.me = user;
                    await chat.save();
                }
            }

            // console.log('chats', chats);
            const results = [];
            chats.filter(chat => {
                // there will be two case
                if (chat.messages.length > 0) {
                    // 1. chat is not softDeleted
                    if (chat.isSoftDeleted === false) {
                        results.push(chat);
                    } else {
                        // check
                        if (
                            chat.softDeletedBy &&
                            chat.softDeletedBy.toString() !== uid
                        ) {
                            results.push(chat);
                        }
                    }
                }
            });

            // console.log('filtered chats', results);

            const count = await ConversationsModel.countDocuments(query);
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'chat list',
                    chats: results,
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    next: parseInt(page) < total ? parseInt(page) + 1 : null,
                    prev:
                        parseInt(page) <= total && parseInt(page) !== 1
                            ? parseInt(page) - 1
                            : null,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    chats: [],
                },
            });
        }
    };

    create = async () => {
        try {
            const uid = this.req.uid;
            const { userID } = this.req.body;
            if (!uid || !userID)
                throw new Error(
                    'please send token as bearer token and id in request body'
                );
            const sender: any = await UserModel.findById(uid);
            const receiver: any = await UserModel.findById(userID);

            const conversationFound = await ConversationsModel.findOne({
                $or: [
                    { me: sender, user: receiver },
                    { me: receiver, user: sender },
                ],
            });

            if (conversationFound) {
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'conversation initiated',
                        conversation: conversationFound._id,
                    },
                });
            } else {
                const conversation = await new ConversationsModel({
                    user: receiver,
                    me: sender,
                    users: [
                        {
                            user: sender,
                            isInitiatedConversation: true,
                            isOnline: true,
                        },

                        {
                            user: receiver,
                            isInitiatedConversation: true,
                        },
                    ],
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'conversation initiated',
                        conversation: conversation._id,
                    },
                });
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    conversation: '',
                },
            });
        }
    };

    show = async () => {
        try {
            const uid = this.req.uid;
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;
            const { id } = this.req.params;
            const cleareChat = await ClearedChatModel.findOne({
                user: uid,
                conversationID: id,
            });
            const clearedIDs: any = cleareChat ? cleareChat.chat : [];
            const chats = await ChatModel.find({
                conversationID: id,
            })
                .populate({
                    path: 'user',
                    select:
                        'id  username  firstName middleName lastName name image isUserVerified',
                })
                .sort([['createdAt', -1]]);

            let filtered = [];
            chats.forEach(chat => {
                // console.log(clearedIDs.includes(chat._id));
                if (!clearedIDs.includes(chat._id)) {
                    filtered.push(chat);
                }
            });
            const cc = await ConversationsModel.findById(id);
            const count = cc ? cc.messages.length : 0;
            const total = Math.ceil(count / limit);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'messages',
                    //  clearedIDs,
                    //  length1: clearedIDs.length,
                    //  chatLenght: count,
                    //  filteredLength: filtered.length,
                    chats: filtered,
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    next: parseInt(page) < total ? parseInt(page) + 1 : null,
                    prev:
                        parseInt(page) <= total && parseInt(page) !== 1
                            ? parseInt(page) - 1
                            : null,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    chats: [],
                },
            });
        }
    };

    message = async () => {
        try {
            const uid = this.req.uid;
            const { id } = this.req.params;
            const { userID, message } = this.req.body;
            if (!message || !id || !userID)
                throw new Error(
                    'please send token as bearer token and chat room id and message in request body'
                );
            const sender: any = await UserModel.findById(uid).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );

            const receiver: any = UserModel.findById(userID);
            if (!receiver) throw new Error('invalid user id');
            const conversation: any = await ConversationsModel.findById(id);

            if (!conversation)
                throw new Error('please provide valid conversation id');
            if (
                conversation.isSoftDeleted &&
                conversation.softDeletedBy.toString() === userID.toString()
            ) {
                // change softdeleted to false
                await ConversationsModel.findOneAndUpdate(
                    { _id: id },
                    {
                        isSoftDeleted: false,
                    }
                );
            }

            const lastMessage = await LastMessageModel.findOne({
                conversation: conversation,
            }).sort({ createdAt: -1 });

            const data = {
                message,
                user: sender,
                isOnline: true,
                type: 'sender',
                conversationID: conversation._id,
                senderID: sender,
                receiverID: receiver._id,
                lastmessage: lastMessage ? lastMessage.lastmessage : '',
                last_messaged_at: lastMessage ? lastMessage.createdAt : ' ',
            };

            await new LastMessageModel({
                user: sender,
                conversation,
                lastmessage: message,
            }).save();

            const chat = await new ChatModel(data).save();
            conversation.messages.push(chat);
            await conversation.save();
            const result = {
                message,
                conversationID: conversation._id,
            };

            io.to(conversation._id).emit('message', result);

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'messages sent successfully',
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

    search = async () => {
        try {
            const limit =
                this.req.query.limit && parseInt(this.req.query.limit) !== 0
                    ? this.req.query.limit
                    : 2;
            const page =
                this.req.query.page && parseInt(this.req.query.page) !== 0
                    ? this.req.query.page
                    : 1;

            const user: any = await UserModel.findById(this.req.uid).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );

            const q = this.req.query.q;
            if (!q) throw new Error('please provide a query');

            const query = {
                $or: [{ user: user }, { me: user }],
            };
            const chats: any = await ConversationsModel.find(query)
                .populate([
                    {
                        path: 'user',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified',
                    },
                    {
                        path: 'me',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified',
                    },
                    {
                        path: 'messages',
                        populate: {
                            path: 'user',
                            select:
                                'id  username  firstName middleName lastName name image isUserVerified',
                        },
                        options: {
                            limit: 1,
                            sort: { createdAt: -1 },
                        },
                    },
                ])
                .select('-users');

            for (const chat of chats) {
                if (user._id.toString() === chat.user._id.toString()) {
                    chat.user = chat.me;
                    chat.me = user;
                    await chat.save();
                }
            }

            const query1 = {
                me: user,
            };

            const searchChat: any = await ConversationsModel.find(query1)
                .populate([
                    {
                        path: 'user',
                        match: {
                            $or: [
                                {
                                    firstName: { $regex: q, $options: 'i' },
                                },
                                {
                                    middleName: { $regex: q, $options: 'i' },
                                },
                                {
                                    lastName: { $regex: q, $options: 'i' },
                                },
                                {
                                    username: { $regex: q, $options: 'i' },
                                },
                            ],
                        },
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified',
                    },
                    {
                        path: 'me',
                        select:
                            'id  username  firstName middleName lastName name image isUserVerified',
                    },
                    {
                        path: 'messages',
                        populate: {
                            path: 'user',
                            select:
                                'id  username  firstName middleName lastName name image isUserVerified',
                        },
                        options: {
                            limit: 1,
                            sort: { createdAt: -1 },
                        },
                    },
                ])
                .select('-users');

            const searchChat1 = searchChat.filter(chat => chat.user);
            const count = await ConversationsModel.countDocuments(query1);
            const total = Math.ceil(count / limit);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'chat list',
                    chats: searchChat1,
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    next: parseInt(page) < total ? parseInt(page) + 1 : null,
                    prev:
                        parseInt(page) <= total && parseInt(page) !== 1
                            ? parseInt(page) - 1
                            : null,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    chats: [],
                },
            });
        }
    };

    delete = async () => {
        try {
            const uid = this.req.uid;
            const { id } = this.req.params;
            if (!id) throw new Error('Please provde conversation id');
            // soft delete it
            const coversation = await ConversationsModel.findByIdAndUpdate(
                {
                    _id: id,
                },
                {
                    isSoftDeleted: true,
                    softDeletedBy: uid,
                },
                { new: true }
            );

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'conversation deleted',
                },
                coversation,
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    };

    clear = async () => {
        try {
            const uid = this.req.uid;
            const { id } = this.req.params;
            if (!id) throw new Error('Please provde conversation id');
            //
            const messages = await ChatModel.find({
                conversationID: id,
            });

            // check if clearchat is already exsist

            const isExsist = await ClearedChatModel.findOne({
                user: uid,
                conversationID: id,
            });

            if (isExsist) {
                console.log('already found');
                for (const message of messages) {
                    isExsist.chat.push(message._id);
                }

                await isExsist.save();
            } else {
                console.log('creating new ');
                const cleareChat = new ClearedChatModel({
                    user: uid,
                    conversationID: id,
                });
                for (const message of messages) {
                    cleareChat.chat.push(message._id);
                }

                await cleareChat.save();
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'conversation cleared',
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
        }
    };
}

export default ChatController;
