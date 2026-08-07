import { formatNumber, parseIntSafe, showSnackbar } from './utils.js';
import { loadLedgerEntries, saveLedgerEntries } from './ledger-storage.js';

const ledgerBody = document.getElementById('ledgerBody');
const ledgerEmpty = document.getElementById('ledgerEmpty');
const ledgerBalance = document.getElementById('ledgerBalance');
const addLedgerEntry = document.getElementById('addLedgerEntry');

let ledgerEntries = [];

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getSortedEntries() {
  return [...ledgerEntries].sort((entryA, entryB) => {
    const dateComparison = entryA.date.localeCompare(entryB.date);
    return dateComparison || entryA.createdAt.localeCompare(entryB.createdAt);
  });
}

function getBalance(entries, targetId = '') {
  let balance = 0;

  for (const entry of entries) {
    balance += entry.income - entry.expense;
    if (entry.id === targetId) break;
  }

  return balance;
}

function formatAmount(amount) {
  return amount > 0 ? formatNumber(amount) : '';
}

function saveEntries() {
  saveLedgerEntries(ledgerEntries);
  updateBalance();
}

function updateBalance() {
  const balance = getBalance(getSortedEntries());
  ledgerBalance.textContent = `${formatNumber(balance)} 円`;
}

function showEntryBalance(entryId) {
  const balance = getBalance(getSortedEntries(), entryId);
  showSnackbar(`この行までの残高：${formatNumber(balance)} 円`);
}

function updateEntry(entryId, fieldName, fieldValue) {
  const entry = ledgerEntries.find(item => item.id === entryId);
  if (!entry) return;

  entry[fieldName] = fieldValue;
  saveEntries();
}

function updateAmount(entryId, fieldName, fieldValue, currentInput) {
  const entry = ledgerEntries.find(item => item.id === entryId);
  if (!entry) return;

  const amount = Math.max(0, Math.trunc(parseIntSafe(fieldValue)));
  const oppositeField = fieldName === 'income' ? 'expense' : 'income';

  entry[fieldName] = amount;
  if (amount > 0) entry[oppositeField] = 0;

  saveEntries();
  currentInput.value = formatAmount(amount);

  const row = currentInput.closest('.ledger-row');
  const oppositeInput = row?.querySelector(`[data-field="${oppositeField}"]`);
  if (amount > 0 && oppositeInput) oppositeInput.value = '';

  showEntryBalance(entryId);
}

function deleteEntry(entryId) {
  if (!window.confirm('この行を削除しますか？')) return;

  ledgerEntries = ledgerEntries.filter(entry => entry.id !== entryId);
  saveEntries();
  renderEntries();
  showSnackbar('行を削除しました');
}

function createInput(className, value, label) {
  const input = document.createElement('input');
  input.className = className;
  input.value = value;
  input.setAttribute('aria-label', label);
  return input;
}

function createEntryRow(entry) {
  const row = document.createElement('div');
  row.className = 'ledger-row';
  row.dataset.entryId = entry.id;

  const dateInput = createInput('ledger-input ledger-date', entry.date, '日付');
  dateInput.type = 'date';
  dateInput.addEventListener('change', event => {
    updateEntry(entry.id, 'date', event.target.value);
    renderEntries();
  });

  const descriptionInput = createInput(
    'ledger-input ledger-description',
    entry.description,
    '内容'
  );
  descriptionInput.type = 'text';
  descriptionInput.placeholder = '内容';
  descriptionInput.addEventListener('input', event => {
    updateEntry(entry.id, 'description', event.target.value);
  });

  const incomeInput = createInput(
    'ledger-input ledger-amount',
    formatAmount(entry.income),
    '入金'
  );
  incomeInput.type = 'text';
  incomeInput.inputMode = 'numeric';
  incomeInput.dataset.field = 'income';
  incomeInput.placeholder = '0';
  incomeInput.addEventListener('focus', () => {
    incomeInput.value = entry.income || '';
  });
  incomeInput.addEventListener('blur', event => {
    updateAmount(entry.id, 'income', event.target.value, event.target);
  });

  const expenseInput = createInput(
    'ledger-input ledger-amount',
    formatAmount(entry.expense),
    '出金'
  );
  expenseInput.type = 'text';
  expenseInput.inputMode = 'numeric';
  expenseInput.dataset.field = 'expense';
  expenseInput.placeholder = '0';
  expenseInput.addEventListener('focus', () => {
    expenseInput.value = entry.expense || '';
  });
  expenseInput.addEventListener('blur', event => {
    updateAmount(entry.id, 'expense', event.target.value, event.target);
  });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'ledger-delete';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', '行を削除');
  deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
  deleteButton.addEventListener('click', () => deleteEntry(entry.id));

  const balanceButton = document.createElement('button');
  balanceButton.className = 'ledger-row-balance';
  balanceButton.type = 'button';
  balanceButton.textContent = 'この行までの残高を表示';
  balanceButton.addEventListener('click', () => showEntryBalance(entry.id));

  row.append(dateInput, descriptionInput, incomeInput, expenseInput, deleteButton, balanceButton);
  return row;
}

function renderEntries() {
  const sortedEntries = getSortedEntries();
  ledgerBody.replaceChildren(...sortedEntries.map(createEntryRow));
  ledgerEmpty.hidden = sortedEntries.length > 0;
  updateBalance();
}

function addEntry() {
  const entry = {
    id: createId(),
    date: getToday(),
    description: '',
    income: 0,
    expense: 0,
    createdAt: new Date().toISOString()
  };

  ledgerEntries.push(entry);
  saveEntries();
  renderEntries();

  const descriptionInput = ledgerBody.querySelector(
    `[data-entry-id="${entry.id}"] .ledger-description`
  );
  descriptionInput?.focus();
}

export function initLedger() {
  ledgerEntries = loadLedgerEntries();
  addLedgerEntry.addEventListener('click', addEntry);
  renderEntries();
}
