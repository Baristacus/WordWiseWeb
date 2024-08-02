// DOM 요소 선택
const userProfileBtn = document.getElementById('userProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const wordListBtn = document.getElementById('wordListBtn');
const wordInput = document.querySelector('input[type="text"]');
const addWordBtn = document.getElementById('addWordBtn');
const recentWordsAccordion = document.getElementById('recentWordsAccordion');
const learnBtn = document.getElementById('learnBtn');
const wordCountSpan = document.getElementById('wordCount');
const premiumDaysSpan = document.getElementById('premiumDays');

// 최근 저장한 단어 목록을 가져와 아코디언으로 표시하는 함수
async function displayRecentWords() {
    const recentWords = await getRecentWords();
    recentWordsAccordion.innerHTML = '';

    if (recentWords.length === 0) {
        // 저장된 단어가 없을 경우 메시지 표시
        const emptyStateMessage = document.createElement('div');
        emptyStateMessage.className = 'alert alert-info text-center';
        emptyStateMessage.textContent = '저장된 단어가 없습니다.';
        recentWordsAccordion.appendChild(emptyStateMessage);
    } else {
        recentWords.slice(0, 3).forEach((word, index) => {
            const wordItem = createWordItem(word, index);
            recentWordsAccordion.appendChild(wordItem);
        });
    }
}

// 저장된 단어 수를 가져와 표시하는 함수
async function displayWordCount() {
    const count = await getWordCount();
    wordCountSpan.textContent = count;
}

// 프리미엄 남은 기간을 가져와 표시하는 함수
async function displayPremiumDays() {
    const days = await getPremiumDays();
    premiumDaysSpan.textContent = days;
}

// 단어 저장 처리 함수
async function handleSaveWord(word) {
    try {
        const { definition, example } = await callGeminiAPI(word);
        await saveWord(word, definition, example);
        await displayRecentWords();
        await displayWordCount();
        wordInput.value = ''; // 입력 필드 초기화
        alert('단어가 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error('단어 저장 중 오류 발생:', error);
        alert(error.message || '단어 저장 중 오류가 발생했습니다.');
    }
}

// 이벤트 리스너 등록
userProfileBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'options/options.html#profile' });
});

settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'options/options.html#settings' });
});

wordListBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'options/options.html#wordList' });
});

addWordBtn.addEventListener('click', () => {
    const word = wordInput.value.trim();
    if (word) {
        handleSaveWord(word);
    } else {
        alert('단어를 입력해주세요.');
    }
});

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addWordBtn.click();
    }
});

learnBtn.addEventListener('click', () => {
    // TODO: 학습 기능 구현
    alert('학습 기능은 아직 구현되지 않았습니다.');
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await displayRecentWords();
    await displayWordCount();
    await displayPremiumDays();
});