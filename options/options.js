// 상수
const ITEMS_PER_PAGE = 15;
const NOTIFICATION_DURATION = 3000;
const PAGINATION_RANGE = 2;

// DOM 요소
const DOM = {
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeySaveBtn: document.getElementById('apiKeySaveBtn'),
    floatingIconSwitch: document.getElementById('floatingIconSwitch'),
    saveExampleSwitch: document.getElementById('saveExampleSwitch'),
    highlightSwitch: document.getElementById('highlightSwitch'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    wordSearchInput: document.getElementById('wordSearchInput'),
    wordCardBody: document.getElementById('wordCardBody'),
    pagination: document.getElementById('pagination'),
    learnWordQuiz: document.getElementById('learnWordQuiz'),
    learnWordExplain: document.getElementById('learnWordExplain'),
    learnWordQuizBtn: document.getElementById('learnWordQuizBtn'),
    learnWordInputBox: document.getElementById('learnWordInputBox'),
    learnWordInput: document.getElementById('learnWordInput'),
    learnWordBtn: document.getElementById('learnWordBtn'),
    dbSize: document.getElementById('dbSize'),
    dbUsagePercentage: document.getElementById('dbUsagePercentage'),
    totalWordCount: document.getElementById('totalWordCount')
};

// 전역 변수
let currentPage = 1;
let words = [];
let filteredWords = [];
let wordForQuiz = {};
let isCorrected = false;

// 유틸리티 함수
const utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            console.error('Notification container not found');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.role = 'alert';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        }, NOTIFICATION_DURATION);
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

    getWeightedRandomItem(list, weightKey) {
        const totalWeight = list.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
        let randomWeight = Math.random() * totalWeight;

        for (let item of list) {
            randomWeight -= (item[weightKey] || 1);
            if (randomWeight <= 0) {
                return item;
            }
        }
        return list[0];
    },

    getSectionFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('section');
    }
};

// 단어 관리 함수
const wordManagement = {
    async fetchWordList() {
        try {
            const response = await utils.sendMessageToBackground({ action: 'getRecentWords' });
            if (!response || !response.success) {
                throw new Error(response ? response.error : '응답이 없습니다.');
            }
            words = response.words;
            filteredWords = [...words];
            this.displayWordList();
        } catch (error) {
            console.error('단어 목록 표시 중 오류 발생:', error);
            DOM.wordCardBody.innerHTML = `
        <div class="alert alert-dismissible alert-danger">
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            오류: ${error.message}
        </div>
        `;
        }
    },

    displayWordList() {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedWords = filteredWords.slice(startIndex, endIndex);

        // 총 단어 수 업데이트
        DOM.totalWordCount.textContent = filteredWords.length;

        DOM.wordCardBody.innerHTML = paginatedWords.length === 0
            ? '<div class="text-center">표시할 단어가 없습니다.</div>'
            : paginatedWords.map((word, index) => `
            <div class="col">
                <div class="card border-primary h-100">
                    <div class="card-header">
                        <div class="row">
                            <div class="col">
                                #<span>${startIndex + index + 1}</span> <span class="h5 fw-bold text-primary">${word.term}</span>
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-sm btn-link text-danger text-decoration-none p-0 delete-word-btn" data-word="${word.term}">삭제</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text">
                            <strong>의미: </strong>${word.definition}
                        </p>
                        ${word.example ? `
                            <p class="card-text">
                                <strong>예문: </strong>${word.example}
                            </p>
                        ` : ''}
                        <div class="memo-section" data-word="${word.term}">
                            ${this.renderMemoSection(word)}
                        </div>
                    </div>
                    <div class="card-footer text-muted small">
                        <div class="row">
                            <div class="col">
                                <span>${utils.formatDate(word.addedDate)}</span>
                            </div>
                            <div class="col-auto">
                                <span>${word.count}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.displayPagination();
    },

    renderMemoSection(word) {
        if (word.usermemo) {
            return `
                <hr />
                <p class="card-text memo-content">
                    <strong>메모: </strong><span class="memo-text">${word.usermemo}</span>
                </p>
                <div class="memo-actions">
                    <button class="btn btn-sm btn-outline-dark edit-memo-btn">수정</button>
                    <button class="btn btn-sm btn-outline-danger delete-memo-btn">삭제</button>
                </div>
            `;
        } else {
            return `
                <hr />
                <div class="memo-actions">
                    <button class="btn btn-sm btn-outline-primary add-memo-btn">메모 추가</button>
                </div>
            `;
        }
    },

    handleMemoAction(event) {
        const target = event.target;
        const memoSection = target.closest('.memo-section');
        if (!memoSection) {
            console.error('메모 섹션을 찾을 수 없습니다.');
            return;
        }
        const wordTerm = memoSection.dataset.word;
        if (!wordTerm) {
            console.error('단어 정보를 찾을 수 없습니다.');
            return;
        }

        if (target.classList.contains('add-memo-btn')) {
            this.handleAddMemo(memoSection, wordTerm);
        } else if (target.classList.contains('edit-memo-btn')) {
            this.handleEditMemo(memoSection, wordTerm);
        } else if (target.classList.contains('delete-memo-btn')) {
            this.handleDeleteMemo(memoSection, wordTerm);
        }
    },

    handleAddMemo(memoSection, wordTerm) {
        memoSection.innerHTML = this.renderMemoEditForm('');
        this.setupMemoFormListeners(memoSection, wordTerm);
    },

    handleEditMemo(memoSection, wordTerm) {
        const memoTextElement = memoSection.querySelector('.memo-text');
        if (!memoTextElement) {
            console.error('메모 텍스트를 찾을 수 없습니다.');
            return;
        }
        const currentMemo = memoTextElement.textContent;
        memoSection.innerHTML = this.renderMemoEditForm(currentMemo);
        this.setupMemoFormListeners(memoSection, wordTerm);
    },

    handleDeleteMemo(memoSection, wordTerm) {
        if (confirm('메모를 삭제하시겠습니까?')) {
            this.updateWordMemo(wordTerm, '')
                .then(() => {
                    utils.showNotification('메모가 삭제되었습니다.', 'primary');
                    this.refreshWordCard(wordTerm);
                })
                .catch(error => {
                    console.error('메모 삭제 중 오류:', error);
                    utils.showNotification('메모 삭제 중 오류가 발생했습니다.', 'danger');
                });
        }
    },

    renderMemoEditForm(currentMemo) {
        return `
            <hr />
            <div class="memo-edit-form">
                <textarea class="form-control mb-2" rows="3">${currentMemo}</textarea>
                <button class="btn btn-sm btn-primary save-memo-btn">저장</button>
                <button class="btn btn-sm btn-secondary cancel-memo-btn">취소</button>
            </div>
        `;
    },

    setupMemoFormListeners(memoSection, wordTerm) {
        const saveBtn = memoSection.querySelector('.save-memo-btn');
        const cancelBtn = memoSection.querySelector('.cancel-memo-btn');

        saveBtn.addEventListener('click', async () => {
            const newMemo = memoSection.querySelector('textarea').value.trim();
            try {
                await this.updateWordMemo(wordTerm, newMemo);
                utils.showNotification('메모가 저장되었습니다.', 'primary');
                this.refreshWordCard(wordTerm);
            } catch (error) {
                utils.showNotification('메모 저장 중 오류가 발생했습니다.', 'danger');
            }
        });

        cancelBtn.addEventListener('click', () => {
            this.refreshWordCard(wordTerm);
        });
    },

    async updateWordMemo(wordTerm, newMemo) {
        const response = await utils.sendMessageToBackground({
            action: 'updateWordMemo',
            word: wordTerm,
            memo: newMemo
        });

        if (!response.success) {
            throw new Error(response.error || '메모 업데이트에 실패했습니다.');
        }
    },

    refreshWordCard(wordTerm) {
        const wordIndex = words.findIndex(word => word.term === wordTerm);
        if (wordIndex !== -1) {
            utils.sendMessageToBackground({
                action: 'getWord',
                word: wordTerm
            }).then(response => {
                if (response.success) {
                    words[wordIndex] = response.word;
                    filteredWords = [...words];
                    this.displayWordList();
                } else {
                    console.error('단어 정보를 가져오는데 실패했습니다:', response.error);
                }
            }).catch(error => {
                console.error('단어 정보를 가져오는 중 오류 발생:', error);
            });
        }
    },

    displayPagination() {
        const pageCount = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
        DOM.pagination.innerHTML = '';

        if (currentPage > 1) {
            this.addPaginationButton('처음', 1);
            this.addPaginationButton('이전', currentPage - 1);
        }

        const startPage = Math.max(1, currentPage - PAGINATION_RANGE);
        const endPage = Math.min(pageCount, currentPage + PAGINATION_RANGE);

        if (startPage > 1) {
            this.addPaginationButton('1', 1);
            if (startPage > 2) {
                this.addPaginationButton('...', null, true);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            this.addPaginationButton(i.toString(), i, false, i === currentPage);
        }

        if (endPage < pageCount) {
            if (endPage < pageCount - 1) {
                this.addPaginationButton('...', null, true);
            }
            this.addPaginationButton(pageCount.toString(), pageCount);
        }

        if (currentPage < pageCount) {
            this.addPaginationButton('다음', currentPage + 1);
            this.addPaginationButton('마지막', pageCount);
        }
    },

    addPaginationButton(text, page, disabled = false, active = false) {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
        if (!disabled && page !== null) {
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = page;
                this.displayWordList();
            });
        }
        DOM.pagination.appendChild(li);
    },

    searchWords(query) {
        query = query.toLowerCase();
        filteredWords = words.filter(word =>
            word.term.toLowerCase().includes(query) ||
            word.definition.toLowerCase().includes(query) ||
            (word.usermemo && word.usermemo.toLowerCase().includes(query))
        );
        currentPage = 1;
        this.displayWordList();
    },

    async handleDeleteWord(word) {
        if (confirm('단어장에서 단어를 삭제하시겠습니까?')) {
            try {
                const response = await utils.sendMessageToBackground({ action: 'deleteWord', word: word });
                if (!response.success) {
                    throw new Error(response.error || '단어 삭제에 실패했습니다.');
                }
                await this.fetchWordList();
                utils.showNotification('단어가 성공적으로 삭제되었습니다!', 'primary');
            } catch (error) {
                console.error('단어 삭제 중 오류 발생:', error);
                utils.showNotification(error.message || '단어 삭제 중 오류가 발생했습니다.', 'danger');
            }
        }
    }
};

// 새 단어 추가 메시지 수신 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'wordAdded') {
        // 새 단어를 목록에 추가하고 화면을 갱신합니다
        words.unshift(message.word);
        filteredWords.unshift(message.word);
        wordManagement.displayWordList();
        utils.showNotification('새 단어가 추가되었습니다: ' + message.word.term, 'primary');
    }
});

// 학습 관련 함수
const learningManagement = {
    async setQuiz() {
        this.resetQuizUI();
        try {
            const response = await utils.sendMessageToBackground({ action: 'getRecentWords', limit: Infinity });
            if (!response || !response.success) {
                throw new Error(response ? response.error : '응답이 없습니다.');
            }
            const wordLists = response.words;
            if (wordLists.length === 0) {
                this.setEmptyQuizState();
            } else {
                this.setActiveQuizState(wordLists);
            }
        } catch (error) {
            console.error('단어 목록 받아오는 중 오류 발생:', error);
            this.setErrorQuizState();
        }
    },

    resetQuizUI() {
        DOM.learnWordInput.classList.remove("border-success", "border-danger");
        DOM.learnWordInputBox.classList.remove("border-success", "border-danger");
        DOM.learnWordQuizBtn.innerText = '다음 문제 풀기';
        DOM.learnWordInput.value = '';
        DOM.learnWordInput.disabled = false;
        DOM.learnWordBtn.innerText = '정답 제출';
        isCorrected = false;
    },

    setEmptyQuizState() {
        DOM.learnWordQuiz.textContent = '저장된 단어가 없습니다.';
        DOM.learnWordExplain.textContent = "단어를 추가한 후 다시 시도해주세요.";
        DOM.learnWordInput.disabled = true;
        DOM.learnWordBtn.disabled = true;
    },

    setActiveQuizState(wordLists) {
        wordForQuiz = utils.getWeightedRandomItem(wordLists, 'count');
        DOM.learnWordQuiz.textContent = wordForQuiz.definition;
        DOM.learnWordExplain.textContent = "이 의미를 갖는 단어를 적어주세요.";
        DOM.learnWordInput.disabled = false;
        DOM.learnWordBtn.disabled = false;
    },

    setErrorQuizState() {
        DOM.learnWordQuiz.textContent = '오류가 발생했습니다.';
        DOM.learnWordExplain.textContent = "잠시 후 다시 시도해주세요.";
        DOM.learnWordInput.disabled = true;
        DOM.learnWordBtn.disabled = true;
    },

    checkAnswer() {
        const userInput = DOM.learnWordInput.value.trim();
        if (userInput) {
            DOM.learnWordInput.classList.remove("border-success", "border-danger");
            DOM.learnWordInputBox.classList.remove("border-success", "border-danger");
            if (userInput.toLowerCase() === wordForQuiz.term.toLowerCase()) {
                this.setCorrectAnswerState();
            } else {
                this.setIncorrectAnswerState();
            }
        }
    },

    setCorrectAnswerState() {
        isCorrected = true;
        DOM.learnWordInput.classList.add("border-success");
        DOM.learnWordInputBox.classList.add("border-success");
        DOM.learnWordExplain.textContent = "정답입니다!";
        DOM.learnWordInput.disabled = true;
        DOM.learnWordBtn.innerText = '다음 문제';
    },

    setIncorrectAnswerState() {
        DOM.learnWordInput.classList.add("border-danger");
        DOM.learnWordInputBox.classList.add("border-danger");
        DOM.learnWordExplain.textContent = "오답입니다. 다시 시도해보세요.";
        DOM.learnWordBtn.innerText = '다시 풀기';
    }
};

// API 키 관리 함수
const apiKeyManagement = {
    saveApiKey(apiKey) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({ apiKey }, () => {
                if (chrome.runtime.lastError) {
                    console.error('API 키 저장 오류:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    displaySavedState(apiKey) {
        DOM.apiKeyInput.value = `${apiKey.slice(0, 5)}*****`;
        DOM.apiKeyInput.disabled = true;
        DOM.apiKeySaveBtn.textContent = '저장됨';
        DOM.apiKeySaveBtn.classList.remove('btn-primary');
        DOM.apiKeySaveBtn.classList.add('btn-dark');
    },

    displayUnsavedState() {
        DOM.apiKeyInput.value = '';
        DOM.apiKeyInput.disabled = false;
        DOM.apiKeySaveBtn.textContent = '저장';
        DOM.apiKeySaveBtn.classList.remove('btn-dark', 'btn-danger');
        DOM.apiKeySaveBtn.classList.add('btn-primary');
    },

    resetApiKey() {
        chrome.storage.sync.remove('apiKey', () => {
            this.displayUnsavedState();
            DOM.apiKeyInput.focus();
            this.setupSaveButtonListeners();
        });
    },

    setupResetButtonListeners() {
        DOM.apiKeySaveBtn.addEventListener("mouseover", this.onMouseOver);
        DOM.apiKeySaveBtn.addEventListener("mouseout", this.onMouseOut);
        DOM.apiKeySaveBtn.removeEventListener('click', this.saveApiKey);
        DOM.apiKeySaveBtn.addEventListener('click', () => this.resetApiKey());
    },

    setupSaveButtonListeners() {
        DOM.apiKeySaveBtn.removeEventListener("mouseover", this.onMouseOver);
        DOM.apiKeySaveBtn.removeEventListener("mouseout", this.onMouseOut);
        DOM.apiKeySaveBtn.removeEventListener('click', () => this.resetApiKey());
        DOM.apiKeySaveBtn.addEventListener('click', () => this.saveApiKey());
    },

    onMouseOver() {
        DOM.apiKeySaveBtn.textContent = '재설정';
        DOM.apiKeySaveBtn.classList.remove('btn-dark');
        DOM.apiKeySaveBtn.classList.add('btn-danger');
    },

    onMouseOut() {
        DOM.apiKeySaveBtn.textContent = '저장됨';
        DOM.apiKeySaveBtn.classList.remove('btn-danger');
        DOM.apiKeySaveBtn.classList.add('btn-dark');
    },

    async handleApiKeySave() {
        const apiKey = DOM.apiKeyInput.value.trim();
        if (apiKey.length > 0) {
            try {
                await this.saveApiKey(apiKey);
                utils.showNotification('API 키가 성공적으로 저장되었습니다.', 'primary');
                this.displaySavedState(apiKey);
                this.setupResetButtonListeners();
            } catch (error) {
                utils.showNotification('API 키 저장 중 오류가 발생했습니다: ' + error.message, 'danger');
            }
        } else {
            utils.showNotification('유효한 API 키를 입력해주세요.', 'warning');
        }
    },

    initializeApiKeyState() {
        chrome.storage.sync.get(['apiKey'], result => {
            if (result.apiKey) {
                this.displaySavedState(result.apiKey);
                this.setupResetButtonListeners();
            } else {
                this.displayUnsavedState();
                this.setupSaveButtonListeners();
            }
        });
    }
};

// 설정 관리 함수
const settingsManagement = {
    saveSettings() {
        const settings = {
            floatingIcon: DOM.floatingIconSwitch.checked,
            saveExample: DOM.saveExampleSwitch.checked,
            highlight: DOM.highlightSwitch.checked
        };
        chrome.storage.sync.set(settings, () => {
            utils.showNotification('설정이 저장되었습니다.', 'primary');
        });
    },

    loadSettings() {
        chrome.storage.sync.get(['floatingIcon', 'saveExample', 'highlight'], result => {
            DOM.floatingIconSwitch.checked = !!result.floatingIcon;
            DOM.saveExampleSwitch.checked = !!result.saveExample;
            DOM.highlightSwitch.checked = !!result.highlight;
        });
    }
};

// DB 정보 관리 함수
const databaseManagement = {
    async getDatabaseInfo() {
        try {
            const response = await utils.sendMessageToBackground({ action: 'getDatabaseSize' });
            if (response && response.success) {
                const sizeInMB = (response.size / (1024 * 1024)).toFixed(2);
                const usagePercentage = response.usagePercentage;
                DOM.dbSize.textContent = `${sizeInMB} MB`;
                DOM.dbUsagePercentage.textContent = `${usagePercentage}%`;
            } else {
                throw new Error(response ? response.error : 'DB 정보를 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('DB 정보 가져오기 중 오류 발생:', error);
            DOM.dbSize.textContent = '오류';
            DOM.dbUsagePercentage.textContent = '오류';
        }
    }
};

// 페이지 관리 함수
const pageManagement = {
    showSection(sectionId) {
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').substring(1) === sectionId);
        });
    },

    initializePage() {
        const section = utils.getSectionFromUrl() || 'wordList';
        this.showSection(section);
        settingsManagement.loadSettings();
        databaseManagement.getDatabaseInfo();
    },

    setupNavigationListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                this.showSection(targetId);
                history.pushState(null, '', `?section=${targetId}`);
            });
        });
    }
};

// 이벤트 리스너 설정
function setupEventListeners() {
    DOM.apiKeySaveBtn.addEventListener('click', () => apiKeyManagement.handleApiKeySave());
    DOM.saveSettingsBtn.addEventListener('click', () => settingsManagement.saveSettings());
    DOM.wordSearchInput.addEventListener('input', (e) => wordManagement.searchWords(e.target.value));
    DOM.wordCardBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-word-btn')) {
            const word = event.target.dataset.word;
            wordManagement.handleDeleteWord(word);
        }
    });
    DOM.learnWordQuizBtn.addEventListener('click', () => learningManagement.setQuiz());
    DOM.learnWordBtn.addEventListener('click', () => {
        if (!isCorrected) {
            learningManagement.checkAnswer();
        } else {
            learningManagement.setQuiz();
        }
    });
    DOM.learnWordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !isCorrected) {
            learningManagement.checkAnswer();
        }
    });
    DOM.wordCardBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-memo-btn') ||
            event.target.classList.contains('edit-memo-btn') ||
            event.target.classList.contains('delete-memo-btn')) {
            wordManagement.handleMemoAction(event);
        }
    });
}

// 초기화 함수
async function initialize() {
    apiKeyManagement.initializeApiKeyState();
    await wordManagement.fetchWordList();
    pageManagement.initializePage();
    setupEventListeners();
    pageManagement.setupNavigationListeners();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);