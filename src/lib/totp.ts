import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC 6238 time-based one-time passwords, implemented on node:crypto so the
 * portal gains two-factor authentication without a third-party service or an
 * outbound network call. 30-second step, 6 digits, SHA-1 (what every
 * authenticator app expects).
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;
/** Accept the previous and next window, to tolerate clock drift. */
const WINDOW = 1;

export function generateSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function codeForCounter(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Constant-time verification across the accepted drift window. */
export function verifyTotp(secret: string, token: string, now = Date.now()): boolean {
  const candidate = token.replace(/\D/g, "");
  if (candidate.length !== DIGITS || !secret) return false;

  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  let matched = false;
  for (let drift = -WINDOW; drift <= WINDOW; drift++) {
    const expected = Buffer.from(codeForCounter(secret, counter + drift));
    const supplied = Buffer.from(candidate);
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
      matched = true;
    }
  }
  return matched;
}

/** otpauth:// URI that authenticator apps read from a QR code. */
export function otpauthUri(secret: string, account: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Secret split into readable groups, for manual entry into an app. */
export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
