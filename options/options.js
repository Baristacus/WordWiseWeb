// DOM 요소 선택
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeySaveBtn = document.getElementById('apiKeySaveBtn');
const floatingIconSwitch = document.getElementById('floatingIconSwitch');
const saveExampleSwitch = document.getElementById('saveExampleSwitch');
const highlightSwitch = document.getElementById('highlightSwitch');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

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

// 페이지 로드 시 설정 불러오기
document.addEventListener('DOMContentLoaded', loadSettings);

// 페이지 로드 시 DB 정보 업데이트
document.addEventListener('DOMContentLoaded', getDatabaseInfo);