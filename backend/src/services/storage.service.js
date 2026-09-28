import crypto from 'crypto';

/**
 * Pure Node.js AWS Signature Version 4 Presigned URL generator for Cloudflare R2 & S3
 * No heavy external dependencies required.
 */

const toHex = (buf) => buf.toString('hex');
const hmac = (key, string) => crypto.createHmac('sha256', key).update(string).digest();
const hash = (string) => crypto.createHash('sha256').update(string).digest('hex');

export const generateR2PresignedUrl = ({
  bucket = process.env.R2_BUCKET,
  endpoint = process.env.R2_ENDPOINT,
  accessKeyId = process.env.R2_ACCESS_KEY_ID,
  secretAccessKey = process.env.R2_SECRET_ACCESS_KEY,
  region = 'auto',
  key,
  contentType = 'application/octet-stream',
  expiresInSeconds = 3600,
}) => {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return {
      configured: false,
      message: 'Cloudflare R2 credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET) are not fully configured in .env',
      uploadUrl: null,
      fileUrl: null,
    };
  }

  // Normalize endpoint URL
  const endpointUrl = new URL(endpoint);
  const host = `${bucket}.${endpointUrl.hostname}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const cleanKey = key.replace(/^\/+/, '');
  const canonicalUri = `/${cleanKey}`;
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  });

  queryParams.sort();

  const canonicalQuery = queryParams.toString();
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  // Derive signing key
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');

  const signature = toHex(hmac(kSigning, stringToSign));

  const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  const publicBaseUrl = process.env.R2_PUBLIC_URL || `https://${host}`;
  const fileUrl = `${publicBaseUrl.replace(/\/+$/, '')}/${cleanKey}`;

  return {
    configured: true,
    uploadUrl,
    fileUrl,
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
  };
};
