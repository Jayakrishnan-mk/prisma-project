import AWS from 'aws-sdk';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const moment = require('moment')

const s3Options = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
    //signatureVersion: 'v4'
};

const s3 = new aws.S3(s3Options);

// const s3BucketPublic = process.env.PUBLIC_BUCKET_NAME;

export const uploadFileToPublicBucket = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.PUBLIC_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req: Request, file: any, cb) {
            const extension = file.originalname.split('.').reverse()[0];
            const fileName = `${moment(new Date()).format("DD-MM-YYYY_HH-mm-ss")}.${extension}`;
            const finalPath = `${fileName}`;
            cb(null, finalPath);
        }
    })
});

export const uploadFileToPrivateBucket = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.PRIVATE_BUCKET_NAME,
        //acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req: Request, file: any, cb) {
            const extension = file.originalname.split('.').reverse()[0];
            const fileName = `${new Date().getTime()}.${extension}`;
            const finalPath = `${fileName}`;

            cb(null, finalPath);
        }
    })
});

export const getSignedDownloadUrls = (input_files: string[], bucket_name: string): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            // Fetch URLs in parallel for speed
            const getSignedUrlPromises = input_files.map(input_file => {
                return new Promise((resolve, reject) => {
                    const getUrlParams = {
                        Bucket: bucket_name,
                        Key: `${input_file.split("/").pop()}`,
                        Expires: 60 * 60 * 5  // 5hrs expiration on signed url
                    };
                    s3.getSignedUrl('getObject', getUrlParams, (err, url) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            resolve(url);
                        }
                    });
                });
            });

            const file_url_array: Array<string> = await Promise.all(getSignedUrlPromises) as any;
            resolve(file_url_array);

        } catch (error) {
            console.log(error);
            reject(error)
        }
    })
}