const STORAGE_KEY = 'pocketLedgerEntries';
const CARRYOVER_STORAGE_KEY = 'pocketLedgerCarryovers';

function getLegacyType(entry) {
  return Number(entry.income) > 0 ? 'income' : 'expense';
}

function getLegacyAmount(entry, type) {
  return type === 'income'
    ? Number(entry.income) || 0
    : Number(entry.expense) || 0;
}

function normalizeEntry(entry) {
  const type = ['income', 'expense'].includes(entry.type)
    ? entry.type
    : getLegacyType(entry);
  const storedAmount = Number(entry.amount);
  const amount = Number.isFinite(storedAmount)
    ? Math.max(0, storedAmount)
    : getLegacyAmount(entry, type);

  return {
    id: String(entry.id || ''),
    date: String(entry.date || ''),
    description: String(entry.description || ''),
    type,
    amount,
    createdAt: String(entry.createdAt || new Date().toISOString())
  };
}

export function loadLedgerEntries() {
  try {
    const storedEntries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(storedEntries) ? storedEntries.map(normalizeEntry) : [];
  } catch (error) {
    console.error('帳簿データを読み込めませんでした。', error);
    return [];
  }
}

export function saveLedgerEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.map(normalizeEntry)));
}

function normalizeCarryover(carryover) {
  return {
    amount: Number(carryover.amount) || 0,
    mode: carryover.mode === 'carry' ? 'carry' : 'manual',
    sourceMonth: String(carryover.sourceMonth || ''),
    updatedAt: String(carryover.updatedAt || new Date().toISOString())
  };
}

export function loadLedgerCarryovers() {
  try {
    const storedCarryovers = JSON.parse(
      localStorage.getItem(CARRYOVER_STORAGE_KEY) || '{}'
    );

    if (!storedCarryovers || Array.isArray(storedCarryovers)) return {};

    return Object.fromEntries(
      Object.entries(storedCarryovers)
        .filter(([month]) => /^\d{4}-\d{2}$/.test(month))
        .map(([month, carryover]) => [month, normalizeCarryover(carryover)])
    );
  } catch (error) {
    console.error('繰越データを読み込めませんでした。', error);
    return {};
  }
}

export function saveLedgerCarryovers(carryovers) {
  const normalizedCarryovers = Object.fromEntries(
    Object.entries(carryovers).map(([month, carryover]) => [
      month,
      normalizeCarryover(carryover)
    ])
  );

  localStorage.setItem(
    CARRYOVER_STORAGE_KEY,
    JSON.stringify(normalizedCarryovers)
  );
}
