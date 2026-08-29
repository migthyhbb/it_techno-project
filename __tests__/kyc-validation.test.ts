import test from "node:test";
import assert from "node:assert/strict";

import { validateOfficialDocumentImage } from "../lib/kyc-validation.ts";

test("KYC validator rejects non-official document responses", async () => {
  const result = await validateOfficialDocumentImage(
    "https://example.com/not-a-document.jpg",
    "NO",
  );

  assert.equal(result, false);
});

test("KYC validator accepts official document responses", async () => {
  const result = await validateOfficialDocumentImage(
    "https://example.com/ktp.jpg",
    "YES",
  );

  assert.equal(result, true);
});
