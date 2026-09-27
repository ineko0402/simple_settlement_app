// 帳簿データの完全バックアップ、復元、CSV出力を管理する。
import { showSnackbar } from './utils.js';
import {
  loadLedgerEntries,
  loadLedgerCarryovers,
  saveLedgerEntries,
  saveLedgerCarryovers
} from './ledger-storage.js';

const SCHEMA_VERSION = 1;
const MAX_BACKUP_SIZE = 5 * 1024 * 1024;

let pendingBackup = null;

function formatTimestamp(date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ];
  return `${parts.slice(0, 3).join('')}_${parts.slice(3).join('')}`;
}

function downloadFile(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createBackup() {
  return {
    app: 'simple-settlement-app',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    entries: loadLedgerEntries(),
    carryovers: loadLedgerCarryovers()
  };
}

function exportBackup() {
  const backup = createBackup();
  const fileName = `pocket-ledger-backup_${formatTimestamp(new Date())}.json`;
  downloadFile(
    JSON.stringify(backup, null, 2),
    'application/json;charset=utf-8',
    fileName
  );
  showSnackbar('完全バックアップを保存しました');
}

function escapeCsv(value) {
  let text = String(value ?? '');
  // Excelで開いたとき、入力内容が数式として実行されないようにする。
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  const entries = loadLedgerEntries().sort((entryA, entryB) => {
    const dateComparison = entryA.date.localeCompare(entryB.date);
    return dateComparison || entryA.createdAt.localeCompare(entryB.createdAt);
  });
  const rows = [
    ['日付', '内容', '種別', '金額'],
    ...entries.map(entry => [
      entry.date,
      entry.description,
      entry.type === 'income' ? '入金' : '出金',
      entry.amount
    ])
  ];
  const csv = `\uFEFF${rows.map(row => row.map(escapeCsv).join(',')).join('\r\n')}`;
  const fileName = `pocket-ledger_${formatTimestamp(new Date())}.csv`;
  downloadFile(csv, 'text/csv;charset=utf-8', fileName);
  showSnackbar(`${entries.length}件をCSVで出力しました`);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function isTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validateEntry(entry, ids) {
  if (!isObject(entry)) throw new Error('明細の形式が正しくありません。');
  if (typeof entry.id !== 'string' || !entry.id) throw new Error('明細IDがありません。');
  if (ids.has(entry.id)) throw new Error('明細IDが重複しています。');
  if (!isDate(entry.date)) throw new Error('明細の日付が正しくありません。');
  if (typeof entry.description !== 'string') throw new Error('明細の内容が正しくありません。');
  if (!['income', 'expense'].includes(entry.type)) throw new Error('明細の種別が正しくありません。');
  if (!Number.isInteger(entry.amount) || entry.amount < 0) throw new Error('明細の金額が正しくありません。');
  if (!isTimestamp(entry.createdAt)) throw new Error('明細の登録日時が正しくありません。');
  ids.add(entry.id);
}

function validateCarryover(month, carryover) {
  if (!isMonth(month) || !isObject(carryover)) throw new Error('繰越データの形式が正しくありません。');
  if (!Number.isInteger(carryover.amount)) throw new Error('繰越金額が正しくありません。');
  if (!['manual', 'carry'].includes(carryover.mode)) throw new Error('繰越種別が正しくありません。');
  if (typeof carryover.sourceMonth !== 'string' ||
      (carryover.sourceMonth && !isMonth(carryover.sourceMonth))) {
    throw new Error('繰越元の年月が正しくありません。');
  }
  if (!isTimestamp(carryover.updatedAt)) throw new Error('繰越の更新日時が正しくありません。');
}

function validateBackup(backup) {
  if (!isObject(backup) || backup.app !== 'simple-settlement-app') {
    throw new Error('このアプリのバックアップファイルではありません。');
  }
  if (backup.schemaVersion !== SCHEMA_VERSION) {
    throw new Error('対応していないバックアップ形式です。');
  }
  if (!isTimestamp(backup.exportedAt)) throw new Error('バックアップ日時が正しくありません。');
  if (!Array.isArray(backup.entries)) throw new Error('明細データが見つかりません。');
  if (!isObject(backup.carryovers)) throw new Error('繰越データが見つかりません。');

  const ids = new Set();
  backup.entries.forEach(entry => validateEntry(entry, ids));
  Object.entries(backup.carryovers).forEach(([month, carryover]) => {
    validateCarryover(month, carryover);
  });
  return backup;
}

function addDetail(list, label, value) {
  const term = document.createElement('dt');
  const detail = document.createElement('dd');
  term.textContent = label;
  detail.textContent = value;
  list.append(term, detail);
}

function showImportPreview(backup) {
  const preview = document.getElementById('ledgerImportPreview');
  const details = document.getElementById('ledgerImportDetails');
  const dates = backup.entries.map(entry => entry.date).sort();
  const period = dates.length ? `${dates[0]} ～ ${dates[dates.length - 1]}` : 'データなし';
  details.replaceChildren();
  addDetail(details, 'バックアップ日時', new Date(backup.exportedAt).toLocaleString('ja-JP'));
  addDetail(details, '明細件数', `${backup.entries.length}件`);
  addDetail(details, '対象期間', period);
  addDetail(details, '繰越設定', `${Object.keys(backup.carryovers).length}件`);
  preview.hidden = false;
}

async function selectBackup(event) {
  const [file] = event.target.files;
  if (!file) return;

  try {
    if (file.size > MAX_BACKUP_SIZE) throw new Error('バックアップファイルが大きすぎます。');
    const backup = validateBackup(JSON.parse(await file.text()));
    pendingBackup = backup;
    showImportPreview(backup);
  } catch (error) {
    pendingBackup = null;
    document.getElementById('ledgerImportPreview').hidden = true;
    showSnackbar(error instanceof SyntaxError ? 'JSONファイルを読み込めませんでした。' : error.message);
  } finally {
    event.target.value = '';
  }
}

function restoreBackup() {
  if (!pendingBackup) return;

  const currentEntries = loadLedgerEntries();
  const currentCarryovers = loadLedgerCarryovers();
  try {
    // 両方の検証完了後に保存し、不正データによる部分的な復元を避ける。
    saveLedgerEntries(pendingBackup.entries);
    saveLedgerCarryovers(pendingBackup.carryovers);
    showSnackbar('バックアップを復元しました');
    window.setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    // 保存途中で失敗した場合は、復元前の状態へ戻す。
    try {
      saveLedgerEntries(currentEntries);
      saveLedgerCarryovers(currentCarryovers);
    } catch (rollbackError) {
      console.error('復元前の状態へ戻せませんでした。', rollbackError);
    }
    console.error('バックアップを復元できませんでした。', error);
    showSnackbar('保存領域に復元できませんでした。');
  }
}

function cancelImport() {
  pendingBackup = null;
  document.getElementById('ledgerImportPreview').hidden = true;
}

export function initLedgerBackup() {
  const modal = document.getElementById('ledgerDataModal');
  const openButton = document.getElementById('ledgerDataManagement');
  const closeButton = document.getElementById('ledgerDataModalClose');
  const fileInput = document.getElementById('ledgerBackupFile');

  const openModal = () => {
    modal.hidden = false;
    document.body.classList.add('ledger-modal-open');
    closeButton.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('ledger-modal-open');
    cancelImport();
    openButton.focus();
  };

  openButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.getElementById('ledgerBackupExport').addEventListener('click', exportBackup);
  document.getElementById('ledgerCsvExport').addEventListener('click', exportCsv);
  document.getElementById('ledgerBackupImport').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', selectBackup);
  document.getElementById('ledgerImportCancel').addEventListener('click', cancelImport);
  document.getElementById('ledgerImportConfirm').addEventListener('click', restoreBackup);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });
}
