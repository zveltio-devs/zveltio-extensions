/**
 * Object storage access for the cloud drive.
 *
 * Mirrors the engine's own `routes/storage.ts` (aws4fetch, lazily constructed)
 * rather than the AWS SDK. Two reasons, both learned the hard way in
 * content/media: an eagerly-built client makes every upload fail with a 500 on
 * an install that has no S3 configured, and @aws-sdk dominates the packed
 * bundle for what amounts to three signed HTTP calls.
 *
 * Settings come from `ctx.config.objectStorage` (the `storage` capability), not
 * from `process.env`. That is a bug fix, not only tidiness: storage settings
 * have an admin-editable overlay on top of the environment, so an administrator
 * who configured object storage from the Studio never reached this file — it
 * saw an unset `S3_ENDPOINT` and silently took the "not configured" path below,
 * keeping metadata while quietly dropping the bytes.
 *
 * `getAws()` returns null when storage is unconfigured. Callers MUST treat that
 * as "object storage is not configured" and degrade gracefully instead of
 * throwing.
 */

import { AwsClient } from 'aws4fetch';
import { objectStorage as storage } from './config.js';

let _aws: AwsClient | null = null;
let _awsKey = '';

export function getAws(): AwsClient | null {
  const s = storage();
  if (!s) return null;
  // Rebuild when the credentials change: the previous cache was keyed on
  // nothing at all, so a settings change kept signing with the old key.
  const key = `${s.endpoint}|${s.region}|${s.accessKeyId}`;
  if (!_aws || _awsKey !== key) {
    _aws = new AwsClient({
      accessKeyId: s.accessKeyId,
      secretAccessKey: s.secretAccessKey,
      region: s.region,
      service: 's3',
    });
    _awsKey = key;
  }
  return _aws;
}

export function s3Bucket(): string {
  return storage()?.bucket ?? 'zveltio';
}

export function s3Url(key: string): string {
  return `${storage()?.endpoint ?? ''}/${s3Bucket()}/${key}`;
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
