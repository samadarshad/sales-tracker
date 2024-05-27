import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import fs from "fs";



const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

if (
  !AWS_ACCESS_KEY_ID ||
  !AWS_SECRET_ACCESS_KEY ||
  !AWS_REGION ||
  !AWS_S3_BUCKET_NAME
) {
  throw new Error("Missing AWS details");
}

const client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(filePath, key) {
  const fileStream = fs.createReadStream(filePath);
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: "image/png",
  };

  const command = new PutObjectCommand(params);
  await client.send(command);

  const publicUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return publicUrl;
}

export async function removeFile(url) {
  const key = url.split("/").slice(-1)[0];
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
  };
  const command = new DeleteObjectCommand(params);
  await client.send(command);
}
