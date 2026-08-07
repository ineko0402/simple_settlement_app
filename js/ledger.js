import { formatNumber, parseIntSafe, showSnackbar } from './utils.js';
import {
  loadLedgerEntries,
  loadLedgerCarryovers,
  saveLedgerEntries
} from './ledger-storage.js';
import { calculateBalanceToEntry } from './ledger-summary.js';

const ledgerBody = document.getElementById('ledgerBody');
const ledgerEmpty = document.getElementById('ledgerEmpty');
const addLedgerEntry = document.getElementById('addLedgerEntry');
const ledgerEntryModal = document.getElementById('ledgerEntryModal');
const ledgerModalClose = document.getElementById('ledgerModalClose');
const ledgerModalDate = document.getElementById('ledgerModalDate');
const ledgerModalDateLabel = document.getElementById('ledgerModalDateLabel');
const ledgerModalDescription = document.getElementById('ledgerModalDescription');
const ledgerModalExpense = document.getElementById('ledgerModalExpense');
const ledgerModalIncome = document.getElementById('ledgerModalIncome');
const ledgerModalAmount = document.getElementById('ledgerModalAmount');
const ledgerModalSaveContinue = document.getElementById('ledgerModalSaveContinue');
const ledgerModalSave = document.getElementById('ledgerModalSave');

let ledgerEntries = [];
let modalEntryType = 'expense';

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

function formatDate(dateValue) {
  const [, month = '', day = ''] = dateValue.split('-');
  return month && day ? `${Number(month)}/${Number(day)}` : '';
}

function getSortedEntries() {
  return [...ledgerEntries].sort((entryA, entryB) => {
    const dateComparison = entryA.date.localeCompare(entryB.date);
    return dateComparison || entryA.createdAt.localeCompare(entryB.createdAt);
  });
}

function formatAmount(amount) {
  return amount > 0 ? formatNumber(amount) : '';
}

function saveEntries() {
  saveLedgerEntries(ledgerEntries);
  window.dispatchEvent(new Event('ledger:changed'));
}

function showEntryBalance(entryId) {
  const balance = calculateBalanceToEntry(
    ledgerEntries,
    loadLedgerCarryovers(),
    entryId
  );
  showSnackbar(`この行までの残高：${formatNumber(balance)} 円`);
}

function updateEntry(entryId, fieldName, fieldValue) {
  const entry = ledgerEntries.find(item => item.id === entryId);
  if (!entry) return;

  entry[fieldName] = fieldValue;
  saveEntries();
}

function updateAmount(entryId, fieldValue, currentInput) {
  const entry = ledgerEntries.find(item => item.id === entryId);
  if (!entry) return;

  entry.amount = Math.abs(Math.trunc(parseIntSafe(fieldValue)));
  saveEntries();
  currentInput.value = formatAmount(entry.amount);
  showEntryBalance(entryId);
}

function toggleType(entryId, toggleButton) {
  const entry = ledgerEntries.find(item => item.id === entryId);
  if (!entry) return;

  entry.type = entry.type === 'income' ? 'expense' : 'income';
  toggleButton.textContent = entry.type === 'income' ? '＋' : '－';
  toggleButton.classList.toggle('income', entry.type === 'income');
  toggleButton.classList.toggle('expense', entry.type === 'expense');
  toggleButton.setAttribute('aria-label', entry.type === 'income' ? '入金' : '出金');
  saveEntries();
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

function createDateField(entry) {
  const dateField = document.createElement('div');
  dateField.className = 'ledger-date-field';

  const dateLabel = document.createElement('span');
  dateLabel.className = 'ledger-date-label';
  dateLabel.textContent = formatDate(entry.date);
  dateLabel.setAttribute('aria-hidden', 'true');

  const dateInput = createInput('ledger-date-input', entry.date, '日付');
  dateInput.type = 'date';
  dateInput.addEventListener('change', event => {
    updateEntry(entry.id, 'date', event.target.value);
    renderEntries();
    showEntryBalance(entry.id);
  });

  dateField.append(dateLabel, dateInput);
  return dateField;
}

function createTransactionField(entry) {
  const transactionField = document.createElement('div');
  transactionField.className = 'ledger-transaction';

  const toggleButton = document.createElement('button');
  toggleButton.className = `ledger-type-toggle ${entry.type}`;
  toggleButton.type = 'button';
  toggleButton.textContent = entry.type === 'income' ? '＋' : '－';
  toggleButton.setAttribute('aria-label', entry.type === 'income' ? '入金' : '出金');
  toggleButton.addEventListener('click', () => toggleType(entry.id, toggleButton));

  const amountInput = createInput(
    'ledger-input ledger-amount',
    formatAmount(entry.amount),
    '金額'
  );
  amountInput.type = 'text';
  amountInput.inputMode = 'numeric';
  amountInput.placeholder = '0';
  amountInput.addEventListener('focus', () => {
    amountInput.value = entry.amount || '';
  });
  amountInput.addEventListener('blur', event => {
    updateAmount(entry.id, event.target.value, event.target);
  });

  transactionField.append(toggleButton, amountInput);
  return transactionField;
}

function createEntryRow(entry) {
  const row = document.createElement('div');
  row.className = 'ledger-row';
  row.dataset.entryId = entry.id;
  row.addEventListener('click', event => {
    if (event.target.closest('.ledger-delete')) return;
    showEntryBalance(entry.id);
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

  const deleteButton = document.createElement('button');
  deleteButton.className = 'ledger-delete';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', '行を削除');
  deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
  deleteButton.addEventListener('click', () => deleteEntry(entry.id));

  row.append(
    createDateField(entry),
    descriptionInput,
    createTransactionField(entry),
    deleteButton
  );
  return row;
}

function renderEntries() {
  const sortedEntries = getSortedEntries();
  ledgerBody.replaceChildren(...sortedEntries.map(createEntryRow));
  ledgerEmpty.hidden = sortedEntries.length > 0;
}

function setModalType(type) {
  modalEntryType = type;
  const isExpense = type === 'expense';
  ledgerModalExpense.classList.toggle('active', isExpense);
  ledgerModalExpense.setAttribute('aria-pressed', String(isExpense));
  ledgerModalIncome.classList.toggle('active', !isExpense);
  ledgerModalIncome.setAttribute('aria-pressed', String(!isExpense));
}

function updateModalDateLabel() {
  ledgerModalDateLabel.textContent = formatDate(ledgerModalDate.value);
}

function openEntryModal() {
  ledgerModalDate.value = getToday();
  ledgerModalDescription.value = '';
  ledgerModalAmount.value = '';
  setModalType('expense');
  updateModalDateLabel();
  ledgerEntryModal.hidden = false;
  document.body.classList.add('ledger-modal-open');
  window.requestAnimationFrame(() => ledgerModalDescription.focus());
}

function closeEntryModal() {
  ledgerEntryModal.hidden = true;
  document.body.classList.remove('ledger-modal-open');
  addLedgerEntry.focus();
}

function saveModalEntry(continueAfterSave) {
  if (!ledgerModalDate.value) {
    showSnackbar('日付を入力してください');
    ledgerModalDate.focus();
    return;
  }

  const amount = Math.abs(Math.trunc(parseIntSafe(ledgerModalAmount.value)));
  if (amount <= 0) {
    showSnackbar('1円以上の金額を入力してください');
    ledgerModalAmount.focus();
    return;
  }

  const entry = {
    id: createId(),
    date: ledgerModalDate.value,
    description: ledgerModalDescription.value.trim(),
    type: modalEntryType,
    amount,
    createdAt: new Date().toISOString()
  };

  ledgerEntries.push(entry);
  saveEntries();
  renderEntries();

  showEntryBalance(entry.id);

  if (continueAfterSave) {
    ledgerModalDescription.value = '';
    ledgerModalAmount.value = '';
    ledgerModalDescription.focus();
    return;
  }

  closeEntryModal();
  ledgerBody.querySelector(`[data-entry-id="${entry.id}"]`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}

export function initLedger() {
  ledgerEntries = loadLedgerEntries();
  saveLedgerEntries(ledgerEntries);
  addLedgerEntry.addEventListener('click', openEntryModal);
  ledgerModalClose.addEventListener('click', closeEntryModal);
  ledgerEntryModal.addEventListener('click', event => {
    if (event.target === ledgerEntryModal) closeEntryModal();
  });
  ledgerModalDate.addEventListener('change', updateModalDateLabel);
  ledgerModalExpense.addEventListener('click', () => setModalType('expense'));
  ledgerModalIncome.addEventListener('click', () => setModalType('income'));
  ledgerModalDescription.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    ledgerModalAmount.focus();
  });
  ledgerModalAmount.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    saveModalEntry(false);
  });
  ledgerModalSaveContinue.addEventListener('click', () => saveModalEntry(true));
  ledgerModalSave.addEventListener('click', () => saveModalEntry(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !ledgerEntryModal.hidden) closeEntryModal();
  });
  renderEntries();
}
