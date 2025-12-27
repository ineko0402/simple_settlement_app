// ナビゲーション
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
export let currentSectionIndex = 0;
export const sectionIds = ['settlement', 'nyukin', 'import'];

export function navigateToSection(targetId) {
  const targetIndex = sectionIds.indexOf(targetId);
  const currentIndex = currentSectionIndex;

  if (targetIndex === currentIndex) return;

  const currentSection = sections[currentIndex];
  const targetSection = sections[targetIndex];

  // クラスのクリア
  sections.forEach(s => s.classList.remove('prev', 'next', 'switching'));

  // 方向の決定
  if (targetIndex > currentIndex) {
    targetSection.classList.add('next');
  } else {
    targetSection.classList.add('prev');
  }

  // 強制リフロー（トランジションを確実に発生させるため）
  targetSection.offsetHeight;

  // アクティブ切り替え
  currentSection.classList.remove('active');
  if (targetIndex > currentIndex) {
    currentSection.classList.add('prev');
  } else {
    currentSection.classList.add('next');
  }

  targetSection.classList.add('active');

  // ナビゲーションボタンの状態更新
  navItems.forEach(item => item.classList.remove('active'));
  navItems[targetIndex].classList.add('active');

  currentSectionIndex = targetIndex;
}

export function initNavigation() {
  console.log('Initializing navigation...');
  console.log('Found nav items:', navItems.length);
  console.log('Found sections:', sections.length);

  // 初期状態の設定
  sections.forEach((section, index) => {
    if (index === 0) {
      section.classList.add('active');
    }
  });

  navItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = item.getAttribute('data-section');
      console.log('Navigation clicked:', sectionId);
      navigateToSection(sectionId);
    });
  });
}

export function getCurrentSectionId() {
  return sectionIds[currentSectionIndex];
}