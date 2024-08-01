// DOM 요소 선택

// 설정 저장 함수

// 저장된 설정 불러오기 함수

// 이벤트 리스너 등록

// 네비게이션 기능
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('href').substring(1);
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = section.id === targetId ? 'block' : 'none';
        });
    });
});

// 초기 페이지 로드 시 첫 번째 섹션만 표시
document.querySelector('main section').style.display = 'block';
document.querySelectorAll('main section').forEach((section, index) => {
    if (index > 0) section.style.display = 'none';
});