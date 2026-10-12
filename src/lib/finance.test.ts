import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addTransaction, budgetSpending, budgetStatus, canonicalCategory, categoryTotals, dailyTotals, currentMonth, deleteTransaction, inMonth, inPeriod, loadStore, localDate, saveStore, totals, updateTransaction, validBudgetLimit, validateTransaction } from "./finance.ts";
import type { Budget, FinanceStore, StorageLike, Transaction } from "./finance.ts";

const sample: Transaction[] = [
  { id: "1", title: "Salary", amount: 50000, kind: "income", category: "Salary", date: "2026-10-01" },
  { id: "2", title: "Rent", amount: 18000, kind: "expense", category: "Bills & utilities", date: "2026-10-02" },
];

describe("finance calculations", () => {
  it("calculates income, expenses and balance from transactions", () => {
    assert.deepEqual(totals(sample), { income: 50000, expenses: 18000, balance: 32000, savingsRate: 64 });
  });
  it("returns zero savings rate when there is no income", () => {
    assert.equal(totals([sample[1]]).savingsRate, 0);
    assert.equal(totals([]).savingsRate, 0);
  });
  it("allows a negative savings rate when expenses exceed income", () => {
    assert.equal(totals([{ ...sample[0], amount: 10000 }, sample[1]]).savingsRate, -80);
  });
  it("marks budgets healthy, nearing the threshold, and over limit", () => {
    assert.equal(budgetStatus(700, 1000).level, "healthy");
    assert.equal(budgetStatus(800, 1000).level, "warning");
    assert.deepEqual(budgetStatus(1100, 1000), { percent: 110, remaining: -100, level: "over" });
  });
  it("accepts a valid transaction and reports invalid fields", () => {
    assert.deepEqual(validateTransaction(sample[0]), []);
    assert.equal(validateTransaction({ ...sample[0], title: " ", amount: 0, category: "", date: "nope" }).length, 4);
  });
  it("aggregates transactions by selected month and reporting range", () => {
    const items = [...sample, { ...sample[0], id: "3", amount: 2000, date: "2026-09-30" }, { ...sample[1], id: "4", amount: 700, date: "2026-08-31" }];
    assert.deepEqual(inMonth(items, "2026-10"), sample);
    assert.deepEqual(totals(inPeriod(items, "2026-10", 3)), { income: 52000, expenses: 18700, balance: 33300, savingsRate: (33300 / 52000) * 100 });
  });
  it("calculates budget spending for only that month's matching expenses", () => {
    const items = [...sample, { ...sample[1], id: "3", category: "Food & dining", amount: 2500 }, { ...sample[1], id: "4", category: "Food & dining", amount: 900, date: "2026-09-30" }];
    const budget: Budget = { category: "Food & dining", limit: 5000, month: "2026-10" };
    assert.equal(budgetSpending(items, budget), 2500);
  });
  it("calculates category totals and daily expense trends from dates", () => {
    const items = [...sample, { ...sample[1], id: "3", amount: 1200, date: "2026-10-02", category: "Food & dining" }, { ...sample[0], id: "4", amount: 800, date: "2026-10-02" }];
    assert.deepEqual(categoryTotals(items), { "Bills & utilities": 18000, "Food & dining": 1200 });
    assert.deepEqual(dailyTotals(items, "2026-10"), { "2026-10-02": 19200 });
    assert.equal(canonicalCategory("  food & DINING ", ["Food & dining"]), "Food & dining");
    assert.equal(canonicalCategory("Books", ["Food & dining"]), "Books");
  });
  it("supports an all-expenses monthly budget and overspending", () => {
    const budget: Budget = { category: "All expenses", limit: 1000, month: "2026-10" };
    assert.equal(budgetSpending(sample, budget), 18000);
    assert.deepEqual(budgetStatus(budgetSpending(sample, budget), budget.limit), { percent: 1800, remaining: -17000, level: "over" });
  });
  it("uses empty first-run storage and preserves stored user data", () => {
    const saved = new Map<string, string>();
    const storage: StorageLike = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => { saved.set(key, value); } };
    assert.deepEqual(loadStore(storage, "fresh", { transactions: [], budgets: [] }), { transactions: [], budgets: [] });
    saveStore(storage, "fresh", { transactions: sample, budgets: [] });
    assert.deepEqual(loadStore(storage, "fresh", { transactions: [], budgets: [] }).transactions, sample);
  });
  it("rejects malformed calendar dates and negative amounts", () => {
    assert.ok(validateTransaction({ ...sample[0], date: "2026-02-30" }).includes("Choose a valid date."));
    assert.ok(validateTransaction({ ...sample[0], date: "2026-1-01" }).includes("Choose a valid date."));
    assert.ok(validateTransaction({ ...sample[0], amount: -1 }).includes("Amount must be greater than zero."));
  });
  it("formats local date and month without UTC conversion", () => {
    const local = new Date(2026, 0, 2, 23, 30);
    assert.equal(localDate(local), "2026-01-02");
    assert.equal(currentMonth(local), "2026-01");
  });
  it("adds, updates, and deletes transactions immutably", () => {
    const next = { ...sample[0], id: "3" };
    assert.deepEqual(addTransaction(sample, next), [next, ...sample]);
    assert.deepEqual(updateTransaction(sample, { ...sample[0], title: "Pay" }), [{ ...sample[0], title: "Pay" }, sample[1]]);
    assert.deepEqual(deleteTransaction(sample, "2"), [sample[0]]);
    assert.equal(validBudgetLimit(12.5), true);
    assert.equal(validBudgetLimit(Infinity), false);
    assert.equal(validBudgetLimit(0), false);
  });
  it("loads and saves transactions and budgets through the storage interface", () => {
    const saved = new Map<string, string>();
    const storage: StorageLike = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => { saved.set(key, value); } };
    const initial: FinanceStore = { transactions: sample, budgets: [{ category: "Food & dining", limit: 1000, month: "2026-10" }] };
    assert.deepEqual(loadStore(storage, "finance", initial), initial);
    saveStore(storage, "finance", initial);
    assert.deepEqual(loadStore(storage, "finance", { transactions: [], budgets: [] }), initial);
  });
});
