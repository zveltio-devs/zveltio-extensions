/**
 * Object storage access for the cloud drive.
 *
 * Mirrors the engine's own `routes/storage.ts` (aws4fetch, lazily constructed)
 * rather than the AWS SDK. Two reasons, both learned the hard way in
 * content/media: an eagerly-built client makes every upload fail with a 500 on
 * an install that has no S3 configured, and @aws-sdk dominates the packed
 * bundle for what amounts to three signed HTTP calls.
 *
 * `getAws()` returns null when S3_ENDPOINT is unset. Callers MUST treat that as
 * "object storage is not configured" and degrade gracefully — metadata still
 * works, bytes just aren't stored remotely — instead of throwing.
 */

import { AwsClient } from 'aws4fetch';

let _aws: AwsClient | null = null;

export function getAws(): AwsClient | null {
  if (!process.env.S3_ENDPOINT) return null;
  if (!_aws) {
    _aws = new AwsClient({
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
      region: process.env.S3_REGION || 'us-east-1',
      service: 's3',
    });
  }
  return _aws;
}

export function s3Bucket(): string {
  return process.env.S3_BUCKET || 'zveltio';
}

export function s3Url(key: string): string {
  const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
  return `${endpoint}/${s3Bucket()}/${key}`;
}

/** PUT an object. Returns false when storage is unconfigured or the PUT failed. */
export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<boolean> {
  const aws = getAws();
  if (!aws) return false;
  const res = await aws.fetch(s3Url(key), {
    method: 'PUT',
    // BodyInit doesn't include Node's Buffer/Uint8Array in these lib types,
    // though fetch accepts both at runtime.
    body: body as unknown as BodyInit,
    headers: { 'Content-Type': contentType, 'Content-Length': String(body.length) },
  });
  return res.ok;
}

/** GET an object's bytes, or null when unconfigured / missing. */
export async function getObject(key: string): Promise<ArrayBuffer | null> {
  const aws = getAws();
  if (!aws) return null;
  const res = await aws.fetch(s3Url(key), { method: 'GET' });
  if (!res.ok) return null;
  return await res.arrayBuffer();
}

/** DELETE an object. Never throws — deleting bytes must not fail a DB cleanup. */
export async function deleteObject(key: string): Promise<void> {
  const aws = getAws();
  if (!aws) return;
  await aws.fetch(s3Url(key), { method: 'DELETE' }).catch(() => undefined);
}

/**
 * Presigned GET URL, or null when storage is unconfigured. aws4fetch puts the
 * signature in the query string via `signQuery` — same call the engine makes.
 */
export async function presignedGetUrl(key: string, expiresIn = 3600): Promise<string | null> {
  const aws = getAws();
  if (!aws) return null;
  const target = new URL(s3Url(key));
  target.searchParams.set('X-Amz-Expires', String(expiresIn));
  const signed = await aws.sign(target, { method: 'GET', aws: { signQuery: true } });
  return signed.url;
}
