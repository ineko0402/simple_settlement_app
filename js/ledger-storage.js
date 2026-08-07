const STORAGE_KEY = 'pocketLedgerEntries';

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
