import test from "node:test";
import assert from "node:assert/strict";

test("Authentication Flow: payload login valid", () => {
  const payload = { email: "test@lentera.com", password: "Password123!" };

  assert.match(payload.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.ok(payload.password.length >= 8);
});