/root/.profile: line 9: /dev/null: Permission denied
const STORAGE_KEY = 'pocketLedgerEntries';

function normalizeEntry(entry) {
  return {
    id: String(entry.id || ''),
    date: String(entry.date || ''),
    description: String(entry.description || ''),
    income: Number(entry.income) || 0,
    expense: Number(entry.expense) || 0,
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
