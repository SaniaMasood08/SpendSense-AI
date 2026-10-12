import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ownedRecord, validRegistration } from "./supabase.ts";

describe("Supabase account helpers", () => {
  it("validates required name, email format, and minimum password length", () => {
    assert.deepEqual(validRegistration("Alex Example", "alex@example.com", "correct-horse"), []);
    assert.equal(validRegistration("", "nope", "short").length, 3);
    assert.ok(validRegistration("Alex", "alex@example.com", "1234567").some(error => error.includes("8 characters")));
  });

  it("attaches each write to only the active user's owner id", () => {
    const transaction = { id: "tx-1", title: "Groceries", amount: 25 };
    const aliceRecord = ownedRecord("user-a", transaction);
    const bobRecord = ownedRecord("user-b", transaction);
    assert.equal(aliceRecord.user_id, "user-a");
    assert.equal(bobRecord.user_id, "user-b");
    assert.notEqual(aliceRecord.user_id, bobRecord.user_id);
    assert.equal(transaction.title, "Groceries");
  });
});
