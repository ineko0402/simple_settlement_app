import { showSnackbar } from './utils.js';
import { getCurrentSectionId } from './navigation.js';
import { resetSettlement } from './settlement.js';
import { resetNyukin } from './nyukin.js';
import { resetImportTax } from './import-tax.js';

const resetFab = document.getElementById('resetFab');

export function initFab() {
  resetFab.addEventListener('click', () => {
    const currentSection = getCurrentSectionId();
    console.log('FAB clicked, current section:', currentSection); // デバッグ用
    
    if (currentSection === 'settlement') {
      resetSettlement();
    } else if (currentSection === 'nyukin') {
      resetNyukin();
    } else if (currentSection === 'import') {
      resetImportTax();
    }
    
    showSnackbar('リセット完了');
  });
}