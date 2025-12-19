import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initSwipe } from './swipe.js';
import { initSettlement } from './settlement.js';
import { initNyukin, loadNyukinSettings } from './nyukin.js';
import { initImportTax } from './import-tax.js';
import { initFab } from './fab.js';
import { initKeyboardSupport } from './keyboard.js';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  
  initTheme();
  initNavigation();
  initSwipe();
  initSettlement();
  initNyukin();
  initImportTax();
  initFab();
  initKeyboardSupport();
  
  // 保存済み設定の読み込み
  loadNyukinSettings();
  
  console.log('App initialized');
});