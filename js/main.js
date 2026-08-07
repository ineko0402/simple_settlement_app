import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initSwipe } from './swipe.js';
import { initSettlement } from './settlement.js';
import { initNyukin, loadNyukinSettings } from './nyukin.js';
import { initImportTax } from './import-tax.js';
import { initLedger } from './ledger.js';
import { initLedgerSummary } from './ledger-summary.js';
import { initFab } from './fab.js';
import { initKeyboardSupport } from './keyboard.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initSwipe();
  initSettlement();
  initNyukin();
  initImportTax();
  initLedger();
  initLedgerSummary();
  initFab();
  initKeyboardSupport();
  loadNyukinSettings();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.error('Service Workerを登録できませんでした。', error);
    });
  }
});
