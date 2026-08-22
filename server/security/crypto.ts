const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function randomTokenHex(bytes = 32) {
  const token = new Uint8Array(bytes);
  crypto.getRandomValues(token);
  return bytesToHex(token);
}

const referralAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomReferralCode(length = 10) {
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => referralAlphabet[byte % referralAlphabet.length]).join("");
}
