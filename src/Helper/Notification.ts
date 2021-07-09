import NotificationModel from '../Models/Notification';
import SNSModel from '../Models/SNS';
import SNS from '../Controller/Notifications/SNS';
import PrivacyModel from '../Models/Privacy';
import UserModel from '../Models/User';
interface INotification {
    title: string;
    body: string;
    intent: string;
    targetID: string;
    action?: string;
    targetUser?: any;
    username?: any;
    userID?: any;
    otherUserID?: any;
    tokenUserID?: any;
    imageUrl?: string;
}
class Notification {
    async send(uid: any, data: INotification, type?: string) {
        try {
            const {
                title,
                body,
                intent,
                targetID,
                action,
                targetUser,
                username,
                userID,
                otherUserID,
                tokenUserID,
            } = data;
            const imageUrl = data.imageUrl ? data.imageUrl : '';
            console.log('otherUserID', otherUserID);
            console.log('tokenUserID', tokenUserID);
            const user = await UserModel.findById(tokenUserID);
            const userWhoBlockedMe = user.usersBlockedMe
                ? user.usersBlockedMe
                : [];

            const sns = await SNSModel.findOne({ user: uid });

            let privacy = await PrivacyModel.findOne({ user: uid });
            if (!privacy) {
                privacy = await new PrivacyModel({
                    user: uid,
                }).save();
            }
            const pushNotification = privacy.pushNotification;
            const chatNotification = privacy.chatNotification;
            const isUserBlockedMe = userWhoBlockedMe.includes(otherUserID);
            console.log('userWhoBlockedMe', userWhoBlockedMe);
            console.log('isUserBlockedMe ', isUserBlockedMe);
            let send = pushNotification;
            if (type === 'chat') {
                if (pushNotification && chatNotification) {
                    send = true;
                } else {
                    send = false;
                }
            }

            if (isUserBlockedMe) {
                send = false;
            }

            console.log('send', send);

            if (
                send &&
                sns &&
                sns.deviceID &&
                sns.deviceToken &&
                sns.awsArnEndpoint
            ) {
                let payload2 = JSON.stringify({
                    GCM: JSON.stringify({
                        notification: {
                            title,
                            body,
                            tag: {
                                intent,
                                targetID,
                                username: username ? username : null,
                                userID: userID ? userID : null,
                                imageUrl,
                            },
                        },
                    }),
                });
                console.log(payload2);
                const doc = await new NotificationModel({
                    user: uid,
                    message: body,
                    title,
                    intent,
                    targetID,
                    action,
                    targetUser,
                    imageUrl,
                }).save();
                const notification = await SNS.publish(
                    payload2,
                    sns.awsArnEndpoint
                );
                return {
                    sns,
                    doc,
                    notification,
                };
            }
        } catch (error) {
            // register
            console.log('from helper/notification', error);
            // do nothing
        }
    }
}

export default new Notification();
