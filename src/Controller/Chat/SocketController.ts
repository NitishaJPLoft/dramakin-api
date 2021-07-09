import UserModel from '../../Models/User';
import ConversationModel from '../../Models/Conversations';
import ChatModel from '../../Models/Chat';
import LastMessageModel from '../../Models/LastMessage';
import { verify, decode } from 'jsonwebtoken';
import Notification from '../../Helper/Notification';
import { getName } from '../../Helper/utilis';
class SocketController {
    getname = (firstName, middleName, lastName) => {
        const fName = firstName ? firstName : ' ';
        const mName = middleName ? middleName : ' ';
        const lName = lastName ? lastName : ' ';
        const name = fName + ' ' + mName + ' ' + lName;
        return name;
    };
    login = async (data: any, socket) => {
        try {
            const conversationID = data.conversationID;
            const token = data.token;
            const reciverID = data.userID;
            if (!conversationID || !token || !reciverID)
                throw new Error(
                    'Please send token, conversation id and other user id as userID'
                );
            const appSecret: any = process.env.JWT_SECRET;
            verify(token, appSecret); // verify token
            const decodedToken: any = decode(token); // decode
            const { uid } = decodedToken; // destructure
            const sender: any = await UserModel.findById(uid).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );
            if (!sender)
                throw new Error('sender not found. Please check your token.');
            const reciver: any = await UserModel.findById(reciverID).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );
            if (!reciver) throw new Error('other user not found.');
            const conversation = await ConversationModel.findById(
                conversationID
            );
            if (!conversation) throw new Error('invalid room id');

            const users = conversation.users;
            let result = {
                element: {},
                index: 0,
            };

            const senderID = sender._id;
            users.forEach((element, index) => {
                if (element.user.toString() === senderID.toString()) {
                    console.log('jjjjjj', index);
                    result.element = element;
                    result.index = index;
                }
            });

            const user = users[result.index];
            user.isOnline = true;
            await conversation.save();
            socket.join(conversationID);

            // update socket's rooms
            // if (socket.rooms) {
            //     socket.rooms.push(conversationID);
            // } else {
            //     socket.rooms = [conversationID];
            // }

            return {
                message: 'You are connected now',
                conversationID: conversation._id,
            };
        } catch (error) {
            const result = {
                message: error.message,
                conversationID: '',
            };

            return result;
        }
    };
    send = async (data: any, socket) => {
        console.log('fghdghfghg', data);
        const conversationID = data.conversationID;
        try {
            const token = data.token;
            const reciverID = data.userID;
            const message = data.message;
            if (!conversationID || !token || !reciverID || !message)
                throw new Error(
                    'Please send token, conversation id, other user id as userID and message'
                );
            const appSecret: any = process.env.JWT_SECRET;
            verify(token, appSecret); // verify token
            const decodedToken: any = decode(token); // decode
            const { uid } = decodedToken; // destructure
            const sender = await UserModel.findById(uid).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );
            if (!sender)
                throw new Error('sender not found. Please check your token.');
            const reciver: any = await UserModel.findById(reciverID).select(
                'id  username  firstName middleName lastName name image isUserVerified'
            );
            if (!reciver) throw new Error('other user not found.');
            const conversation: any = await ConversationModel.findById(
                conversationID
            );
            let name = getName(sender);
            // conversation.softDeletedBy.toString() === reciverID.toString()
            if (conversation.isSoftDeleted) {
                // change softdeleted to false
                await ConversationModel.findOneAndUpdate(
                    { _id: conversationID },
                    {
                        isSoftDeleted: false,
                    }
                );
            }

            if (!conversation)
                throw new Error('please provide valid conversation id');

            const lastMessage = await LastMessageModel.findOne({
                user: sender,
                conversation: conversation,
            }).sort({ createdAt: -1 });
            const newData = {
                message,
                user: sender,
                isOnline: true,
                type: 'sender',
                conversationID: conversation._id,
                senderID: sender,
                receiverID: reciver,
                lastmessage: lastMessage ? lastMessage.lastmessage : '',
                last_messaged_at: lastMessage ? lastMessage.createdAt : ' ',
            };

            await new LastMessageModel({
                user: sender,
                conversation,
                lastmessage: message,
            }).save();

            const chat = await new ChatModel(newData).save();
            conversation.messages.push(chat);
            await conversation.save();
            const result = {
                message,
                conversationID,
                user: sender,
                createdAt: chat.createdAt,
            };

            socket.to(conversationID).emit('message', message);
            // send notification
            await Notification.send(
                reciverID,
                {
                    title: name,
                    body: name + ' sent you message',
                    intent: 'chat',
                    targetID: conversationID,
                    targetUser: sender,
                    username: sender.username,
                    userID: sender.id,
                    otherUserID: reciverID,
                    tokenUserID: uid,
                },
                'chat'
            );
            return result;
        } catch (error) {
            const result = {
                message: error.message,
                conversationID,
                user: '',
                createdAt: '',
            };
            console.log('error', result);
            socket
                .to(conversationID)
                .emit(
                    'message',
                    'this message can not be sent. please try again'
                );
            return result;
        }
    };
}

export default new SocketController();
