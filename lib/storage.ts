import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

/**
 * Upload a thumbnail (image buffer or CDN URL) to Cloudflare R2.
 * Returns the permanent R2 URL.
 */
export async function uploadThumbnailToStorage(
  source: string | Buffer,
  contentId: string
): Promise<string> {
  const key = `thumbnails/${contentId}`;

  let buffer: Buffer;
  if (typeof source === 'string') {
    // Download from CDN URL
    const response = await fetch(source);
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    buffer = source;
  }

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    },
  });

  await upload.done();

  const publicUrl = process.env.R2_PUBLIC_URL ?? `https://${BUCKET}.r2.dev`;
  return `${publicUrl}/${key}`;
}

/**
 * Download a buffer from a URL.
 */
export async function downloadBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
