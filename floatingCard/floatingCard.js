// 단어 정보 전달용 변수 선언
let word ="";
let definition ="";
let example = "";

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
        word = event.data.word;
        definition = event.data.definition;
        example = event.data.example;
        console.log("아이프레임에서 전달받은 텍스트1: ", word);
        console.log("아이프레임에서 전달받은 텍스트2: ", event.data.word);
        showDefinition(event.data.word, event.data.definition, event.data.example);
    }
});

// 옵션 페이지 관련 함수
function openOptionsPage(section) {
    chrome.tabs.create({ url: `options/options.html?section=${section}` });
}

// 단어 저장 함수
async function handleSaveWord() {
    try {
        const saveResponse = await sendMessageToBackground({
            action: 'saveWord',
            word: word,
            definition: definition,
            example: example
        });

        if (saveResponse && saveResponse.success) {
            showNotification(`단어가 저장되었습니다: ${selectedText}`);
        } else {
            console.error('단어 저장 실패:', saveResponse ? saveResponse.error : '응답 없음');
            showNotification('단어 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('오류 발생:', error);
        showNotification('오류가 발생했습니다: ' + error.message);
    }
}

// 이벤트 리스너
DOM.wordListBtn.addEventListener('click', () => openOptionsPage('wordList'));
DOM.settingsBtn.addEventListener('click', () => openOptionsPage('settings'));
DOM.learnBtn.addEventListener('click', () => openOptionsPage('learn'));
DOM.saveWordBtn.addEventListener('click', async () => handleSaveWord());