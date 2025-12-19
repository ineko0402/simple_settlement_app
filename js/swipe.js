import { navigateToSection, sectionIds, currentSectionIndex } from './navigation.js';

let touchStartX = 0;
let touchEndX = 0;

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

export function initSwipe() {
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
}