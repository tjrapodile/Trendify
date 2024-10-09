import { S3 } from 'aws-sdk'

export const s3Bucket = new S3({
    accessKeyId: process.env.EXPO_PUBLIC_S3_ACCESS_KEY,
    secretAccessKey: process.env.EXPO_PUBLIC_S3_SECRET_KEY,
    region: process.env.EXPO_PUBLIC_S3_REGION
})  