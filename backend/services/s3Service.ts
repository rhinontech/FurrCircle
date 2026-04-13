import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const FOLDER = process.env.AWS_S3_FOLDER_NAME || 'furrcircle-dev';

export type UploadFolder = 'profiles' | 'pets' | 'posts' | 'events' | 'stamps' | 'reports' | 'certificates';

export const uploadFileToS3 = async (
  buffer: Buffer,
  mimeType: string,
  folder: UploadFolder
): Promise<string> => {
  const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${FOLDER}/${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
