// 상수
const FLOATING_ICON_SIZE = 24;
const FLOATING_MARGIN = 5;
const MAX_CONTEXT_LENGTH = 100;
const MAX_WORDS = 3;
const NOTIFICATION_DURATION = 3000;
const IFRAME_WIDTH = 500;
const IFRAME_MIN_HEIGHT = 300;

// 전역 변수
let selectedText = '';
let selectedContext = '';
let isSelecting = false;
let isApiKeyValid = false;
let shadowRoot = null;
let iframe = null;
let settingFIcon = '';
let settingSaveE = '';
let settingHl = '';

// DOM 요소
const floatingMessage = createFloatingElement('word-wise-web-floating-message', `
    display: none;
    position: fixed;
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    z-index: 2147483647;
`);

const floatingIcon = createFloatingElement('word-wise-web-floating-icon', `
    display: none;
    position: fixed;
    width: ${FLOATING_ICON_SIZE}px;
    height: ${FLOATING_ICON_SIZE}px;
    background-image: url(${chrome.runtime.getURL('images/floating-icon.png')});
    background-size: cover;
    cursor: pointer;
    z-index: 2147483647;
`);

// 유틸리티 함수
function createFloatingElement(id, styles) {
    const element = document.createElement('div');
    element.id = id;
    element.style.cssText = styles;
    document.body.appendChild(element);
    return element;
}

// Shadow DOM 생성 함수
function createShadowDOM() {
    const host = document.createElement('div');
    host.id = 'word-wise-web-shadow-host';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'closed' });
    return shadowRoot;
}

// 아이프레임 생성 함수
function createIframe() {
    iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('floatingCard/floatingCard.html');
    iframe.style.cssText = `
        width: ${IFRAME_WIDTH}px;
        min-height: ${IFRAME_MIN_HEIGHT}px;
        height: auto;
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        background-color: white;
        position: relative;
        z-index: 2147483647;
        transition: height 0.3s ease;
    `;
    return iframe;
}

// 아이프레임 크기 조절 함수
function resizeIframe(height) {
    if (iframe) {
        iframe.style.height = `${Math.max(height, IFRAME_MIN_HEIGHT)}px`;
    }
}

// 아이프레임 표시 함수
function showIframe(x, y) {
    if (!shadowRoot) {
        shadowRoot = createShadowDOM();
    }
    if (!iframe) {
        iframe = createIframe();
        shadowRoot.appendChild(iframe);
    }
    iframe.style.position = 'fixed';
    iframe.style.left = `${Math.min(x, window.innerWidth - IFRAME_WIDTH - FLOATING_MARGIN)}px`;
    iframe.style.top = `${Math.min(y, window.innerHeight - IFRAME_MIN_HEIGHT - FLOATING_MARGIN)}px`;
    iframe.style.display = 'block';
}

// 아이프레임 숨기기 함수
function hideIframe() {
    if (iframe) {
        iframe.style.display = 'none';
    }
}

async function sendMessageToBackground(message) {
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

function getTextContext(range, maxLength) {
    const container = range.commonAncestorContainer;
    const textContent = container.textContent || container.innerText;
    const startOffset = Math.max(0, range.startOffset - maxLength / 2);
    const endOffset = Math.min(textContent.length, range.endOffset + maxLength / 2);
    return textContent.slice(startOffset, endOffset);
}

// API 키 상태 확인 함수
async function checkApiKeyStatus() {
    try {
        const response = await sendMessageToBackground({ action: 'checkApiKey' });
        isApiKeyValid = response.success;
    } catch (error) {
        console.error('API 키 상태 확인 중 오류 발생:', error);
        isApiKeyValid = false;
    }
}

// UI 관련 함수
function showFloatingMessage(message, x, y) {
    floatingMessage.textContent = message;
    floatingMessage.style.left = `${Math.max(x - 10, FLOATING_MARGIN)}px`;
    floatingMessage.style.top = `${Math.max(y - 20, FLOATING_MARGIN)}px`;
    floatingMessage.style.display = 'block';
}

function showFloatingIcon(x, y) {
    floatingIcon.style.left = `${Math.min(x + FLOATING_MARGIN, window.innerWidth - FLOATING_ICON_SIZE - FLOATING_MARGIN)}px`;
    floatingIcon.style.top = `${Math.max(y - FLOATING_ICON_SIZE - FLOATING_MARGIN, FLOATING_MARGIN)}px`;
    floatingIcon.style.display = 'block';
}

function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
}

function hideFloatingElements() {
    hideFloatingIcon();
    floatingMessage.style.display = 'none';
    hideIframe();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 2147483647;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), NOTIFICATION_DURATION);
}

// 이벤트 핸들러
async function handleTextSelection(event) {
    setTimeout(async () => {
        const selection = window.getSelection();
        const newSelectedText = selection.toString().trim();

        if (newSelectedText.length > 0 && newSelectedText.split(/\s+/).length <= MAX_WORDS) {
            selectedText = newSelectedText;
            const range = selection.getRangeAt(0);
            selectedContext = getTextContext(range, MAX_CONTEXT_LENGTH);

            let x = event.clientX;
            let y = event.clientY
            showFloatingIcon(x, y);

        } else if (!isSelecting && event.type === 'mouseup' && event.target !== floatingIcon && event.target !== floatingMessage) {
            hideFloatingElements();
            selectedText = '';
            selectedContext = '';
        }
    }, 10);
}

async function handleIconClick(event) {
    event.stopPropagation();  // 이벤트 전파 중지
    await checkApiKeyStatus();
    if (!isApiKeyValid) {
        hideFloatingIcon();
        showFloatingMessage("API 키를 먼저 등록해 주세요.", event.clientX, event.clientY);
        return;
    }

    if (selectedText && selectedText.length > 0) {
        try {
            const response = await sendMessageToBackground({
                action: 'getDefinition',
                word: selectedText,
                context: selectedContext
            });

            if (response && response.success) {
                showIframe(event.clientX, event.clientY);

                // 아이프레임에 데이터 전송
                function handleIframe() {
                    iframe.contentWindow.postMessage({
                        action: 'showDefinition',
                        word: response.word,
                        definition: response.definition,
                        example: response.example
                    }, '*');
                }

                if (iframe) {
                    handleIframe();
                }
                iframe.onload = () => handleIframe();
            } else {
                console.error('단어 의미 가져오기 실패:', response ? response.error : '응답 없음');
                showNotification('단어의 의미를 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('오류 발생:', error);
            showNotification('오류가 발생했습니다: ' + error.message);
        }
    } else {
        console.error('선택된 텍스트가 없습니다.');
        showNotification('선택된 텍스트가 없습니다. 단어를 선택한 후 다시 시도해주세요.');
    }
    hideFloatingIcon();  // 플로팅 아이콘 숨기기
}

function handleDocumentClick(event) {
    if (event.target !== floatingIcon &&
        event.target !== floatingMessage &&
        (!iframe || !iframe.contains(event.target))) {
        hideFloatingElements();
        selectedText = '';
        selectedContext = '';
    }
}


// 환경설정 값 받아오는 함수
function setSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['floatingIcon', 'saveExample', 'highlight'], (result) => {
            settingFIcon = result.floatingIcon !== false;
            settingSaveE = result.saveExample !== false;
            settingHl = result.highlight !== false;
            resolve();
        });
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setSettings);
} else {
    setSettings();
}


// 환경설정 값 변경 시 반영하는 리스너
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.floatingIcon) {
            settingFIcon = changes.floatingIcon.newValue !== false;
        }
        if (changes.saveExample) {
            settingSaveE = changes.saveExample.newValue !== false;
        }
        if (changes.highlight) {
            settingHl = changes.highlight.newValue !== false;
        }
    }
});

// 이벤트 리스너
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('mousedown', () => { isSelecting = true; });
document.addEventListener('mouseup', () => { setTimeout(() => { isSelecting = false; }, 10); });
floatingIcon.addEventListener('click', handleIconClick);
document.addEventListener('click', handleDocumentClick);
setTimeout(() => {getSettings()}, 0);


// 다른 js에서 메세지를 받아오는 메시지 리스너
window.addEventListener('message', function (event) {
    if (event.data.action === 'resize') {
        // 아이프레임 크기 조절
        resizeIframe(event.data.height);
    } else if (event.data.action === 'saveOk') {
        // 단어 저장 후 플로팅 요소 숨기기
        hideFloatingElements();
        showNotification(`단어가 저장되었습니다: ${event.data.word}`);
    }
    return true;
});

// 초기화
console.log('Word Wise Web content script loaded');

// 윈도우 크기 변경 시 아이프레임 위치 조정
window.addEventListener('resize', () => {
    if (iframe && iframe.style.display !== 'none') {
        const rect = iframe.getBoundingClientRect();
        const newLeft = Math.min(rect.left, window.innerWidth - IFRAME_WIDTH - FLOATING_MARGIN);
        const newTop = Math.min(rect.top, window.innerHeight - parseInt(iframe.style.height) - FLOATING_MARGIN);
        iframe.style.left = `${newLeft}px`;
        iframe.style.top = `${newTop}px`;
    }
});
