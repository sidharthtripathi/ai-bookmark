import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { assertUrlSafe } from './url-validator';

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
 * SSRF protection: URL source is validated before fetching.
 */
export async function uploadThumbnailToStorage(
  source: string | Buffer,
  contentId: string
): Promise<string> {
  const key = `thumbnails/${contentId}`;

  let buffer: Buffer;
  if (typeof source === 'string') {
    // Validate URL against SSRF before fetching
    assertUrlSafe(source);
    const response = await fetch(source, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Failed to download thumbnail: ${response.status}`);
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
 * SSRF protection: URL is validated before fetching.
 */
export async function downloadBuffer(url: string): Promise<Buffer> {
  assertUrlSafe(url);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Failed to download buffer: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
