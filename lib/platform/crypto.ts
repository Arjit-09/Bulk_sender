import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${((await scrypt(password, salt, 64)) as Buffer).toString("hex")}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [salt, digest] = stored.split(":");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function key() {
  const value = process.env.ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error("Configure a 32-byte ENCRYPTION_KEY.");
  return Buffer.from(value, "hex");
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((v) => v.toString("base64"))
    .join(".");
}
export function decrypt(value: string) {
  const [iv, tag, data] = value.split(".").map((v) => Buffer.from(v, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
export function validHmac(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function unsubscribeToken(contactId: string) {
  return createHmac("sha256", key())
    .update(`unsubscribe:${contactId}`)
    .digest("hex");
}
export function validUnsubscribe(id: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(id));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
