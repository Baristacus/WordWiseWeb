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
    console.log('displayRecentWords 함수 시작');
    const recentWords = await getRecentWords();
    const wordCount = await getWordCount();
    console.log('가져온 단어 목록:', recentWords);
    console.log('총 단어 수:', wordCount);
    console.log('recentWords의 실제 길이:', recentWords.length);

    recentWordsAccordion.innerHTML = '';

    if (recentWords.length === 0) {
        console.log('저장된 단어가 없음');
        // 저장된 단어가 없을 경우 메시지 표시
        const emptyStateMessage = document.createElement('div');
        emptyStateMessage.className = 'alert alert-info text-center';
        emptyStateMessage.textContent = '저장된 단어가 없습니다.';
        recentWordsAccordion.appendChild(emptyStateMessage);
    } else {
        console.log('단어 표시 시작');
        // 최대 3개까지 표시
        const displayCount = Math.min(recentWords.length, 3);
        console.log('표시할 단어 수:', displayCount);
        for (let i = 0; i < displayCount; i++) {
            console.log(`단어 아이템 생성 (${i + 1}/${displayCount}):`, recentWords[i].term);
            const wordItem = createWordItem(recentWords[i], i);
            recentWordsAccordion.appendChild(wordItem);
        }
    }

    // 단어 수 업데이트
    wordCountSpan.textContent = wordCount;
    console.log('displayRecentWords 함수 종료');
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
    console.log('handleSaveWord 함수 시작:', word);
    try {
        const { definition, example } = await callGeminiAPI(word);
        console.log('API 호출 결과:', { definition, example });
        await saveWord(word, definition, example);
        await displayRecentWords();
        wordInput.value = ''; // 입력 필드 초기화
        alert('단어가 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error('단어 저장 중 오류 발생:', error);
        alert(error.message || '단어 저장 중 오류가 발생했습니다.');
    }
    console.log('handleSaveWord 함수 종료');
}

// 단어 삭제 처리 함수
async function handleDeleteWord(word) {
    console.log('handleDeleteWord 함수 시작:', word);
    try {
        await deleteWord(word);
        await displayRecentWords();
        alert('단어가 성공적으로 삭제되었습니다!');
    } catch (error) {
        console.error('단어 삭제 중 오류 발생:', error);
        alert(error.message || '단어 삭제 중 오류가 발생했습니다.');
    }
    console.log('handleDeleteWord 함수 종료');
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
    console.log('DOMContentLoaded 이벤트 발생');
    await displayRecentWords();
    await displayPremiumDays();
    console.log('초기화 완료');
});

// 단어 삭제 버튼 이벤트 리스너
recentWordsAccordion.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-word-btn')) {
        const word = event.target.dataset.word;
        console.log('삭제 버튼 클릭:', word);
        handleDeleteWord(word);
    }
});