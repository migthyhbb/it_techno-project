import test from "node:test";
import assert from "node:assert/strict";
import { createMidtransSignature, isValidMidtransSignature } from "../lib/midtrans-signature.ts";

test("Midtrans webhook: signature SHA-512 valid diterima", () => {
  const payload = {
    orderId: "AGEN-order-123",
    statusCode: "200",
    grossAmount: "45000.00",
  };
  const serverKey = "dummy-midtrans-server-key";
  const signature = createMidtransSignature(
    payload.orderId,
    payload.statusCode,
    payload.grossAmount,
    serverKey,
  );

  assert.equal(
    isValidMidtransSignature(
      signature,
      payload.orderId,
      payload.statusCode,
      payload.grossAmount,
      serverKey,
    ),
    true,
  );
});

test("Midtrans webhook: signature palsu ditolak", () => {
  const signature = createMidtransSignature("ORDER-1", "200", "10000.00", "dummy-key");

  assert.equal(
    isValidMidtransSignature(signature, "ORDER-1", "200", "99999.00", "dummy-key"),
    false,
  );
});