import { parseIntSafe, formatNumber, showSnackbar } from './utils.js';

const calculateNyukin = document.getElementById('calculateNyukin');
const nyukinResult = document.getElementById('nyukinResult');

export function initNyukin() {
  calculateNyukin.addEventListener('click', () => {
    const nyukin = parseIntSafe(document.getElementById('nyukinAmount').value);
    const tesuryo = parseIntSafe(document.getElementById('tesuryo').value);
    const rounding = document.getElementById('taxRounding').value;

    if (nyukin <= 0) {
      showSnackbar('入金額を入力してください');
      return;
    }

    const debitTotalValue = nyukin + tesuryo;
    const nyukinTax = nyukin - nyukin / 1.1;
    const tesuryoTax = tesuryo - tesuryo / 1.1;
    const totalTax = nyukinTax + tesuryoTax;
    const roundedTotalTax = rounding === 'floor' ? Math.floor(totalTax) : Math.round(totalTax);
    const syunyu = debitTotalValue - roundedTotalTax;
    const tesuryoBody = Math.round(tesuryo / 1.1);
    const kariharaiTax = Math.round(tesuryoTax);

    document.getElementById('debitYokin').textContent = formatNumber(nyukin);
    document.getElementById('debitTesuryo').textContent = formatNumber(tesuryoBody);
    document.getElementById('debitKariharaiTax').textContent = formatNumber(kariharaiTax);
    document.getElementById('creditSyunyu').textContent = formatNumber(syunyu);
    document.getElementById('creditKariukeTax').textContent = formatNumber(roundedTotalTax);

    nyukinResult.style.display = 'block';
    showSnackbar('計算完了');

    // 結果までスクロール
    setTimeout(() => {
      nyukinResult.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);

    // 設定保存
    localStorage.setItem('tesuryo', document.getElementById('tesuryo').value);
    localStorage.setItem('taxRounding', rounding);
  });
}

export function resetNyukin() {
  document.getElementById('nyukinAmount').value = '';
  document.getElementById('tesuryo').value = '';
  nyukinResult.style.display = 'none';
}

export function loadNyukinSettings() {
  const savedTesuryo = localStorage.getItem('tesuryo');
  if (savedTesuryo) document.getElementById('tesuryo').value = savedTesuryo;

  const savedRounding = localStorage.getItem('taxRounding');
  if (savedRounding) document.getElementById('taxRounding').value = savedRounding;
}