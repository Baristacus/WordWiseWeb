// DOM 요소 선택
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeySaveBtn = document.getElementById('apiKeySaveBtn');
const floatingIconSwitch = document.getElementById('floatingIconSwitch');
const saveExampleSwitch = document.getElementById('saveExampleSwitch');
const highlightSwitch = document.getElementById('highlightSwitch');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// 단어장 섹션에 필요한 요소 선택
const wordTableBody = document.getElementById('wordTableBody');
const pagination = document.getElementById('pagination');

let currentPage = 1;
const itemsPerPage = 15;
let words = [];

// 날짜 포맷팅 함수 추가
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 단어 목록을 페이지네이션에 맞게 표시하는 함수
function displayWordList() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedWords = words.slice(startIndex, endIndex);

    wordTableBody.innerHTML = '';

    if (paginatedWords.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4" class="text-center">저장된 단어가 없습니다.</td>';
        wordTableBody.appendChild(emptyRow);
    } else {
        paginatedWords.forEach(word => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th scope="row">${word.term}</th>
                <td>${word.definition}</td>
                <td>${formatDate(word.addedDate)}</td>
                <td><button class="btn btn-sm btn-danger delete-word-btn" data-word="${word.term}">삭제</button></td>
            `;
            wordTableBody.appendChild(row);
        });
    }

    displayPagination();
}

// 페이지네이션 버튼을 표시하는 함수
function displayPagination() {
    const pageCount = Math.ceil(words.length / itemsPerPage);
    const paginationRange = 2; // 현재 페이지를 중심으로 표시할 페이지 버튼의 범위
    pagination.innerHTML = '';

    // 처음 페이지 버튼
    if (currentPage > 1) {
        const firstPageItem = document.createElement('li');
        firstPageItem.className = 'page-item';
        firstPageItem.innerHTML = `<a class="page-link" href="#">처음</a>`;
        firstPageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = 1;
            displayWordList();
        });
        pagination.appendChild(firstPageItem);
    }

    // 이전 페이지 버튼
    if (currentPage > 1) {
        const prevPageItem = document.createElement('li');
        prevPageItem.className = 'page-item';
        prevPageItem.innerHTML = `<a class="page-link" href="#">이전</a>`;
        prevPageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage--;
            displayWordList();
        });
        pagination.appendChild(prevPageItem);
    }

    // 페이지 번호 버튼
    const startPage = Math.max(1, currentPage - paginationRange);
    const endPage = Math.min(pageCount, currentPage + paginationRange);

    if (startPage > 1) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item';
        pageItem.innerHTML = `<a class="page-link" href="#">1</a>`;
        pageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = 1;
            displayWordList();
        });
        pagination.appendChild(pageItem);

        if (startPage > 2) {
            const dotsItem = document.createElement('li');
            dotsItem.className = 'page-item disabled';
            dotsItem.innerHTML = `<a class="page-link" href="#">...</a>`;
            pagination.appendChild(dotsItem);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            displayWordList();
        });
        pagination.appendChild(pageItem);
    }

    if (endPage < pageCount) {
        if (endPage < pageCount - 1) {
            const dotsItem = document.createElement('li');
            dotsItem.className = 'page-item disabled';
            dotsItem.innerHTML = `<a class="page-link" href="#">...</a>`;
            pagination.appendChild(dotsItem);
        }

        const pageItem = document.createElement('li');
        pageItem.className = 'page-item';
        pageItem.innerHTML = `<a class="page-link" href="#">${pageCount}</a>`;
        pageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = pageCount;
            displayWordList();
        });
        pagination.appendChild(pageItem);
    }

    // 다음 페이지 버튼
    if (currentPage < pageCount) {
        const nextPageItem = document.createElement('li');
        nextPageItem.className = 'page-item';
        nextPageItem.innerHTML = `<a class="page-link" href="#">다음</a>`;
        nextPageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage++;
            displayWordList();
        });
        pagination.appendChild(nextPageItem);
    }

    // 마지막 페이지 버튼
    if (currentPage < pageCount) {
        const lastPageItem = document.createElement('li');
        lastPageItem.className = 'page-item';
        lastPageItem.innerHTML = `<a class="page-link" href="#">마지막</a>`;
        lastPageItem.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = pageCount;
            displayWordList();
        });
        pagination.appendChild(lastPageItem);
    }
}

// 단어 목록을 가져오는 함수
async function fetchWordList() {
    try {
        console.log('fetchWordList called');
        const response = await sendMessageToBackground({ action: 'getRecentWords', limit: Infinity }); // 전체 단어 목록을 가져오기 위해 limit을 무한대로 설정

        console.log('Response received:', response);
        if (!response || !response.success) {
            throw new Error(response ? response.error : '응답이 없습니다.');
        }

        words = response.words;
        displayWordList();
    } catch (error) {
        console.error('단어 목록 표시 중 오류 발생:', error);
        const errorRow = document.createElement('tr');
        errorRow.innerHTML = `<td colspan="4" class="text-center text-danger">오류: ${error.message}</td>`;
        wordTableBody.innerHTML = '';
        wordTableBody.appendChild(errorRow);
    }
}

// 단어 삭제 처리 함수
async function handleDeleteWord(word) {
    if (confirm('단어장에서 단어를 삭제하시겠습니까?')) {
        try {
            const response = await sendMessageToBackground({ action: 'deleteWord', word: word });

            if (!response.success) {
                throw new Error(response.error || '단어 삭제에 실패했습니다.');
            }

            await fetchWordList();
            showNotification('단어가 성공적으로 삭제되었습니다!');
        } catch (error) {
            console.error('단어 삭제 중 오류 발생:', error);
            showNotification(error.message || '단어 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 페이지 로드 시 단어 목록 표시
document.addEventListener('DOMContentLoaded', async () => {
    await fetchWordList();
});

// 단어 삭제 버튼 이벤트 리스너
wordTableBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-word-btn')) {
        const word = event.target.dataset.word;
        handleDeleteWord(word);
    }
});


// API 키 저장 함수
function saveApiKey(apiKey) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ apiKey }, () => {
            if (chrome.runtime.lastError) {
                console.error('API 키 저장 오류:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log('API 키가 성공적으로 저장됨');
                resolve();
            }
        });
    });
}

// API 키가 저장되어 있는지 확인하고 키 일부만 표시
chrome.storage.sync.get(['apiKey'], result => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeySaveBtn = document.getElementById('apiKeySaveBtn');

    if (result.apiKey) {
        // API 키가 저장되어 있는 경우
        displaySavedState(result.apiKey);

        // 마우스 오버/아웃 이벤트 리스너 추가
        apiKeySaveBtn.addEventListener("mouseover", () => {
            apiKeySaveBtn.textContent = '재설정';
            apiKeySaveBtn.classList.remove('btn-success');
            apiKeySaveBtn.classList.add('btn-danger');
        });

        apiKeySaveBtn.addEventListener("mouseout", () => {
            apiKeySaveBtn.textContent = '저장됨';
            apiKeySaveBtn.classList.remove('btn-danger');
            apiKeySaveBtn.classList.add('btn-success');
        });

        // 재설정 버튼 클릭 이벤트 리스너
        apiKeySaveBtn.addEventListener('click', resetApiKey);
    } else {
        // API 키가 저장되어 있지 않은 경우
        displayUnsavedState();

        // API 키 저장 버튼 클릭 이벤트 핸들러
        apiKeySaveBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey.length > 0) {
                try {
                    await saveApiKey(apiKey);
                    alert('API 키가 성공적으로 저장되었습니다.');
                    displaySavedState(apiKey);
                } catch (error) {
                    alert('API 키 저장 중 오류가 발생했습니다: ' + error.message);
                }
            } else {
                alert('유효한 API 키를 입력해주세요.');
            }
        });
    }
});

// API 키 저장 상태 표시 함수
function displaySavedState(apiKey) {
    apiKeyInput.value = `${apiKey.slice(0, 5)}*****`;
    apiKeyInput.disabled = true;
    apiKeySaveBtn.textContent = '저장됨';
    apiKeySaveBtn.classList.remove('btn-primary');
    apiKeySaveBtn.classList.add('btn-success');
}

// API 키 미저장 상태 표시 함수
function displayUnsavedState() {
    apiKeyInput.value = '';
    apiKeyInput.disabled = false;
    apiKeySaveBtn.textContent = '저장';
    apiKeySaveBtn.classList.remove('btn-success', 'btn-danger');
    apiKeySaveBtn.classList.add('btn-primary');
}

// API 키 저장 함수
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        chrome.storage.sync.set({ apiKey }, () => {
            displaySavedState(apiKey);
            setupResetButtonListeners();
        });
    }
}

// API 키 재설정 함수
function resetApiKey() {
    chrome.storage.sync.remove('apiKey', () => {
        displayUnsavedState();
        apiKeyInput.focus();

        // 이벤트 리스너 제거
        apiKeySaveBtn.removeEventListener("mouseover", onMouseOver);
        apiKeySaveBtn.removeEventListener("mouseout", onMouseOut);
        apiKeySaveBtn.removeEventListener('click', resetApiKey);

        // 저장 버튼 클릭 이벤트 리스너 추가
        apiKeySaveBtn.addEventListener('click', saveApiKey);
    });
}

// 마우스 오버 이벤트 핸들러
function onMouseOver() {
    apiKeySaveBtn.textContent = '재설정';
    apiKeySaveBtn.classList.remove('btn-success');
    apiKeySaveBtn.classList.add('btn-danger');
}

// 마우스 아웃 이벤트 핸들러
function onMouseOut() {
    apiKeySaveBtn.textContent = '저장됨';
    apiKeySaveBtn.classList.remove('btn-danger');
    apiKeySaveBtn.classList.add('btn-success');
}

// 재설정 버튼 이벤트 리스너 설정 함수
function setupResetButtonListeners() {
    apiKeySaveBtn.addEventListener("mouseover", onMouseOver);
    apiKeySaveBtn.addEventListener("mouseout", onMouseOut);
    apiKeySaveBtn.removeEventListener('click', saveApiKey);
    apiKeySaveBtn.addEventListener('click', resetApiKey);
}

// 설정 저장 함수
function saveSettings() {
    const floatingIcon = floatingIconSwitch.checked;
    const saveExample = saveExampleSwitch.checked;
    const highlight = highlightSwitch.checked;
    chrome.storage.sync.set({ floatingIcon, saveExample, highlight }, () => {
        alert('설정이 저장되었습니다.');
    });
}

// 저장된 설정 불러오기 함수
function loadSettings() {
    chrome.storage.sync.get(['floatingIcon', 'saveExample', 'highlight'], result => {
        if (result.floatingIcon) floatingIconSwitch.checked = result.floatingIcon;
        if (result.saveExample) saveExampleSwitch.checked = result.saveExample;
        if (result.highlight) highlightSwitch.checked = result.highlight;
    });
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

/// DB 크기 정보를 가져오는 함수
async function getDatabaseInfo() {
    try {
        const response = await sendMessageToBackground({ action: 'getDatabaseSize' });
        if (response && response.success) {
            const sizeInMB = (response.size / (1024 * 1024)).toFixed(2);
            const usagePercentage = response.usagePercentage;
            document.getElementById('dbSize').textContent = `${sizeInMB} MB`;
            document.getElementById('dbUsagePercentage').textContent = `${usagePercentage}%`;
        } else {
            throw new Error(response ? response.error : 'DB 정보를 가져오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('DB 정보 가져오기 중 오류 발생:', error);
        document.getElementById('dbSize').textContent = '오류';
        document.getElementById('dbUsagePercentage').textContent = '오류';
    }
}

// 이벤트 리스너 등록
apiKeySaveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey.length > 0) {
        saveApiKey(apiKey);
    }
});

saveSettingsBtn.addEventListener('click', saveSettings);

// 페이지 로드 시 설정 불러오기
document.addEventListener('DOMContentLoaded', loadSettings);

// 페이지 로드 시 DB 정보 업데이트
document.addEventListener('DOMContentLoaded', getDatabaseInfo);

// URL 파라미터에서 섹션 정보를 가져오는 함수
function getSectionFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('section');
}

// 특정 섹션을 표시하는 함수
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });

    // 네비게이션 메뉴 활성화 상태 업데이트
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href').substring(1) === sectionId);
    });
}

// 페이지 로드 시 실행되는 초기화 함수
function initializePage() {
    const section = getSectionFromUrl() || 'wordList'; // 기본값으로 'wordList' 사용
    showSection(section);
    loadSettings();
    getDatabaseInfo();
}

// 페이지 로드 시 초기화 함수 실행
document.addEventListener('DOMContentLoaded', initializePage);

// 네비게이션 기능 (기존 코드 수정)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        showSection(targetId);
        // URL 업데이트 (옵션)
        history.pushState(null, '', `?section=${targetId}`);
    });
});