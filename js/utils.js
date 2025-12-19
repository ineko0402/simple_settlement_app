// 数字文字列 → 数値
export const parseIntSafe = (value) => {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// 3桁区切り
export const formatNumber = (num) => {
  return num.toLocaleString("ja-JP");
};

// スナックバー表示
export function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.classList.add('show');
  setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000);
}

// カウントアップアニメーション
export function animateValue(element, start, end, duration = 800) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    const formatted = formatNumber(Math.floor(Math.abs(current)));
    element.textContent = current < 0 ? `-${formatted}` : formatted;
  }, 16);
}