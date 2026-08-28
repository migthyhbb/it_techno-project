import crypto from "crypto";

export function createMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

export function isValidMidtransSignature(
  signature: string,
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): boolean {
  const expected = Buffer.from(createMidtransSignature(orderId, statusCode, grossAmount, serverKey), "utf8");
  const received = Buffer.from(signature, "utf8");

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}