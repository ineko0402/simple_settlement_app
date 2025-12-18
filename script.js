// 数字文字列 → 数値
const parseIntSafe = (value) => {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// 3桁区切り
const formatNumber = (num) => {
  return num.toLocaleString("ja-JP");
};

// 統合結果の計算
// 結果は 1 つだけ（受け取り / 支払い / 0）
const calculateResult = (karibarai, seisan, otsuri) => {
  // 調整後の実質的な清算額
  const adjustedSeisan = seisan + (otsuri ?? Math.max(karibarai - seisan, 0));

  const diff = karibarai - adjustedSeisan;

  if (diff > 0) {
    return `受け取り ${formatNumber(diff)} 円`;
  } else if (diff < 0) {
    return `支払い ${formatNumber(Math.abs(diff))} 円`;
  } else {
    return "精算済み（0 円）";
  }
};

// DOM
const karibaraiInput = document.getElementById("karibarai");
const seisanInput = document.getElementById("seisan");
const otsuriInput = document.getElementById("otsuri");
const resultOutput = document.getElementById("resultOutput");
const resetButton = document.getElementById("resetButton");

// 入力確定（blur）で発火
[karibaraiInput, seisanInput, otsuriInput].forEach((el) => {
  el.addEventListener("blur", () => {
    trigger();
  });
});

// 発火条件：仮払金 > 0 かつ 清算 > 0
const trigger = () => {
  const karibarai = parseIntSafe(karibaraiInput.value);
  const seisan = parseIntSafe(seisanInput.value);
  const otsuriValue = otsuriInput.value
    ? parseIntSafe(otsuriInput.value)
    : null;

  if (karibarai > 0 && seisan > 0) {
    const result = calculateResult(karibarai, seisan, otsuriValue);
    resultOutput.textContent = result;
  }
};

// リセット機能
resetButton.addEventListener("click", () => {
  karibaraiInput.value = "";
  seisanInput.value = "";
  otsuriInput.value = "";
  resultOutput.textContent = "0";
});

// 入金仕訳機能
const nyukinAmountInput = document.getElementById("nyukinAmount");
const tesuryoInput = document.getElementById("tesuryo");
const taxRoundingSelect = document.getElementById("taxRounding");
const resetNyukinButton = document.getElementById("resetNyukinButton");
const calculateNyukinButton = document.getElementById("calculateNyukinButton");
const debitYokin = document.getElementById("debitYokin");
const debitTesuryo = document.getElementById("debitTesuryo");
const debitKariharaiTax = document.getElementById("debitKariharaiTax");
const debitTotal = document.getElementById("debitTotal");
const creditSyunyu = document.getElementById("creditSyunyu");
const creditKariukeTax = document.getElementById("creditKariukeTax");
const creditTotal = document.getElementById("creditTotal");

// localStorageから設定読み込み
window.addEventListener("load", () => {
  const savedTesuryo = localStorage.getItem("tesuryo");
  if (savedTesuryo) tesuryoInput.value = savedTesuryo;
  const savedRounding = localStorage.getItem("taxRounding");
  if (savedRounding) taxRoundingSelect.value = savedRounding;
});

// 設定保存
function saveSettings() {
  localStorage.setItem("tesuryo", tesuryoInput.value);
  localStorage.setItem("taxRounding", taxRoundingSelect.value);
}

// 入金仕訳計算
function calculateNyukin() {
  const nyukin = parseIntSafe(nyukinAmountInput.value);
  const tesuryo = parseIntSafe(tesuryoInput.value);
  const rounding = taxRoundingSelect.value;

  if (nyukin <= 0 || tesuryo < 0) return;

  const debitTotalValue = nyukin + tesuryo;
  const nyukinTax = nyukin - nyukin / 1.1;
  const tesuryoTax = tesuryo - tesuryo / 1.1;
  const totalTax = nyukinTax + tesuryoTax;
  let roundedTotalTax;
  if (rounding === "floor") {
    roundedTotalTax = Math.floor(totalTax);
  } else {
    roundedTotalTax = Math.round(totalTax);
  }
  const syunyu = debitTotalValue - roundedTotalTax;
  const tesuryoBody = Math.round(tesuryo / 1.1);
  const kariharaiTax = Math.round(tesuryoTax);

  debitYokin.textContent = formatNumber(nyukin);
  debitTesuryo.textContent = formatNumber(tesuryoBody);
  debitKariharaiTax.textContent = formatNumber(kariharaiTax);
  debitTotal.textContent = formatNumber(debitTotalValue);
  creditSyunyu.textContent = formatNumber(syunyu);
  creditKariukeTax.textContent = formatNumber(roundedTotalTax);
  creditTotal.textContent = formatNumber(debitTotalValue);
}

// イベントリスナー
tesuryoInput.addEventListener("blur", saveSettings);
taxRoundingSelect.addEventListener("change", saveSettings);

resetNyukinButton.addEventListener("click", () => {
  nyukinAmountInput.value = "";
  tesuryoInput.value = "";
  taxRoundingSelect.value = "floor";
  debitYokin.textContent = "0";
  debitTesuryo.textContent = "0";
  debitKariharaiTax.textContent = "0";
  debitTotal.textContent = "0";
  creditSyunyu.textContent = "0";
  creditKariukeTax.textContent = "0";
  creditTotal.textContent = "0";
  saveSettings();
});

calculateNyukinButton.addEventListener("click", calculateNyukin);

// 輸入消費税仕訳機能
const paidTaxInput = document.getElementById("paidTax");
const resetImportTaxButton = document.getElementById("resetImportTaxButton");
const calculateImportTaxButton = document.getElementById("calculateImportTaxButton");
const outputPaidTax = document.getElementById("outputPaidTax");
const outputImportTax = document.getElementById("outputImportTax");
const outputLocalTax = document.getElementById("outputLocalTax");

// 輸入消費税計算
function calculateImportTax() {
  const paidTax = parseIntSafe(paidTaxInput.value);
  if (paidTax <= 0) return;

  const A = (paidTax + 100) / 0.1;
  const B = Math.floor(A / 1000) * 1000;
  const C = B * 0.078;
  const importTax = Math.floor(C / 100) * 100;
  const D = importTax * (22 / 78);
  const localTax = Math.floor(D / 100) * 100;

  outputPaidTax.textContent = formatNumber(paidTax);
  outputImportTax.textContent = formatNumber(importTax);
  outputLocalTax.textContent = formatNumber(localTax);
}

// イベントリスナー
resetImportTaxButton.addEventListener("click", () => {
  paidTaxInput.value = "";
  outputPaidTax.textContent = "0";
  outputImportTax.textContent = "0";
  outputLocalTax.textContent = "0";
});



// 輸入消費税計算
function calculateImportTax() {
  const paidTax = parseIntSafe(paidTaxInput.value);
  if (paidTax <= 0) return;

  const A = (paidTax + 100) / 0.1;
  const B = Math.floor(A / 1000) * 1000;
  const C = B * 0.078;
  const importTax = Math.floor(C / 100) * 100;
  const D = importTax * (22 / 78);
  const localTax = Math.floor(D / 100) * 100;

  outputPaidTax.textContent = formatNumber(paidTax);
  outputImportTax.textContent = formatNumber(importTax);
  outputLocalTax.textContent = formatNumber(localTax);
}

// イベントリスナー
resetImportTaxButton.addEventListener("click", () => {
  paidTaxInput.value = "";
  outputPaidTax.textContent = "0";
  outputImportTax.textContent = "0";
  outputLocalTax.textContent = "0";
});

calculateImportTaxButton.addEventListener("click", calculateImportTax);

calculateImportTaxButton.addEventListener("click", calculateImportTax);

// ナビゲーション機能
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // アクティブクラスをリセット
    navButtons.forEach(b => b.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    
    // クリックされたボタンをアクティブに
    btn.classList.add("active");
    const sectionId = btn.getAttribute("data-section");
    document.getElementById(sectionId).classList.add("active");
  });
});

// ダークモード機能
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
  const currentTheme = body.getAttribute("data-theme");
  if (currentTheme === "light") {
    body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  } else {
    body.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌙";
  }
});
