import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "ap-southeast-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const ALLOWED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function getPresignedAvatarUploadUrl({
  workspaceId,
  contentType,
  fileSize,
}: {
  workspaceId: string;
  contentType: string;
  fileSize: number;
}) {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Invalid content type. Allowed types are: ${ALLOWED_CONTENT_TYPES.join(", ")}`);
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 2MB limit.`);
  }

  const extension = contentType.split("/")[1];
  const objectKey = `avatars/${workspaceId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bucketName = "user-profile-images";

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 });
  const publicUrl = `${process.env.AWS_ENDPOINT_URL_S3}/${bucketName}/${objectKey}`;

  return { uploadUrl, publicUrl, objectKey };
}
