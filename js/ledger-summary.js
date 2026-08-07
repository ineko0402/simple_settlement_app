import { formatNumber, parseIntSafe, showSnackbar } from './utils.js';
import {
  loadLedgerEntries,
  loadLedgerCarryovers,
  saveLedgerCarryovers
} from './ledger-storage.js';

let currentView = 'input';
let selectedMonth = getCurrentMonth();
let ledgerInputView;
let ledgerSummaryView;
let ledgerPeriodLabel;
let ledgerSummaryList;
let ledgerCarryWarning;
let ledgerBalance;
let ledgerBalanceLabel;

function getCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKey(dateValue) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue.slice(0, 7) : '';
}

function addMonths(month, amount) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${year}年${monthNumber}月`;
}

function parseDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatShortDate(date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function formatDailyLabel(dateValue) {
  const date = parseDate(dateValue);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${formatShortDate(date)}（${weekdays[date.getUTCDay()]}）`;
}

function getSignedAmount(entry) {
  return entry.type === 'income' ? entry.amount : -entry.amount;
}

function getMonthEntries(entries, month) {
  return entries.filter(entry => getMonthKey(entry.date) === month);
}

function getTotals(entries) {
  return entries.reduce((totals, entry) => {
    if (entry.type === 'income') {
      totals.income += entry.amount;
    } else {
      totals.expense += entry.amount;
    }
    totals.net = totals.income - totals.expense;
    return totals;
  }, { income: 0, expense: 0, net: 0 });
}

export function resolveOpeningBalance(month, entries, carryovers) {
  if (carryovers[month]) return carryovers[month].amount;

  const priorMonths = Object.keys(carryovers)
    .filter(carryoverMonth => carryoverMonth < month)
    .sort();
  const anchorMonth = priorMonths[priorMonths.length - 1];
  let balance = anchorMonth ? carryovers[anchorMonth].amount : 0;

  for (const entry of entries) {
    const entryMonth = getMonthKey(entry.date);
    const afterAnchor = !anchorMonth || entryMonth >= anchorMonth;
    if (entryMonth && afterAnchor && entryMonth < month) {
      balance += getSignedAmount(entry);
    }
  }

  return balance;
}

export function calculateMonthSummary(month, entries, carryovers) {
  const opening = resolveOpeningBalance(month, entries, carryovers);
  const totals = getTotals(getMonthEntries(entries, month));
  return {
    month,
    opening,
    ...totals,
    closing: opening + totals.net
  };
}

export function aggregateDaily(month, entries, carryovers) {
  const groups = new Map();

  for (const entry of getMonthEntries(entries, month)) {
    if (!groups.has(entry.date)) groups.set(entry.date, []);
    groups.get(entry.date).push(entry);
  }

  let balance = resolveOpeningBalance(month, entries, carryovers);
  return [...groups.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, dailyEntries]) => {
      const totals = getTotals(dailyEntries);
      balance += totals.net;
      return { key: date, label: formatDailyLabel(date), ...totals, balance };
    });
}

export function aggregateWeekly(month, entries, carryovers) {
  const groups = new Map();
  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
  const monthEnd = new Date(Date.UTC(year, monthNumber, 0));

  for (const entry of getMonthEntries(entries, month)) {
    const entryDate = parseDate(entry.date);
    const weekdayFromMonday = (entryDate.getUTCDay() + 6) % 7;
    const monday = new Date(entryDate);
    monday.setUTCDate(entryDate.getUTCDate() - weekdayFromMonday);
    const key = monday.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  let balance = resolveOpeningBalance(month, entries, carryovers);
  return [...groups.entries()].sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
    .map(([weekStart, weeklyEntries]) => {
      const monday = parseDate(weekStart);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      const displayStart = monday < monthStart ? monthStart : monday;
      const displayEnd = sunday > monthEnd ? monthEnd : sunday;
      const totals = getTotals(weeklyEntries);
      balance += totals.net;
      return {
        key: weekStart,
        label: `${formatShortDate(displayStart)}～${formatShortDate(displayEnd)}`,
        ...totals,
        balance
      };
    });
}

export function calculateBalanceToEntry(entries, carryovers, targetId) {
  const targetEntry = entries.find(entry => entry.id === targetId);
  if (!targetEntry) return 0;

  const month = getMonthKey(targetEntry.date);
  let balance = resolveOpeningBalance(month, entries, carryovers);
  const sortedEntries = getMonthEntries(entries, month).sort((entryA, entryB) => {
    const dateComparison = entryA.date.localeCompare(entryB.date);
    return dateComparison || entryA.createdAt.localeCompare(entryB.createdAt);
  });

  for (const entry of sortedEntries) {
    balance += getSignedAmount(entry);
    if (entry.id === targetId) break;
  }

  return balance;
}

function createButton(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function createCarryoverRow(label, amount, detail, button) {
  const row = document.createElement('div');
  row.className = 'ledger-carry-row';

  const text = document.createElement('div');
  const title = document.createElement('strong');
  const note = document.createElement('small');
  title.textContent = label;
  note.textContent = detail;
  text.append(title, note);

  const value = document.createElement('span');
  value.className = 'ledger-carry-value';
  value.textContent = `${formatNumber(amount)}円`;

  row.append(text, value);
  if (button) row.append(button);
  return row;
}

function createSummaryItem(item) {
  const row = document.createElement('div');
  row.className = 'ledger-summary-item';

  const heading = document.createElement('div');
  heading.className = 'ledger-summary-heading';
  const label = document.createElement('strong');
  const balance = document.createElement('span');
  label.textContent = item.label;
  balance.textContent = `残高 ${formatNumber(item.balance)}円`;
  heading.append(label, balance);

  const details = document.createElement('div');
  details.className = 'ledger-summary-details';
  details.innerHTML = [
    `<span class="income">入金 ＋${formatNumber(item.income)}</span>`,
    `<span class="expense">出金 －${formatNumber(item.expense)}</span>`,
    `<span>差額 ${item.net >= 0 ? '＋' : '－'}${formatNumber(Math.abs(item.net))}</span>`
  ].join('');

  row.append(heading, details);
  return row;
}

function editOpeningBalance() {
  const entries = loadLedgerEntries();
  const carryovers = loadLedgerCarryovers();
  const currentAmount = resolveOpeningBalance(selectedMonth, entries, carryovers);
  const input = window.prompt(
    `${formatMonth(selectedMonth)}の前月繰越を入力してください。`,
    String(currentAmount)
  );
  if (input === null) return;

  carryovers[selectedMonth] = {
    amount: Math.trunc(parseIntSafe(input)),
    mode: 'manual',
    sourceMonth: '',
    updatedAt: new Date().toISOString()
  };
  saveLedgerCarryovers(carryovers);
  showSnackbar('前月繰越を保存しました');
  refreshLedgerSummary();
}

function carryToNextMonth() {
  const entries = loadLedgerEntries();
  const carryovers = loadLedgerCarryovers();
  const summary = calculateMonthSummary(selectedMonth, entries, carryovers);
  const nextMonth = addMonths(selectedMonth, 1);
  const existing = carryovers[nextMonth];

  if (existing && existing.amount === summary.closing) {
    showSnackbar(`${formatMonth(nextMonth)}の前月繰越は登録済みです`);
    return;
  }

  if (existing && existing.amount !== summary.closing) {
    const confirmed = window.confirm(
      `${formatMonth(nextMonth)}の前月繰越を` +
      `${formatNumber(existing.amount)}円から${formatNumber(summary.closing)}円へ更新しますか？`
    );
    if (!confirmed) return;
  }

  carryovers[nextMonth] = {
    amount: summary.closing,
    mode: 'carry',
    sourceMonth: selectedMonth,
    updatedAt: new Date().toISOString()
  };
  saveLedgerCarryovers(carryovers);
  showSnackbar(`${formatNumber(summary.closing)}円を${formatMonth(nextMonth)}へ繰り越しました`);
  refreshLedgerSummary();
}

function updateStaleCarryover() {
  const entries = loadLedgerEntries();
  const carryovers = loadLedgerCarryovers();
  const current = carryovers[selectedMonth];
  if (!current?.sourceMonth) return;

  const sourceSummary = calculateMonthSummary(current.sourceMonth, entries, carryovers);
  carryovers[selectedMonth] = {
    ...current,
    amount: sourceSummary.closing,
    updatedAt: new Date().toISOString()
  };
  saveLedgerCarryovers(carryovers);
  showSnackbar('前月繰越を再計算しました');
  refreshLedgerSummary();
}

function renderStaleWarning(entries, carryovers) {
  const current = carryovers[selectedMonth];
  ledgerCarryWarning.replaceChildren();
  ledgerCarryWarning.hidden = true;
  if (current?.mode !== 'carry' || !current.sourceMonth) return;

  const recalculated = calculateMonthSummary(current.sourceMonth, entries, carryovers).closing;
  if (recalculated === current.amount) return;

  const message = document.createElement('span');
  message.textContent = `前月残高が変更されています（保存 ${formatNumber(current.amount)}円／再計算 ${formatNumber(recalculated)}円）`;
  const button = createButton('繰越を更新', 'ledger-small-button', updateStaleCarryover);
  ledgerCarryWarning.append(message, button);
  ledgerCarryWarning.hidden = false;
}

function renderSummary() {
  const entries = loadLedgerEntries();
  const carryovers = loadLedgerCarryovers();
  const summary = calculateMonthSummary(selectedMonth, entries, carryovers);
  const savedOpening = carryovers[selectedMonth];
  ledgerPeriodLabel.textContent = formatMonth(selectedMonth);
  ledgerSummaryList.replaceChildren();

  renderStaleWarning(entries, carryovers);

  const openingDetail = savedOpening
    ? savedOpening.mode === 'carry' ? '保存済みの繰越' : '手動設定'
    : '自動計算';
  const editButton = createButton('設定', 'ledger-small-button', editOpeningBalance);
  ledgerSummaryList.append(
    createCarryoverRow('前月繰越', summary.opening, openingDetail, editButton)
  );

  let items = [];
  if (currentView === 'daily') {
    items = aggregateDaily(selectedMonth, entries, carryovers);
  } else if (currentView === 'weekly') {
    items = aggregateWeekly(selectedMonth, entries, carryovers);
  } else if (currentView === 'monthly') {
    items = [{
      label: `${Number(selectedMonth.slice(5))}月`,
      income: summary.income,
      expense: summary.expense,
      net: summary.net,
      balance: summary.closing
    }];
  }

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'ledger-summary-empty';
    empty.textContent = 'この期間の取引はありません。';
    ledgerSummaryList.append(empty);
  } else {
    ledgerSummaryList.append(...items.map(createSummaryItem));
  }

  const carryButton = createButton('次月へ繰越', 'ledger-small-button', carryToNextMonth);
  ledgerSummaryList.append(
    createCarryoverRow('次月繰越', summary.closing, '当月末残高', carryButton)
  );

  ledgerBalanceLabel.textContent = `${Number(selectedMonth.slice(5))}月末`;
  ledgerBalance.textContent = `${formatNumber(summary.closing)} 円`;
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.ledger-view-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.ledgerView === view);
  });

  const inputActive = view === 'input';
  ledgerInputView.hidden = !inputActive;
  ledgerSummaryView.hidden = inputActive;
  refreshLedgerSummary();
}

export function refreshLedgerSummary() {
  const entries = loadLedgerEntries();
  const carryovers = loadLedgerCarryovers();

  if (currentView === 'input') {
    const summary = calculateMonthSummary(getCurrentMonth(), entries, carryovers);
    ledgerBalanceLabel.textContent = '残高';
    ledgerBalance.textContent = `${formatNumber(summary.closing)} 円`;
    return;
  }

  renderSummary();
}

export function initLedgerSummary() {
  ledgerInputView = document.getElementById('ledgerInputView');
  ledgerSummaryView = document.getElementById('ledgerSummaryView');
  ledgerPeriodLabel = document.getElementById('ledgerPeriodLabel');
  ledgerSummaryList = document.getElementById('ledgerSummaryList');
  ledgerCarryWarning = document.getElementById('ledgerCarryWarning');
  ledgerBalance = document.getElementById('ledgerBalance');
  ledgerBalanceLabel = document.getElementById('ledgerBalanceLabel');

  document.querySelectorAll('.ledger-view-tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.ledgerView));
  });
  document.getElementById('ledgerPrevMonth').addEventListener('click', () => {
    selectedMonth = addMonths(selectedMonth, -1);
    renderSummary();
  });
  document.getElementById('ledgerNextMonth').addEventListener('click', () => {
    selectedMonth = addMonths(selectedMonth, 1);
    renderSummary();
  });
  window.addEventListener('ledger:changed', refreshLedgerSummary);

  setView('input');
}
