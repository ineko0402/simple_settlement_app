export function initKeyboardSupport() {
  // キーボード表示時の自動スクロール
  document.querySelectorAll('.input').forEach(input => {
    input.addEventListener('focus', () => {
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  });
}