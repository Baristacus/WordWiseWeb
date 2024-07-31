// DOM 요소 선택
const languageSelect = document.getElementById('languageSelect');
const targetLanguageSelect = document.getElementById('targetLanguageSelect');
const formalityCheck = document.getElementById('formalityCheck');
const apiKeyInput = document.getElementById('apiKeyInput');
const autoSaveSwitch = document.getElementById('autoSaveSwitch');
const darkModeSwitch = document.getElementById('darkModeSwitch');

// 설정 저장 함수
function saveOptions() {
    chrome.storage.sync.set({
        language: languageSelect.value,
        targetLanguage: targetLanguageSelect.value,
        formality: formalityCheck.checked,
        apiKey: apiKeyInput.value,
        autoSave: autoSaveSwitch.checked,
        darkMode: darkModeSwitch.checked
    }, function () {
        // 저장 완료 메시지 표시
        const status = document.createElement('div');
        status.textContent = '설정이 저장되었습니다.';
        status.className = 'alert alert-success mt-3';
        document.body.appendChild(status);
        setTimeout(function () {
            status.remove();
        }, 3000);
    });
}

// 저장된 설정 불러오기 함수
function restoreOptions() {
    chrome.storage.sync.get({
        language: 'ko',
        targetLanguage: 'en',
        formality: false,
        apiKey: '',
        autoSave: true,
        darkMode: false
    }, function (items) {
        languageSelect.value = items.language;
        targetLanguageSelect.value = items.targetLanguage;
        formalityCheck.checked = items.formality;
        apiKeyInput.value = items.apiKey;
        autoSaveSwitch.checked = items.autoSave;
        darkModeSwitch.checked = items.darkMode;
    });
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', restoreOptions);
languageSelect.addEventListener('change', saveOptions);
targetLanguageSelect.addEventListener('change', saveOptions);
formalityCheck.addEventListener('change', saveOptions);
apiKeyInput.addEventListener('input', saveOptions);
autoSaveSwitch.addEventListener('change', saveOptions);
darkModeSwitch.addEventListener('change', function () {
    saveOptions();
    document.body.classList.toggle('dark-mode');
});

// 사이드바 네비게이션 기능
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