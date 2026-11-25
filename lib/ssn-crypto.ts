import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;

export function encryptionKey(raw = process.env.SSN_ENCRYPTION_KEY) {
  const trimmed = raw?.trim() ?? "";
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");

  const decoded = Buffer.from(trimmed, "base64");
  if (decoded.length === 32 && trimmed.length >= 43) return decoded;

  if (Buffer.byteLength(trimmed) === 32) return Buffer.from(trimmed);

  throw new Error("SSN encryption key is not configured.");
}

export function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function encryptSsn(ssn: string) {
  const key = encryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(formatSsn(ssn), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSsn(payload: string) {
  const data = Buffer.from(payload, "base64");
  if (data.length <= IV_BYTES + TAG_BYTES) throw new Error("Stored SSN payload is invalid.");

  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = data.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function secretsMatch(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
