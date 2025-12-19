// ナビゲーション
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
export let currentSectionIndex = 0;
export const sectionIds = ['settlement', 'nyukin', 'import'];

export function navigateToSection(targetId) {
  const targetIndex = sectionIds.indexOf(targetId);
  const currentIndex = currentSectionIndex;
  
  if (targetIndex === currentIndex) return; // 同じセクションなら何もしない
  
  console.log(`Navigating from ${currentIndex} to ${targetIndex}`);
  
  // 現在のセクションを非表示
  sections[currentIndex].classList.remove('active');
  
  // アニメーション方向を決定
  if (targetIndex > currentIndex) {
    sections[currentIndex].classList.add('slide-out-left');
  } else {
    sections[currentIndex].classList.add('slide-out-left');
  }
  
  // ターゲットセクションを表示
  setTimeout(() => {
    sections.forEach(section => {
      section.classList.remove('active', 'slide-out-left', 'slide-in-right');
    });
    
    sections[targetIndex].classList.add('active');
    
    // ナビゲーションボタンの状態更新
    navItems.forEach(item => item.classList.remove('active'));
    navItems[targetIndex].classList.add('active');
    
    currentSectionIndex = targetIndex;
  }, 50);
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