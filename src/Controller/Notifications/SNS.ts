import AWS, { SNS } from 'aws-sdk';

class SNSNotification {
    bucket: string;
    region: string;
    endpoint: string;
    cdn: string;
    sns: SNS;

    constructor() {
        this.bucket = process.env.AWS_S3_BUCKET_NAME;
        this.region = process.env.AWS_S3_REGION;
        this.endpoint = process.env.AWS_S3_ENDPOINT;
        this.cdn = process.env.AWS_CLOUDFRONT_DOMAIN;
    }

    createEndpoint = (
        platformApplicationArn: string,
        token: string,
        uid: string
    ) => {
        return new AWS.SNS({
            apiVersion: '2010-03-31',
            region: this.region,
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        })
            .createPlatformEndpoint({
                PlatformApplicationArn: platformApplicationArn,
                Token: token,
                //CustomUserData: uid,
            })
            .promise();
    };
    publish = async (message: string, targetArn: string) => {
        // firstenable endpoint

        await new AWS.SNS({
            apiVersion: '2010-03-31',
            region: this.region,
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        })
            .setEndpointAttributes({
                Attributes: {
                    Enabled: 'true',
                },
                EndpointArn: targetArn,
            })
            .promise();
        return new AWS.SNS({
            apiVersion: '2010-03-31',
            region: this.region,
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        })

            .publish({
                Message: message,
                MessageStructure: 'json',
                TargetArn: targetArn,
            })
            .promise();
    };
    listTopics = () => {
        return new AWS.SNS({
            region: this.region,
            apiVersion: '2010-03-31',
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        })
            .listTopics({})
            .promise();
    };
}

export default new SNSNotification();
