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

// Gemini API 호출 함수 (실제 구현은 별도로 해야 함)
async function callGeminiAPI(word) {
    // 이 부분은 실제 Gemini API를 호출하는 코드로 대체해야 합니다.
    // 여기서는 예시로 더미 데이터를 반환합니다.
    return {
        definition: `${word}의 의미입니다.`,
        example: `${word}를 사용한 예문입니다.`
    };
}

// 단어 저장 함수
async function saveWord(word) {
    try {
        const { definition, example } = await callGeminiAPI(word);
        const newWord = {
            term: word,
            definition,
            example,
            addedDate: new Date().toISOString() // 추가된 날짜 저장
        };

        chrome.storage.sync.get(['recentWords', 'wordCount'], function (result) {
            let recentWords = result.recentWords || [];
            let wordCount = result.wordCount || 0;

            // 중복 검사
            const isDuplicate = recentWords.some(item => item.term === word);
            if (!isDuplicate) {
                recentWords.unshift(newWord);
                if (recentWords.length > 5) recentWords.pop();
                wordCount++;

                chrome.storage.sync.set({ recentWords, wordCount }, function () {
                    displayRecentWords();
                    displayWordCount();
                    wordInput.value = ''; // 입력 필드 초기화
                    alert('단어가 성공적으로 추가되었습니다!');
                });
            } else {
                alert('이미 저장된 단어입니다.');
            }
        });
    } catch (error) {
        console.error('단어 저장 중 오류 발생:', error);
        alert('단어 저장 중 오류가 발생했습니다.');
    }
}

// 날짜를 포맷하는 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 최근 저장한 단어 목록을 가져와 아코디언으로 표시하는 함수
function displayRecentWords() {
    chrome.storage.sync.get(['recentWords'], function (result) {
        const recentWords = result.recentWords || [];
        recentWordsAccordion.innerHTML = '';

        if (recentWords.length === 0) {
            // 저장된 단어가 없을 경우 메시지 표시
            const emptyStateMessage = document.createElement('div');
            emptyStateMessage.className = 'alert alert-info text-center';
            emptyStateMessage.textContent = '저장된 단어가 없습니다.';
            recentWordsAccordion.appendChild(emptyStateMessage);
        } else {
            recentWords.forEach((word, index) => {
                const accordionItem = document.createElement('div');
                accordionItem.className = 'accordion-item';

                accordionItem.innerHTML = `
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#collapse${index}" aria-expanded="false" 
                                aria-controls="collapse${index}">
                            ${word.term} 
                            <small class="text-muted ms-2">(${formatDate(word.addedDate)})</small>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#recentWordsAccordion">
                        <div class="accordion-body">
                            <p><strong>의미:</strong> ${word.definition}</p>
                            <p><strong>예문:</strong> ${word.example}</p>
                        </div>
                    </div>
                `;

                recentWordsAccordion.appendChild(accordionItem);
            });
        }
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
    const word = wordInput.value.trim();
    if (word) {
        saveWord(word);
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
    // 학습 기능 구현
    // 예: 학습 페이지로 이동
    alert('학습 기능은 아직 구현되지 않았습니다.');
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    displayRecentWords();
    displayWordCount();
    displayPremiumDays();
});