import crypto from "crypto";

const SESSION_TOKEN_BYTES = 32;

export function createSessionToken(): string {
  return crypto
    .randomBytes(SESSION_TOKEN_BYTES)
    .toString("hex");
}

export function hashSessionToken(
  token: string
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}