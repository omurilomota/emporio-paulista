import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "emporio_admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

export function isAdminConfigured() {
  return (process.env.ADMIN_PASSWORD?.length ?? 0) >= 12;
}

function signingSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function signature(expiresAt: string) {
  return createHmac("sha256", signingSecret())
    .update(`emporio-admin-session:${expiresAt}`)
    .digest("base64url");
}

export function verifyAdminPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!isAdminConfigured() || !expected || candidate.length > 512) return false;
  const expectedHash = createHash("sha256").update(expected).digest();
  const candidateHash = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expectedHash, candidateHash);
}

export function createAdminSession() {
  const expiresAt = String(Date.now() + ADMIN_SESSION_SECONDS * 1000);
  return `${expiresAt}.${signature(expiresAt)}`;
}

function isValidToken(token: string) {
  if (!isAdminConfigured()) return false;
  const [expiresAt, receivedSignature, extra] = token.split(".");
  if (!expiresAt || !receivedSignature || extra || !/^\d{13}$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const expected = Buffer.from(signature(expiresAt));
  const received = Buffer.from(receivedSignature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isValidAdminSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (!cookie) return false;
  return isValidToken(cookie.slice(ADMIN_COOKIE_NAME.length + 1));
}
