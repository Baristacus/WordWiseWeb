// 단어 정보 전달용 변수 선언
let word = "";
let definition = "";
let example = "";

// DOM 요소 선택
const DOM = {
    wordListBtn: document.getElementById('wordListBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    learnBtn: document.getElementById('learnBtn'),
    saveWordBtn: document.getElementById('saveWordBtn'),
    userMemoText: document.getElementById('userMemoText'),
    content: document.getElementById('content'),
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
        word = event.data.word;
        definition = event.data.definition;
        example = event.data.example;
        settingSaveE = event.data.exampleSetting;
        showDefinition(word, definition, example);
    }
});

// 옵션 페이지 관련 함수
function openOptionsPage(section) {
    chrome.tabs.create({ url: `options/options.html?section=${section}` });
}

// 단어 저장 함수
async function handleSaveWord() {
    try {
        // 환경설정에서 예문 저장하지 않게 선택 시 값 초기화
        if (!settingSaveE) {
            example = "";
        }
        const userMemo = DOM.userMemoText.value;
        const saveResponse = await sendMessageToBackground({
            action: 'saveWord',
            word: word,
            definition: definition,
            example: example,
            userMemo: userMemo
        });

        if (saveResponse && saveResponse.success) {
            DOM.userMemoText.value = "";
            window.parent.postMessage({ action: 'saveOk', word: word }, '*');            
        } else {
            console.error('단어 저장 실패:', saveResponse ? saveResponse.error : '응답 없음');
            showNotification('단어 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('오류 발생:', error);
        showNotification('오류가 발생했습니다: ' + error.message);
    }
}

// 알림 표시 함수
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// 백그라운드에 메시지 전송 함수
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

// 이벤트 리스너
DOM.wordListBtn.addEventListener('click', () => openOptionsPage('wordList'));
DOM.settingsBtn.addEventListener('click', () => openOptionsPage('settings'));
DOM.learnBtn.addEventListener('click', () => openOptionsPage('learn'));
DOM.saveWordBtn.addEventListener('click', async () => handleSaveWord());

// 내용 변경 감지 및 높이 조절
const observer = new MutationObserver(() => {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ action: 'resize', height: height }, '*');
});

observer.observe(DOM.content, { childList: true, subtree: true });