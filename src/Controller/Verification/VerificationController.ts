import { Request, Response, NextFunction } from 'express';
import VerificationOtp from '../../Models/VerificationOtp';
import SMSAPI from '../Sms/Sms';
import logger from '../../utilis/logger';
import Mail from '../../Helper/Mail';
import { generateOTP } from '../../Helper/auth';
import VerificationDocModel from '../../Models/Verification';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import UserModel from '../../Models/User';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class VerificationController {
    req: any;
    res: Response;
    next: NextFunction;
    bucket: string;
    region: string;
    s3: S3;
    endpoint: string;
    cdn: string;

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
        this.bucket = process.env.AWS_S3_BUCKET_NAME;
        this.region = process.env.AWS_S3_REGION;
        this.endpoint = process.env.AWS_S3_ENDPOINT;
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        });
        this.cdn = process.env.AWS_CLOUDFRONT_DOMAIN;
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

    getCdnUrl = path => {
        return this.cdn + '/' + path;
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
    };

    sendOTP = async () => {
        try {
            const { mobile, email } = this.req.body;
            if (!mobile && !email)
                throw new Error('Please provide mobile or email');
            if (mobile) {
                const otp = generateOTP();
                const response = await SMSAPI.sendOtp(mobile, otp);
                const sessionID = response.data.Details;
                const data = {
                    otp,
                    mobile,
                    sessionID,
                };

                // get all other doc
                const docs = await VerificationOtp.find({
                    mobile,
                });

                for (const doc of docs) {
                    await doc.deleteOne();
                }

                await new VerificationOtp(data).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'OTP sent successfully',
                        otp,
                        mobile,
                    },
                });
            } else if (email) {
                const otp = generateOTP();
                const text = `Your OTP is ${otp}`;
                await Mail.send(email, 'Verify Your Email', text);
                await new VerificationOtp({
                    otp,
                    email,
                    type: 'email',
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'OTP sent successfully',
                    },
                });
            } else {
                //do nothing
            }
        } catch (error) {
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
        }
    };

    verifyOtp = async () => {
        try {
            const { mobile, otp, email } = this.req.body;

            if (email && otp) {
                console.log('case1');
                // verify otp and mobile
                const otpDoc = await VerificationOtp.findOne({
                    otp,
                    email,
                });
                if (!otpDoc) throw new Error('Invalid otp');

                // delete otp doc.
                await otpDoc.deleteOne();
                // send response
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'OTP verified',
                    },
                });
            } else if (mobile && otp) {
                console.log('case2');
                // verify otp and mobile
                const otpDoc = await VerificationOtp.findOne({
                    otp,
                    mobile,
                });
                if (!otpDoc) throw new Error('Invalid otp');

                // delete otp doc.
                await otpDoc.deleteOne();
                // send response
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'OTP verified',
                    },
                });
            } else {
                console.log('case3');
                this.res.status(400).json({
                    status: 400,
                    message: 'error',
                    data: {
                        message: 'Please provide email mobile and otp',
                    },
                });
            }
        } catch (error) {
            console.log('exception');
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                },
            });
            logger.error(error);
        }
    };

    getDocuments = async () => {
        try {
            const { uid } = this.req;

            const documents = await VerificationDocModel.find({
                user: uid,
            });

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Documents list',
                    documents,
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    documents: {},
                },
            });
        }
    };

    uploadDocuments = async () => {
        try {
            const { uid } = this.req;
            if (this.req.files && this.req.files.image) {
                const image = this.req.files.image;
                const path = 'verification/documents/' + uuidv4() + '/';
                const imagepath = path + image.name;
                const imageMimeType =
                    image && image.mimetype ? image.mimetype : 'image/png';
                const imageUrl = this.getCdnUrl(imagepath);
                await this.uploadObject({
                    Bucket: this.bucket,
                    Key: imagepath,
                    Body: image.data,
                    ACL: 'public-read',
                    ContentType: imageMimeType,
                    ContentDisposition: 'inline',
                });
                const document = await new VerificationDocModel({
                    document: imageUrl,
                    user: uid,
                    ...this.req.body,
                }).save();
                this.res.status(200).json({
                    status: 200,
                    message: 'success',
                    data: {
                        message: 'Documents uploaded',
                        document,
                    },
                });
            } else {
                throw new Error('Please provide document as image');
            }
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    documents: {},
                },
            });
        }
    };

    approve = async () => {
        try {
            const { uid } = this.req.body;
            if (!uid) throw new Error('Please  provided uid');
            const user = await UserModel.findById(uid);

            if (!user) throw new Error('Please  provided valid uid');
            // get documents
            const documents = await VerificationDocModel.find({
                user: uid,
            });

            if (!documents) throw new Error('Please check provided uid');
            // now we need to  make user as approved

            user.isUserVerified = true;
            // save user
            await user.save();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Account approved',
                },
            });
        } catch (error) {
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    documents: {},
                },
            });
        }
    };

    deleteEntry = async () => {
        try {
            const { id } = this.req.params;
            // find and delete
            const document: any = await VerificationDocModel.findById(id);
            await document.deleteOne();

            // find comments, video, userliked, userShared, user disliked
            // user who are folowing

            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'Document deleted successfully',
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

export default VerificationController;
