// DOM 요소 선택
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeySaveBtn = document.getElementById('apiKeySaveBtn');

// API 키 저장 함수
function saveApiKey(apiKey) {
    chrome.storage.sync.set({ apiKey }, () => {
        apiKeyInput.value = `${apiKey.slice(0, 5)}...`;
        apiKeyInput.disabled = true;
        apiKeySaveBtn.textContent = '저장됨';
        apiKeySaveBtn.classList.remove('btn-primary');
        apiKeySaveBtn.classList.add('btn-success');
    });
}

// API 키가 저장되어 있는지 확인하고 키 일부만 표시
chrome.storage.sync.get(['apiKey'], result => {
    if (result.apiKey) {
        apiKeyInput.value = `${result.apiKey.slice(0, 5)}...`;
        apiKeyInput.disabled = true;
        apiKeySaveBtn.textContent = '저장됨';
        apiKeySaveBtn.classList.remove('btn-primary');
        apiKeySaveBtn.classList.add('btn-success');

        // 재설정 버튼 클릭 시 API 키 초기화 후 입력 필드 활성화
        apiKeySaveBtn.addEventListener('click', () => {
            chrome.storage.sync.remove('apiKey', () => {
                apiKeyInput.value = '';
                apiKeyInput.disabled = false;
                apiKeySaveBtn.textContent = '저장';
                apiKeySaveBtn.classList.remove('btn-danger');
                apiKeySaveBtn.classList.add('btn-primary');
                apiKeyInput.focus();
            })
        });
    }
});

// 설정 저장 함수

// 저장된 설정 불러오기 함수

// 이벤트 리스너 등록
apiKeySaveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey.length > 0) {
        saveApiKey(apiKey);
    }
});

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