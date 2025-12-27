import { navigateToSection, sectionIds, currentSectionIndex } from './navigation.js';

let touchStartX = 0;
let isDragging = false;
const sections = document.querySelectorAll('.section');

function updateSectionsTransform(diff) {
  const currentSection = sections[currentSectionIndex];
  const nextSection = sections[(currentSectionIndex + 1) % sectionIds.length];
  const prevSection = sections[(currentSectionIndex - 1 + sectionIds.length) % sectionIds.length];

  // 現在のセクション
  currentSection.style.transform = `translateX(${diff}px)`;
  currentSection.classList.add('switching');

  // 次のセクション
  if (diff < 0) {
    nextSection.style.transform = `translateX(${window.innerWidth + diff}px)`;
    nextSection.classList.add('next', 'switching');
    prevSection.classList.remove('prev', 'switching');
    prevSection.style.transform = '';
  }
  // 前のセクション
  else if (diff > 0) {
    prevSection.style.transform = `translateX(${-window.innerWidth + diff}px)`;
    prevSection.classList.add('prev', 'switching');
    nextSection.classList.remove('next', 'switching');
    nextSection.style.transform = '';
  }
}

function clearTransitions() {
  sections.forEach(s => {
    s.classList.remove('switching');
    s.style.transform = '';
  });
}

export function initSwipe() {
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    isDragging = true;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const currentX = e.changedTouches[0].screenX;
    const diff = currentX - touchStartX;

    // スクロールを抑制せず、水平方向の動きのみに反応
    if (Math.abs(diff) > 10) {
      updateSectionsTransform(diff);
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;

    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    const threshold = window.innerWidth / 4;

    clearTransitions();

    if (diff < -threshold) {
      // 次へ
      const nextIndex = (currentSectionIndex + 1) % sectionIds.length;
      navigateToSection(sectionIds[nextIndex]);
    } else if (diff > threshold) {
      // 前へ
      const prevIndex = (currentSectionIndex - 1 + sectionIds.length) % sectionIds.length;
      navigateToSection(sectionIds[prevIndex]);
    }
  }, { passive: true });
}