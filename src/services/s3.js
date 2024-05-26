import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
// import dotenv from "dotenv";
import fs from "fs";

// Load environment variables from .env.local file
// dotenv.config({ path: "/Users/samadarshad/dev/sales-tracker/.env.local" });

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
  const data = await client.send(command);
  console.log(data);

  const publicUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  console.log(`Public URL: ${publicUrl}`);
  return publicUrl;
}

// uploadFile("/Users/samadarshad/dev/sales-tracker/hn.png", "test.png");
