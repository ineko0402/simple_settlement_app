// ユーティリティ関数
const parseIntSafe = (value) => {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (num) => {
  return num.toLocaleString("ja-JP");
};

// スナックバー表示
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.classList.add('show');
  setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000);
}

// カウントアップアニメーション
function animateValue(element, start, end, duration = 800) {
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

// ナビゲーション
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
let currentSectionIndex = 0;
const sectionIds = ['settlement', 'nyukin', 'import'];

function navigateToSection(targetId) {
  const targetIndex = sectionIds.indexOf(targetId);
  const currentIndex = currentSectionIndex;
  
  sections.forEach(section => {
    section.classList.remove('active', 'slide-out-left', 'slide-in-right');
  });
  
  navItems.forEach(item => item.classList.remove('active'));
  
  if (targetIndex > currentIndex) {
    sections[currentIndex].classList.add('slide-out-left');
    sections[targetIndex].classList.add('slide-in-right');
  } else if (targetIndex < currentIndex) {
    sections[currentIndex].classList.add('slide-in-right');
    sections[targetIndex].classList.add('slide-out-left');
  }
  
  setTimeout(() => {
    sections[targetIndex].classList.add('active');
    navItems[targetIndex].classList.add('active');
    currentSectionIndex = targetIndex;
  }, 50);
}

navItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    const sectionId = item.getAttribute('data-section');
    navigateToSection(sectionId);
  });
});

// スワイプジェスチャー
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const threshold = 50;
  if (touchEndX < touchStartX - threshold) {
    // 左スワイプ - 次へ
    const nextIndex = (currentSectionIndex + 1) % sectionIds.length;
    navigateToSection(sectionIds[nextIndex]);
  }
  if (touchEndX > touchStartX + threshold) {
    // 右スワイプ - 前へ
    const prevIndex = (currentSectionIndex - 1 + sectionIds.length) % sectionIds.length;
    navigateToSection(sectionIds[prevIndex]);
  }
}

// テーマ切り替え
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('.material-symbols-outlined');
  icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
}

themeToggle.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  updateThemeIcon(newTheme);
  localStorage.setItem('theme', newTheme);
  showSnackbar(newTheme === 'dark' ? 'ダークモードON' : 'ライトモードON');
});

// 初期テーマ読み込み
const savedTheme = localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// 清算計算
const calculateSettlement = document.getElementById('calculateSettlement');
const settlementResult = document.getElementById('settlementResult');

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
});

// 入金計算
const calculateNyukin = document.getElementById('calculateNyukin');
const nyukinResult = document.getElementById('nyukinResult');

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
  
  // 設定保存
  localStorage.setItem('tesuryo', document.getElementById('tesuryo').value);
  localStorage.setItem('taxRounding', rounding);
});

// 輸入計算
const calculateImport = document.getElementById('calculateImport');
const importResult = document.getElementById('importResult');

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
});

// FABリセット機能
const resetFab = document.getElementById('resetFab');

resetFab.addEventListener('click', () => {
  const currentSection = sectionIds[currentSectionIndex];
  
  if (currentSection === 'settlement') {
    document.getElementById('karibarai').value = '';
    document.getElementById('seisan').value = '';
    document.getElementById('otsuri').value = '';
    settlementResult.style.display = 'none';
  } else if (currentSection === 'nyukin') {
    document.getElementById('nyukinAmount').value = '';
    document.getElementById('tesuryo').value = '';
    nyukinResult.style.display = 'none';
  } else if (currentSection === 'import') {
    document.getElementById('paidTax').value = '';
    importResult.style.display = 'none';
  }
  
  showSnackbar('リセット完了');
});

// 保存済み設定の読み込み
window.addEventListener('load', () => {
  const savedTesuryo = localStorage.getItem('tesuryo');
  if (savedTesuryo) document.getElementById('tesuryo').value = savedTesuryo;
  
  const savedRounding = localStorage.getItem('taxRounding');
  if (savedRounding) document.getElementById('taxRounding').value = savedRounding;
});

// キーボード表示時の自動スクロール
document.querySelectorAll('.input').forEach(input => {
  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
});