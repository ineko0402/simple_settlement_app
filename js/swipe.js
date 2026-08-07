import {
  navigateToSection,
  sectionIds,
  currentSectionIndex,
  getCurrentSectionId
} from './navigation.js';

let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;
const sections = document.querySelectorAll('.section');

function updateSectionsTransform(diff) {
  const currentSection = sections[currentSectionIndex];
  const nextSection = sections[(currentSectionIndex + 1) % sectionIds.length];
  const prevSection = sections[(currentSectionIndex - 1 + sectionIds.length) % sectionIds.length];

  currentSection.style.transform = `translateX(${diff}px)`;
  currentSection.classList.add('switching');

  if (diff < 0) {
    nextSection.style.transform = `translateX(${window.innerWidth + diff}px)`;
    nextSection.classList.add('next', 'switching');
    prevSection.classList.remove('prev', 'switching');
    prevSection.style.transform = '';
  } else if (diff > 0) {
    prevSection.style.transform = `translateX(${-window.innerWidth + diff}px)`;
    prevSection.classList.add('prev', 'switching');
    nextSection.classList.remove('next', 'switching');
    nextSection.style.transform = '';
  }
}

function clearTransitions() {
  sections.forEach(section => {
    section.classList.remove('switching');
    section.style.transform = '';
  });
}

function canStartSwipe(target) {
  if (getCurrentSectionId() === 'ledger') return false;
  return !target.closest('input, select, textarea, button');
}

export function initSwipe() {
  document.addEventListener('touchstart', event => {
    isDragging = canStartSwipe(event.target);
    if (!isDragging) return;

    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchmove', event => {
    if (!isDragging) return;

    const diffX = event.changedTouches[0].screenX - touchStartX;
    const diffY = event.changedTouches[0].screenY - touchStartY;
    const horizontalMove = Math.abs(diffX) > Math.abs(diffY) * 1.3;

    if (horizontalMove && Math.abs(diffX) > 10) {
      updateSectionsTransform(diffX);
    }
  }, { passive: true });

  document.addEventListener('touchend', event => {
    if (!isDragging) return;
    isDragging = false;

    const diffX = event.changedTouches[0].screenX - touchStartX;
    const diffY = event.changedTouches[0].screenY - touchStartY;
    const threshold = window.innerWidth / 4;
    const horizontalMove = Math.abs(diffX) > Math.abs(diffY) * 1.3;

    clearTransitions();
    if (!horizontalMove) return;

    if (diffX < -threshold) {
      const nextIndex = (currentSectionIndex + 1) % sectionIds.length;
      navigateToSection(sectionIds[nextIndex]);
    } else if (diffX > threshold) {
      const prevIndex = (currentSectionIndex - 1 + sectionIds.length) % sectionIds.length;
      navigateToSection(sectionIds[prevIndex]);
    }
  }, { passive: true });
}
