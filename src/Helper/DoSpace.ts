import AWS, { S3 } from 'aws-sdk';

class DoSpace {
    s3: S3;
    bucketName: any;

    constructor() {
        const endpointUrl: any = process.env.DIGITAL_OCEAN_SPACE_ENDPOINT;
        const spacesEndpoint: any = new AWS.Endpoint(endpointUrl);
        this.s3 = new AWS.S3({
            endpoint: spacesEndpoint,
            accessKeyId: process.env.DIGITAL_OCEAN_SPACE_KEY,
            secretAccessKey: process.env.DIGITAL_OCEAN_SPACE_SECRET,
        });
        this.bucketName =
            'https://' +
            process.env.DIGITAL_OCEAN_SPACE_NAME +
            '.' +
            process.env.DIGITAL_OCEAN_SPACE_ENDPOINT;
    }

    getBucketUrl = () => this.bucketName;

    getBucketList = async () => {
        return await this.s3.listBuckets().promise();
    };

    getObjects = async (bucket: string) => {
        return this.s3
            .listObjects({
                Bucket: bucket,
            })
            .promise();
    };

    getObject = async (bucket: string, key: string) => {
        return await this.s3
            .getObject({
                Bucket: bucket,
                Key: key,
            })
            .promise();
    };

    deleteObject = async (bucket: string, key: string) => {
        return await this.s3
            .deleteObject({
                Bucket: bucket,
                Key: key,
            })
            .promise();
    };

    uploadObject = async (params: S3.PutObjectRequest) => {
        return await this.s3.putObject(params).promise();
    };

    getSignedUrlToDownload = () => async (params: any) => {
        //return await this.s3.getSignedUrl(params)
    };
}

export default new DoSpace();
