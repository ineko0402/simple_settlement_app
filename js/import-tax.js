import { parseIntSafe, formatNumber, showSnackbar } from './utils.js';

const calculateImport = document.getElementById('calculateImport');
const importResult = document.getElementById('importResult');

export function initImportTax() {
  calculateImport.addEventListener('click', () => {
    const paidTax = parseIntSafe(document.getElementById('paidTax').value);

    if (paidTax <= 0) {
      showSnackbar('支払消費税を入力してください');
      return;
    }

    const A = (paidTax + 100) / 0.1;
    const B = Math.floor(A / 1000) * 1000;
    const C = B * 0.078;
    const importTax = Math.floor(C / 100) * 100;
    const D = importTax * (22 / 78);
    const localTax = Math.floor(D / 100) * 100;

    document.getElementById('outputPaidTax').textContent = formatNumber(paidTax);
    document.getElementById('outputImportTax').textContent = formatNumber(importTax);
    document.getElementById('outputLocalTax').textContent = formatNumber(localTax);

    importResult.style.display = 'block';
    showSnackbar('計算完了');

    // 結果までスクロール
    setTimeout(() => {
      importResult.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  });
}

export function resetImportTax() {
  document.getElementById('paidTax').value = '';
  importResult.style.display = 'none';
}