// ナビゲーション
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
let currentSectionIndex = 0;
const sectionIds = ['settlement', 'nyukin', 'import'];

export function navigateToSection(targetId) {
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

export function initNavigation() {
  navItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      navigateToSection(sectionId);
    });
  });
}

export function getCurrentSectionId() {
  return sectionIds[currentSectionIndex];
}

export { sectionIds };