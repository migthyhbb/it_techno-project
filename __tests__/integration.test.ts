import test from "node:test";
import assert from "node:assert/strict";

function calculatePoints(weightKg: number): number {
  return Math.round(weightKg * 10);
}

function redeemBalance(balance: number, points: number): { balance: number; accepted: boolean } {
  if (points < 100 || balance < points) {
    return { balance, accepted: false };
  }

  return { balance: balance - points, accepted: true };
}

test("setoran limbah: satu kilogram menghasilkan 10 poin", () => {
  assert.equal(calculatePoints(1), 10);
  assert.equal(calculatePoints(2.5), 25);
});

test("redeem: percobaan kedua tidak dapat membelanjakan saldo yang sama", () => {
  const firstAttempt = redeemBalance(150, 100);
  const secondAttempt = redeemBalance(firstAttempt.balance, 100);

  assert.deepEqual(firstAttempt, { balance: 50, accepted: true });
  assert.deepEqual(secondAttempt, { balance: 50, accepted: false });
});
