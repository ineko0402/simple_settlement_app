import { parseIntSafe, formatNumber, showSnackbar } from './utils.js';

const calculateSettlement = document.getElementById('calculateSettlement');
const settlementResult = document.getElementById('settlementResult');

export function initSettlement() {
  calculateSettlement.addEventListener('click', () => {
    const karibarai = parseIntSafe(document.getElementById('karibarai').value);
    const seisan = parseIntSafe(document.getElementById('seisan').value);
    const otsuri = parseIntSafe(document.getElementById('otsuri').value) || 0;

    if (karibarai <= 0 || seisan <= 0) {
      showSnackbar('仮払金と清算額を入力してください');
      return;
    }

    const adjustedSeisan = seisan + otsuri;
    const diff = karibarai - adjustedSeisan;

    const resultValue = settlementResult.querySelector('.result-value');

    if (diff > 0) {
      resultValue.textContent = `受け取り ${formatNumber(diff)} 円`;
      settlementResult.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
    } else if (diff < 0) {
      resultValue.textContent = `支払い ${formatNumber(Math.abs(diff))} 円`;
      settlementResult.style.background = 'linear-gradient(135deg, #f44336, #c62828)';
    } else {
      resultValue.textContent = '精算済み（0 円）';
      settlementResult.style.background = 'linear-gradient(135deg, #2196f3, #1565c0)';
    }

    settlementResult.style.display = 'block';
    showSnackbar('計算完了');

    // 結果までスクロール
    setTimeout(() => {
      settlementResult.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  });
}

export function resetSettlement() {
  document.getElementById('karibarai').value = '';
  document.getElementById('seisan').value = '';
  document.getElementById('otsuri').value = '';
  settlementResult.style.display = 'none';
}