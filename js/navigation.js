/root/.profile: line 9: /dev/null: Permission denied
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const resetFab = document.getElementById('resetFab');

export let currentSectionIndex = 0;
export const sectionIds = ['settlement', 'nyukin', 'import', 'ledger'];

function updateFab(targetId) {
  const ledgerActive = targetId === 'ledger';
  resetFab.classList.toggle('hidden', ledgerActive);
  resetFab.classList.toggle('visible', !ledgerActive);
}

export function navigateToSection(targetId) {
  const targetIndex = sectionIds.indexOf(targetId);
  const currentIndex = currentSectionIndex;

  if (targetIndex < 0 || targetIndex === currentIndex) return;

  const currentSection = sections[currentIndex];
  const targetSection = sections[targetIndex];

  sections.forEach(section => section.classList.remove('prev', 'next', 'switching'));
  targetSection.classList.add(targetIndex > currentIndex ? 'next' : 'prev');
  targetSection.offsetHeight;

  currentSection.classList.remove('active');
  currentSection.classList.add(targetIndex > currentIndex ? 'prev' : 'next');
  targetSection.classList.add('active');

  navItems.forEach(item => item.classList.remove('active'));
  navItems[targetIndex].classList.add('active');

  currentSectionIndex = targetIndex;
  updateFab(targetId);
}

export function initNavigation() {
  sections[0]?.classList.add('active');
  updateFab(sectionIds[0]);

  navItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      navigateToSection(item.getAttribute('data-section'));
    });
  });
}

export function getCurrentSectionId() {
  return sectionIds[currentSectionIndex];
}
