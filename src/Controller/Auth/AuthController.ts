import { Request, Response, NextFunction } from 'express';
import { sign } from 'jsonwebtoken';
import UserModel from '../../Models/User';
import OtpModel from '../../Models/Otp';
import SMSAPI from '../Sms/Sms';
import logger from '../../utilis/logger';
import { compareSync, hashSync } from 'bcryptjs';
import Mail from '../../Helper/Mail';
import VideoPreferenceModel from '../../Models/VideosPreference';
import SNSModel from '../../Models/SNS';
import {
    constructName,
    generateUserName,
    generateOTP,
} from '../../Helper/auth';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class AuthController {
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
    isValidMobile = mobile => {
        //check for spacila charters except +;
        const pattern = /([^\w+])/g;
        const checkforChar = /[A-Z,a-z]/;
        const isSpacialChar = pattern.test(mobile);
        const isChar = checkforChar.test(mobile);
        if (!isSpacialChar && !isChar) {
            return true;
        } else {
            return false;
        }
    };

    generateToken = (uid: string, scope: string) => {
        const appSecret: string = process.env.JWT_SECRET;
        const token = sign(
            {
                uid,
                scope,
            },
            appSecret
        );

        return token;
    };

    sendOTP = async () => {
        const mobile = this.req.body.mobile;
        console.log('type of', typeof mobile);
        console.log('body', this.req.body);
        if (mobile) {
            try {
                const isValidMobile = this.isValidMobile(mobile);
                if (!isValidMobile)
                    throw new Error('Please provide valid mobile number');
                const otp = generateOTP();
                const response = await SMSAPI.sendOtp(mobile, otp);
                const sessionID = response.data.Details;
                const data = {
                    otp,
                    mobile,
                    sessionID,
                };

                // get all other doc
                const docs = await OtpModel.find({
                    mobile,
                });

                for (const doc of docs) {
                    await doc.deleteOne();
                }

                await new OtpModel(data).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'OTP sent successfully',
                        otp,
                        mobile,
                    },
                });
            } catch (error) {
                console.log(error);
                console.log(
                    error.response ? error.response.data.Details : error.message
                );
                this.res.status(400).json({
                    status: 400,
                    message: 'error',
                    data: {
                        message: error.response
                            ? error.response.data.Details
                            : error.message,
                        otp: '',
                        mobile: '',
                    },
                });
                logger.error(error);
            }
        } else {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: 'Please provide mobile no with country code',
                    otp: '',
                    mobile: '',
                },
            });
        }
    };

    verifyOtp = async () => {
        try {
            const { mobile, otp } = this.req.body;
            if (!mobile || !otp)
                throw new Error('Please provide otp and mobile no');
            // verify otp and mobile
            const otpDoc = await OtpModel.findOne({
                otp,
                mobile,
            });
            if (!otpDoc) throw new Error('invalid otp');
            let user: any;
            // check if user exsist
            user = await UserModel.findOne({
                mobile,
            });
            if (user) {
                // update mobile
                user.mobile = mobile;
                await user.save();
            } else {
                // create user
                user = new UserModel({
                    mobile,
                    username: generateUserName(),
                });
                const videoPreference = new VideoPreferenceModel({
                    user,
                });
                user.videoPreference = videoPreference;
                await user.save();
                await videoPreference.save();
            }
            // hi sir. can i have your 10 minutes

            // delete otp doc.
            await otpDoc.deleteOne();
            // generate token
            const token = this.generateToken(user._id, user.role);
            // send response
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'login successful',
                    token,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: "Couldn't verify otp. Please try again",
                    token: '',
                },
            });
            logger.error(error);
        }
    };

    /**
     *  Login Method
     */
    login = async () => {
        try {
            const { email, password } = this.req.body;
            if (!email || !password)
                throw new Error('Please provide Email and Password');
            // check user
            const user = await UserModel.findOne({
                email,
            });
            if (!user) throw new Error('Please provide valid email address');
            const isPasswordAMatch = compareSync(password, user.password);
            if (!isPasswordAMatch)
                throw new Error('Please check your password');
            // get token
            const token = this.generateToken(user._id, user.role);
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Login successfull',
                    token,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: 'Invalid login details',
                    token: '',
                },
            });
        }
    };

    signupWithEmail = async () => {
        try {
            let { email, name, username, password, mobile } = this.req.body;

            console.log('this.req body', this.req.body);
            username = generateUserName(username);
            const isValidMobile = this.isValidMobile(mobile);
            if (!isValidMobile)
                throw new Error('Please provide valid mobile number');
            if (!email || !password)
                throw new Error('Please provide email and password');
            // check email exsist
            const isEmailExsist = await UserModel.findOne({ email });
            if (isEmailExsist) throw new Error('This email already exist');
            if (mobile) {
                const isMobileExsist = await UserModel.findOne({ mobile });
                if (isMobileExsist)
                    throw new Error('This mobile number already exist');
            }
            if (username) {
                const isUsernameExsist = await UserModel.findOne({
                    username,
                });
                if (isUsernameExsist)
                    throw new Error('This username already exist');
            }

            let data: any = {};
            if (name) {
                const { firstName, middleName, lastName } = constructName(name);
                data.firstName = firstName;
                data.middleName = middleName;
                data.lastName = lastName;
            }
            // set username
            // if (username && username.length < 6)
            //     throw new Error('username should be 6 chracter long');

            data.username = generateUserName(username);
            data.password = hashSync(password.toString());
            const user = new UserModel({
                ...this.req.body,
                ...data,
            });
            const videoPreference = new VideoPreferenceModel({
                user,
            });
            // user.videoPreference = videoPreference;

            await user.save();
            await videoPreference.save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'user registered successfully',
                    user,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    //  message:
                    // 'Please check your provided details. And try again',
                    message: error.message,
                    user: '',
                },
            });
            logger.error(error);
        }
    };

    /**
     *  Login Method
     */
    logout = async () => {
        try {
            const uid = this.req.uid;
            const sns = await SNSModel.findOne({ user: uid });
            // null them
            sns.deviceToken = '';
            sns.deviceID = '';
            sns.awsArnEndpoint = '';
            await sns.save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'logout succesfull',
                    sns,
                },
            });
        } catch (error) {}
    };

    /**
     * Password Forgot Method
     */
    passwordForgot = async () => {
        try {
            const mobile = this.req.body.mobile;
            const email = this.req.body.email;
            if (!email && !mobile)
                throw new Error('Please provide either email or mobile');
            if (mobile) {
                const user = await UserModel.findOne({
                    mobile,
                });
                if (!user) throw new Error('No user found with this mobile');
                const otp = generateOTP();
                const response = await SMSAPI.sendOtp(mobile, otp);
                const sessionID = response.data.Details;
                const data = {
                    otp,
                    mobile,
                    sessionID,
                };
                await new OtpModel(data).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'otp sent to mobile',
                    },
                });
            } else {
                const user = await UserModel.findOne({
                    email,
                });
                if (!user) throw new Error('No user found with this email');
                const otp = generateOTP();
                const text = `Your OTP is ${otp}`;
                await Mail.send(email, 'Recover Your Dramaking Account', text);
                await new OtpModel({
                    otp,
                    email,
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'otp sent to email',
                    },
                });
            }
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    // message: 'Please try again',
                    message: error.message,
                },
            });
        }
    };

    /**
     * Password Reset Method
     */
    passwordReset = async () => {
        try {
            const { otp, mobile, password, email } = this.req.body;
            if (!otp && !password && !email)
                throw new Error('Please provide otp, and  password');
            const otpDoc = await OtpModel.findOne({
                $or: [
                    {
                        otp,
                        mobile,
                    },
                    {
                        otp,
                        email,
                    },
                ],
            });
            if (!otpDoc) throw new Error('Invalid OTP');

            if (mobile) {
                // update user
                await UserModel.findOneAndUpdate(
                    {
                        mobile,
                    },
                    {
                        password: hashSync(password.toString()),
                    }
                );
            } else {
                // update user
                await UserModel.findOneAndUpdate(
                    {
                        email,
                    },
                    {
                        password: hashSync(password.toString()),
                    }
                );
            }

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'password changed successfully',
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    // message: 'please try again',
                    message: error.message,
                },
            });
        }
    };
}

export default AuthController;
