export type Kind = "income" | "expense";
export type Transaction = { id: string; title: string; amount: number; kind: Kind; category: string; date: string; note?: string };
export type Budget = { category: string; limit: number; month: string };
export const categories = { expense: ["Food & dining", "Transport", "Shopping", "Bills & utilities", "Health", "Entertainment", "Education", "Other"], income: ["Salary", "Freelance", "Investments", "Gift", "Other"] } as const;
export function localDate(date = new Date()) { const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, "0"), day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
export function currentMonth(date = new Date()) { return localDate(date).slice(0, 7); }
export function inMonth(items: Transaction[], month: string) { return items.filter(t => t.date.slice(0, 7) === month); }
export function inPeriod(items: Transaction[], month: string, months: number) { const [year, monthNumber] = month.split("-").map(Number), start = new Date(year, monthNumber - months, 1), startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`; return items.filter(t => t.date.slice(0, 7) >= startKey && t.date.slice(0, 7) <= month); }
export const TOTAL_BUDGET = "All expenses";
export function budgetSpending(items: Transaction[], budget: Budget) { return inMonth(items, budget.month).filter(t => t.kind === "expense" && (budget.category === TOTAL_BUDGET || t.category === budget.category)).reduce((sum, t) => sum + t.amount, 0); }
export function categoryTotals(items: Transaction[]) { return items.filter(t => t.kind === "expense").reduce<Record<string, number>>((result, t) => { result[t.category] = (result[t.category] || 0) + t.amount; return result; }, {}); }
export function dailyTotals(items: Transaction[], month: string) { return inMonth(items, month).filter(t => t.kind === "expense").reduce<Record<string, number>>((result, t) => { result[t.date] = (result[t.date] || 0) + t.amount; return result; }, {}); }
export function canonicalCategory(category: string, existing: string[]) { const clean = category.trim(); return existing.find(value => value.toLocaleLowerCase() === clean.toLocaleLowerCase()) ?? clean; }
export function addTransaction(items: Transaction[], transaction: Transaction) { return [transaction, ...items]; }
export function updateTransaction(items: Transaction[], transaction: Transaction) { return items.map(item => item.id === transaction.id ? transaction : item); }
export function deleteTransaction(items: Transaction[], id: string) { return items.filter(item => item.id !== id); }
export type FinanceStore = { transactions: Transaction[]; budgets: Budget[] };
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function loadStore(storage: StorageLike, key: string, fallback: FinanceStore): FinanceStore { const raw = storage.getItem(key); if (!raw) return fallback; const data: unknown = JSON.parse(raw); if (!data || typeof data !== "object") throw new Error("Invalid saved data"); const value = data as Partial<FinanceStore>; return { transactions: Array.isArray(value.transactions) ? value.transactions : [], budgets: Array.isArray(value.budgets) ? value.budgets : [] }; }
export function saveStore(storage: StorageLike, key: string, value: FinanceStore) { storage.setItem(key, JSON.stringify(value)); }
export function validBudgetLimit(value: number) { return Number.isFinite(value) && value > 0; }
export function totals(items: Transaction[]) { const income = items.filter(t => t.kind === "income").reduce((s,t)=>s+t.amount,0); const expenses = items.filter(t=>t.kind === "expense").reduce((s,t)=>s+t.amount,0); return { income, expenses, balance: income-expenses, savingsRate: income ? ((income-expenses)/income)*100 : 0 }; }
export function validateTransaction(t: Partial<Transaction>): string[] { const e:string[]=[]; if (!t.title?.trim()) e.push("Add a description."); if (!Number.isFinite(t.amount) || (t.amount ?? 0) <= 0) e.push("Amount must be greater than zero."); if (!t.kind || !["income","expense"].includes(t.kind)) e.push("Choose income or expense."); if (!t.category?.trim()) e.push("Choose a category."); if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || Number.isNaN(new Date(`${t.date}T00:00:00`).getTime()) || localDate(new Date(`${t.date}T00:00:00`)) !== t.date) e.push("Choose a valid date."); return e; }
export function budgetStatus(spent:number,limit:number) { const percent=limit>0?Math.round(spent/limit*1000)/10:0; return { percent, remaining:limit-spent, level:percent>=100?"over":percent>=80?"warning":"healthy" } as const; }
export function money(amount:number) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(amount); }
export function dateLabel(date:string) { return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(date+"T00:00:00")); }
