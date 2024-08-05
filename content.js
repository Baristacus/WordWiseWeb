// 상수
const FLOATING_ICON_SIZE = 24;
const FLOATING_MARGIN = 5;
const MAX_CONTEXT_LENGTH = 100;
const MAX_WORDS = 3;
const NOTIFICATION_DURATION = 3000;

// 전역 변수
let selectedText = '';
let selectedContext = '';
let isSelecting = false;
let isApiKeyValid = false;

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
    floatingMessage.style.left = `${Math.max(x, FLOATING_MARGIN)}px`;
    floatingMessage.style.top = `${Math.max(y - 40, FLOATING_MARGIN)}px`;
    floatingMessage.style.display = 'block';
}

function showFloatingIcon(x, y) {
    floatingIcon.style.left = `${Math.max(x - FLOATING_ICON_SIZE - FLOATING_MARGIN, FLOATING_MARGIN)}px`;
    floatingIcon.style.top = `${Math.max(y - FLOATING_ICON_SIZE - FLOATING_MARGIN, FLOATING_MARGIN)}px`;
    floatingIcon.style.display = 'block';
}

function hideFloatingElements() {
    floatingIcon.style.display = 'none';
    floatingMessage.style.display = 'none';
}

// hideFloatingIcon 함수 추가
function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
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
            const rect = range.getBoundingClientRect();

            await checkApiKeyStatus();

            if (isApiKeyValid) {
                showFloatingIcon(rect.left + window.pageXOffset, rect.top + window.pageYOffset);
            } else {
                showFloatingMessage("API 키를 먼저 등록해 주세요.", rect.left + window.pageXOffset, rect.top + window.pageYOffset);
            }
        } else if (!isSelecting && event.type === 'mouseup' && event.target !== floatingIcon && event.target !== floatingMessage) {
            hideFloatingElements();
            selectedText = '';
            selectedContext = '';
        }
    }, 10);
}

async function handleIconClick() {
    if (selectedText && selectedText.length > 0) {
        try {
            const response = await sendMessageToBackground({
                action: 'getDefinition',
                word: selectedText,
                context: selectedContext
            });

            if (response && response.success) {
                const saveResponse = await sendMessageToBackground({
                    action: 'saveWord',
                    word: response.word,
                    definition: response.definition,
                    example: response.example
                });

                if (saveResponse && saveResponse.success) {
                    showNotification(`단어가 저장되었습니다: ${selectedText}`);
                } else {
                    console.error('단어 저장 실패:', saveResponse ? saveResponse.error : '응답 없음');
                    showNotification('단어 저장에 실패했습니다.');
                }
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
    hideFloatingElements();  // hideFloatingIcon 대신 hideFloatingElements 사용
}

function handleDocumentClick(event) {
    if (event.target !== floatingIcon && event.target !== floatingMessage) {
        hideFloatingElements();
        selectedText = '';
        selectedContext = '';
    }
}

// 이벤트 리스너
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('selectionchange', handleTextSelection);
document.addEventListener('mousedown', () => { isSelecting = true; });
document.addEventListener('mouseup', () => { setTimeout(() => { isSelecting = false; }, 10); });
floatingIcon.addEventListener('click', handleIconClick);
document.addEventListener('click', handleDocumentClick);

// 초기화
console.log('Word Wise Web content script loaded');