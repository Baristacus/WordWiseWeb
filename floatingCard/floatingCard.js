// DOM 요소 선택
const DOM = {
    wordListBtn: document.getElementById('wordListBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    learnBtn: document.getElementById('learnBtn'),
    saveWordBtn: document.getElementById('saveWordBtn'),
};

// 내용을 표시하고 높이를 계산하는 함수
function showDefinition(word, definition, example) {
    document.getElementById('word').textContent = word;
    document.getElementById('definition').textContent = definition;
    document.getElementById('example').textContent = example;

    // 내용이 변경된 후 높이를 계산하고 부모 창에 전달
    setTimeout(() => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ action: 'resize', height: height }, '*');
    }, 0);
}

// content.js로부터 메시지를 받아 내용을 표시하는 함수
window.addEventListener('message', function (event) {
    if (event.data.action === 'showDefinition') {
        showDefinition(event.data.word, event.data.definition, event.data.example);
    }
});

// 옵션 페이지 관련 함수
function openOptionsPage(section) {
    chrome.tabs.create({ url: `options/options.html?section=${section}` });
}

// 이벤트 리스너
DOM.wordListBtn.addEventListener('click', () => openOptionsPage('wordList'));
DOM.settingsBtn.addEventListener('click', () => openOptionsPage('settings'));
DOM.learnBtn.addEventListener('click', () => openOptionsPage('learn'));