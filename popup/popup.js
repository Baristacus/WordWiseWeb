// DOM 요소 선택
const userProfileBtn = document.getElementById('userProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const wordListBtn = document.getElementById('wordListBtn');
const recentWordsList = document.getElementById('recentWordsList');
const addWordBtn = document.getElementById('addWordBtn');
const reviewBtn = document.getElementById('reviewBtn');
const wordCountSpan = document.getElementById('wordCount');
const premiumDaysSpan = document.getElementById('premiumDays');

// 최근 저장한 단어 목록을 가져와 표시하는 함수
function displayRecentWords() {
    chrome.storage.sync.get(['recentWords'], function (result) {
        const recentWords = result.recentWords || [];
        recentWordsList.innerHTML = '';
        recentWords.slice(0, 5).forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            recentWordsList.appendChild(li);
        });
    });
}

// 저장된 단어 수를 가져와 표시하는 함수
function displayWordCount() {
    chrome.storage.sync.get(['wordCount'], function (result) {
        const count = result.wordCount || 0;
        wordCountSpan.textContent = count;
    });
}

// 프리미엄 남은 기간을 가져와 표시하는 함수
function displayPremiumDays() {
    chrome.storage.sync.get(['premiumDays'], function (result) {
        const days = result.premiumDays || 0;
        premiumDaysSpan.textContent = days;
    });
}

// 이벤트 리스너 등록
userProfileBtn.addEventListener('click', () => {
    // 사용자 프로필 페이지로 이동
    chrome.tabs.create({ url: 'options/options.html#profile' });
});

settingsBtn.addEventListener('click', () => {
    // 설정 페이지로 이동
    chrome.tabs.create({ url: 'options/options.html#settings' });
});

wordListBtn.addEventListener('click', () => {
    // 단어 목록 페이지로 이동
    chrome.tabs.create({ url: 'options/options.html#wordList' });
});

addWordBtn.addEventListener('click', () => {
    // 단어 추가 기능 구현
    // 예: 팝업 또는 새 탭에서 단어 추가 폼 열기
    alert('단어 추가 기능은 아직 구현되지 않았습니다.');
});

reviewBtn.addEventListener('click', () => {
    // 복습 기능 구현
    // 예: 복습 페이지로 이동
    alert('복습 기능은 아직 구현되지 않았습니다.');
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    displayRecentWords();
    displayWordCount();
    displayPremiumDays();
});