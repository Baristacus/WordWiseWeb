// 상수
const MAX_DISPLAY_WORDS = 3;
const NOTIFICATION_DURATION = 3000;

// DOM 요소 선택
const DOM = {
    userProfileBtn: document.getElementById('userProfileBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    wordListBtn: document.getElementById('wordListBtn'),
    wordInput: document.querySelector('input[type="text"]'),
    addWordBtn: document.getElementById('addWordBtn'),
    recentWordsAccordion: document.getElementById('recentWordsAccordion'),
    learnBtn: document.getElementById('learnBtn'),
    wordCountSpan: document.getElementById('wordCount'),
    premiumDaysSpan: document.getElementById('premiumDays'),
    apiKeyMessage: document.getElementById('apiKeyMessage')
};

// 유틸리티 함수
const utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, response => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    },

    showNotification(message, type = 'info') {
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
        setTimeout(() => notification.remove(), NOTIFICATION_DURATION);
    }
};

// 단어 관련 함수
const wordFunctions = {
    createWordItem(word, index) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        const countClass = word.count >= 3 ? "text-danger fw-bold" :
            word.count == 2 ? "text-warning fw-medium" : "";

        if (word.example) {
            example = `<p><strong>예문:</strong> ${word.example}</p>`;
        } else {
            example = '';
        }

        if (word.usermemo) {
            memo = `<hr class="my-2"><p><strong>메모:</strong> ${word.usermemo}</p>`;
        } else {
            memo = '';
        }

        accordionItem.innerHTML = `
            <h2 class="accordion-header" id="heading${index}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#collapse${index}" aria-expanded="false" 
                        aria-controls="collapse${index}">
                    <span class="${countClass}">${word.term}</span>
                    <small class="text-muted ms-2">(${utils.formatDate(word.addedDate)})</small>
                </button>
            </h2>
            <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#recentWordsAccordion">
                <div class="accordion-body">
                    <p><strong>의미:</strong> ${word.definition}</p>`
                    + example
                    + memo +
                    `<button class="btn btn-sm btn-danger delete-word-btn" data-word="${word.term}"><i class="bi bi-journal-x"></i> 삭제</button>
                </div>
            </div>
        `;

        return accordionItem;
    },

    async displayRecentWords() {
        try {
            const response = await utils.sendMessageToBackground({ action: 'getRecentWords' });
            if (!response.success) throw new Error(response.error || '단어 목록을 가져오는데 실패했습니다.');

            const recentWords = response.words;
            DOM.recentWordsAccordion.innerHTML = '';

            if (recentWords.length === 0) {
                const emptyStateMessage = document.createElement('div');
                emptyStateMessage.className = 'alert alert-info text-center';
                emptyStateMessage.textContent = '저장된 단어가 없습니다.';
                DOM.recentWordsAccordion.appendChild(emptyStateMessage);
            } else {
                const displayCount = Math.min(recentWords.length, MAX_DISPLAY_WORDS);
                for (let i = 0; i < displayCount; i++) {
                    const wordItem = this.createWordItem(recentWords[i], i);
                    DOM.recentWordsAccordion.appendChild(wordItem);
                }
            }

            await this.updateWordCount();
        } catch (error) {
            console.error('단어 목록 표시 중 오류 발생:', error);
            DOM.recentWordsAccordion.innerHTML = `
                <div class="alert alert-danger text-center">오류: ${error.message}</div>
            `;
        }
    },

    async updateWordCount() {
        try {
            const response = await utils.sendMessageToBackground({ action: 'getWordCount' });
            if (!response.success) throw new Error(response.error || '단어 수를 가져오는데 실패했습니다.');
            DOM.wordCountSpan.textContent = response.count;
        } catch (error) {
            console.error('단어 수 업데이트 중 오류 발생:', error);
            DOM.wordCountSpan.textContent = '오류';
        }
    },

    async handleSaveWord(word) {
        try {
            const context = `The word "${word}" is being added directly from the popup.`;
            const definitionResponse = await utils.sendMessageToBackground({
                action: 'getDefinition',
                word: word,
                context: context
            });
            if (!definitionResponse.success) throw new Error(definitionResponse.error || '단어 정의를 가져오는데 실패했습니다.');

            const saveResponse = await utils.sendMessageToBackground({
                action: 'saveWord',
                word: word,
                definition: definitionResponse.definition,
                example: definitionResponse.example
            });
            if (!saveResponse.success) throw new Error(saveResponse.error || '단어 저장에 실패했습니다.');

            await this.displayRecentWords();
            DOM.wordInput.value = '';
            utils.showNotification('단어가 성공적으로 추가되었습니다!');
        } catch (error) {
            console.error('단어 저장 중 오류 발생:', error);
            utils.showNotification(error.message || '단어 저장 중 오류가 발생했습니다.', 'error');
        }
    },

    async handleDeleteWord(word) {
        try {
            const response = await utils.sendMessageToBackground({ action: 'deleteWord', word: word });
            if (!response.success) throw new Error(response.error || '단어 삭제에 실패했습니다.');

            await this.displayRecentWords();
            utils.showNotification('단어가 성공적으로 삭제되었습니다!');
        } catch (error) {
            console.error('단어 삭제 중 오류 발생:', error);
            utils.showNotification(error.message || '단어 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
};

// API 키 관련 함수
const apiKeyFunctions = {
    async checkApiKeyStatus() {
        try {
            const response = await utils.sendMessageToBackground({ action: 'checkApiKey' });
            if (response.success) {
                this.enableWordInput();
            } else {
                this.disableWordInput(response.error || 'API 키를 먼저 등록해 주세요.');
            }
        } catch (error) {
            console.error('API 키 상태 확인 중 오류 발생:', error);
            this.disableWordInput('API 키 상태를 확인할 수 없습니다.');
        }
    },

    enableWordInput() {
        DOM.wordInput.disabled = false;
        DOM.addWordBtn.disabled = false;
        DOM.apiKeyMessage.style.display = 'none';
    },

    disableWordInput(message) {
        DOM.wordInput.disabled = true;
        DOM.addWordBtn.disabled = true;
        DOM.apiKeyMessage.textContent = message;
        DOM.apiKeyMessage.style.display = 'block';
    }
};

// 프리미엄 관련 함수
async function getPremiumDays() {
    try {
        const response = await utils.sendMessageToBackground({ action: 'getPremiumDays' });
        if (!response.success) throw new Error(response.error || '프리미엄 기간을 가져오는데 실패했습니다.');
        return response.days;
    } catch (error) {
        console.error('프리미엄 기간 가져오기 중 오류 발생:', error);
        return 0;
    }
}

// 옵션 페이지 관련 함수
function openOptionsPage(section) {
    chrome.tabs.create({ url: `options/options.html?section=${section}` });
}

// 이벤트 리스너
DOM.userProfileBtn.addEventListener('click', () => openOptionsPage('profile'));
DOM.settingsBtn.addEventListener('click', () => openOptionsPage('settings'));
DOM.wordListBtn.addEventListener('click', () => openOptionsPage('wordList'));
DOM.learnBtn.addEventListener('click', () => openOptionsPage('learn'));

DOM.addWordBtn.addEventListener('click', () => {
    const word = DOM.wordInput.value.trim();
    if (word) {
        wordFunctions.handleSaveWord(word);
    } else {
        utils.showNotification('단어를 입력해주세요.', 'warning');
    }
});

DOM.wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.addWordBtn.click();
});

DOM.recentWordsAccordion.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-word-btn')) {
        const word = event.target.dataset.word;
        wordFunctions.handleDeleteWord(word);
    }
});

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await wordFunctions.displayRecentWords();
    const premiumDays = await getPremiumDays();
    DOM.premiumDaysSpan.textContent = premiumDays;
    await apiKeyFunctions.checkApiKeyStatus();
});