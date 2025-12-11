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
