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
const apiKeyMessage = document.getElementById('apiKeyMessage');

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 단어 아이템 컴포넌트 생성 함수
function createWordItem(word, index) {
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
                <button class="btn btn-sm btn-danger delete-word-btn" data-word="${word.term}">삭제</button>
            </div>
        </div>
    `;

    return accordionItem;
}

// 최근 저장한 단어 목록을 가져와 아코디언으로 표시하는 함수
async function displayRecentWords() {
    try {
        const response = await sendMessageToBackground({ action: 'getRecentWords' });

        if (!response || !response.success) {
            throw new Error(response ? response.error : '응답이 없습니다.');
        }

        const recentWords = response.words;
        recentWordsAccordion.innerHTML = '';

        if (recentWords.length === 0) {
            const emptyStateMessage = document.createElement('div');
            emptyStateMessage.className = 'alert alert-info text-center';
            emptyStateMessage.textContent = '저장된 단어가 없습니다.';
            recentWordsAccordion.appendChild(emptyStateMessage);
        } else {
            const displayCount = Math.min(recentWords.length, 3);
            for (let i = 0; i < displayCount; i++) {
                const wordItem = createWordItem(recentWords[i], i);
                recentWordsAccordion.appendChild(wordItem);
            }
        }

        await updateWordCount();
    } catch (error) {
        console.error('단어 목록 표시 중 오류 발생:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger text-center';
        errorMessage.textContent = `오류: ${error.message}`;
        recentWordsAccordion.innerHTML = '';
        recentWordsAccordion.appendChild(errorMessage);
    }
}

// 단어 수 업데이트 함수
async function updateWordCount() {
    try {
        const response = await sendMessageToBackground({ action: 'getWordCount' });

        if (response && response.success) {
            wordCountSpan.textContent = response.count;
            console.log('업데이트된 단어 수:', response.count);
        } else {
            throw new Error(response ? response.error : '단어 수를 가져오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('단어 수 업데이트 중 오류 발생:', error);
        wordCountSpan.textContent = '오류';
    }
}

// 프리미엄 남은 기간을 가져오는 함수
async function getPremiumDays() {
    try {
        const response = await sendMessageToBackground({ action: 'getPremiumDays' });

        if (response && response.success) {
            return response.days;
        } else {
            throw new Error(response ? response.error : '프리미엄 기간을 가져오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('프리미엄 기간 가져오기 중 오류 발생:', error);
        return 0;
    }
}

// API 키 상태 확인 함수
async function checkApiKeyStatus() {
    try {
        const response = await sendMessageToBackground({ action: 'checkApiKey' });
        if (response.success) {
            enableWordInput();
        } else {
            disableWordInput(response.error || 'API 키를 먼저 등록해 주세요.');
        }
    } catch (error) {
        console.error('API 키 상태 확인 중 오류 발생:', error);
        disableWordInput('API 키 상태를 확인할 수 없습니다.');
    }
}

// 단어 입력 활성화 함수
function enableWordInput() {
    wordInput.disabled = false;
    addWordBtn.disabled = false;
    apiKeyMessage.style.display = 'none';
}

// 단어 입력 비활성화 함수
function disableWordInput(message) {
    wordInput.disabled = true;
    addWordBtn.disabled = true;
    apiKeyMessage.textContent = message;
    apiKeyMessage.style.display = 'block';
}

// 단어 저장 처리 함수
async function handleSaveWord(word) {
    try {
        // 기본 컨텍스트 제공
        const context = `The word "${word}" is being added directly from the popup.`;

        const definitionResponse = await sendMessageToBackground({
            action: 'getDefinition',
            word: word,
            context: context
        });

        if (!definitionResponse.success) {
            throw new Error(definitionResponse.error || '단어 정의를 가져오는데 실패했습니다.');
        }

        const saveResponse = await sendMessageToBackground({
            action: 'saveWord',
            word: word,
            definition: definitionResponse.definition,
            example: definitionResponse.example
        });

        if (!saveResponse.success) {
            throw new Error(saveResponse.error || '단어 저장에 실패했습니다.');
        }

        await displayRecentWords();
        wordInput.value = ''; // 입력 필드 초기화
        showNotification('단어가 성공적으로 추가되었습니다!');
    } catch (error) {
        console.error('단어 저장 중 오류 발생:', error);
        showNotification(error.message || '단어 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 단어 삭제 처리 함수
async function handleDeleteWord(word) {
    try {
        const response = await sendMessageToBackground({ action: 'deleteWord', word: word });

        if (!response.success) {
            throw new Error(response.error || '단어 삭제에 실패했습니다.');
        }

        await displayRecentWords();
        showNotification('단어가 성공적으로 삭제되었습니다!');
    } catch (error) {
        console.error('단어 삭제 중 오류 발생:', error);
        showNotification(error.message || '단어 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
    const container = document.querySelector('.container-fluid');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} mt-3`;
    notification.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        z-index: 1050;
        padding: 10px;
        font-size: 14px;
        text-align: center;
    `;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 배경 스크립트로 메시지를 보내는 함수
function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

// 옵션 페이지로 이동하는 함수
function openOptionsPage(section) {
    chrome.tabs.create({ url: `options/options.html?section=${section}` });
}

// 이벤트 리스너 등록
userProfileBtn.addEventListener('click', () => {
    openOptionsPage('profile');
});

settingsBtn.addEventListener('click', () => {
    openOptionsPage('settings');
});

wordListBtn.addEventListener('click', () => {
    openOptionsPage('wordList');
});

addWordBtn.addEventListener('click', () => {
    const word = wordInput.value.trim();
    if (word) {
        handleSaveWord(word);
    } else {
        showNotification('단어를 입력해주세요.', 'warning');
    }
});

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addWordBtn.click();
    }
});

learnBtn.addEventListener('click', () => {
    // TODO: 학습 기능 구현
    showNotification('학습 기능은 아직 구현되지 않았습니다.', 'info');
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await displayRecentWords();
    const premiumDays = await getPremiumDays();
    premiumDaysSpan.textContent = premiumDays;
    await checkApiKeyStatus(); // API 키 상태 확인 추가
});

// 단어 삭제 버튼 이벤트 리스너
recentWordsAccordion.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-word-btn')) {
        const word = event.target.dataset.word;
        handleDeleteWord(word);
    }
});