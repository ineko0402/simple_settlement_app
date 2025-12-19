import { showSnackbar } from './utils.js';

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('.material-symbols-outlined');
  icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
}

export function initTheme() {
  // 初期テーマ読み込み
  const savedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // テーマ切り替えイベント
  themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);
    localStorage.setItem('theme', newTheme);
    showSnackbar(newTheme === 'dark' ? 'ダークモードON' : 'ライトモードON');
  });
}