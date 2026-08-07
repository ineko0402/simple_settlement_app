/root/.profile: line 9: /dev/null: Permission denied
let snackbarTimer = 0;

export const parseIntSafe = value => {
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
};

export const formatNumber = number => {
  return number.toLocaleString('ja-JP');
};

export function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  window.clearTimeout(snackbarTimer);
  snackbar.textContent = message;
  snackbar.classList.add('show');

  snackbarTimer = window.setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000);
}

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
