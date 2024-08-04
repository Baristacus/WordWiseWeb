// 전역 변수
let selectedText = '';
let selectedContext = '';
let isSelecting = false;

// 플로팅 아이콘 생성
const floatingIcon = document.createElement('div');
floatingIcon.id = 'word-wise-web-floating-icon';
floatingIcon.style.cssText = `
    display: none;
    position: fixed;
    width: 24px;
    height: 24px;
    background-image: url(${chrome.runtime.getURL('images/floating-icon.png')});
    background-size: cover;
    cursor: pointer;
    z-index: 2147483647;
`;
document.body.appendChild(floatingIcon);

// 텍스트 선택 이벤트 리스너
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('selectionchange', handleTextSelection);

// 마우스 이벤트 리스너 추가
document.addEventListener('mousedown', () => {
    isSelecting = true;
    console.log('마우스 다운: 선택 시작');
});
document.addEventListener('mouseup', () => {
    setTimeout(() => {
        isSelecting = false;
        console.log('마우스 업: 선택 종료');
    }, 10);
});

// 텍스트 선택 처리 함수
function handleTextSelection(event) {
    console.log('텍스트 선택 이벤트 발생');
    setTimeout(() => {
        const selection = window.getSelection();
        const newSelectedText = selection.toString().trim();

        console.log('현재 선택된 텍스트:', newSelectedText);

        if (newSelectedText.length > 0 && newSelectedText.split(/\s+/).length <= 3) {
            selectedText = newSelectedText;
            const range = selection.getRangeAt(0);
            selectedContext = getTextContext(range, 100);
            const rect = range.getBoundingClientRect();
            showFloatingIcon(rect.left + window.pageXOffset, rect.top + window.pageYOffset);
            console.log('선택된 텍스트 업데이트:', selectedText);
            console.log('문맥:', selectedContext);
        } else if (!isSelecting && event.type === 'mouseup' && event.target !== floatingIcon) {
            hideFloatingIcon();
            selectedText = '';
            selectedContext = '';
            console.log('선택 해제: 텍스트와 문맥 초기화');
        }
    }, 10); // 약간의 지연을 두어 선택이 완료된 후 처리
}

// 플로팅 아이콘 표시 함수
function showFloatingIcon(x, y) {
    const iconSize = 24;
    const margin = 5;
    floatingIcon.style.left = `${Math.max(x - iconSize - margin, margin)}px`;
    floatingIcon.style.top = `${Math.max(y - iconSize - margin, margin)}px`;
    floatingIcon.style.display = 'block';
    console.log('플로팅 아이콘 표시됨');
}

// 플로팅 아이콘 숨김 함수
function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
    console.log('플로팅 아이콘 숨겨짐');
}

// 선택된 텍스트의 주변 문맥을 가져오는 함수
function getTextContext(range, maxLength) {
    const container = range.commonAncestorContainer;
    const textContent = container.textContent || container.innerText;
    const startOffset = Math.max(0, range.startOffset - maxLength / 2);
    const endOffset = Math.min(textContent.length, range.endOffset + maxLength / 2);
    return textContent.slice(startOffset, endOffset);
}

// 플로팅 아이콘 클릭 이벤트 처리
floatingIcon.addEventListener('click', handleIconClick);

// 아이콘 클릭 처리 함수
async function handleIconClick() {
    console.log('플로팅 아이콘 클릭됨');
    console.log('클릭 시 선택된 텍스트:', selectedText);
    console.log('클릭 시 문맥:', selectedContext);

    if (selectedText && selectedText.length > 0) {
        try {
            console.log('Gemini API 호출 시작');
            const response = await sendMessageToBackground({
                action: 'getDefinition',
                word: selectedText,
                context: selectedContext
            });
            console.log('Gemini API 응답:', response);

            if (response && response.success) {
                console.log('단어 저장 시작');
                const saveResponse = await sendMessageToBackground({
                    action: 'saveWord',
                    word: response.word,
                    definition: response.definition,
                    example: response.example
                });
                console.log('단어 저장 응답:', saveResponse);

                if (saveResponse && saveResponse.success) {
                    console.log('단어가 성공적으로 저장됨');
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
    hideFloatingIcon();
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

// 알림 표시 함수
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
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 문서 클릭 이벤트 리스너 수정
document.addEventListener('click', (event) => {
    if (event.target !== floatingIcon) {
        console.log('문서 클릭: 플로팅 아이콘 외 영역');
        hideFloatingIcon();
        selectedText = '';
        selectedContext = '';
    }
});

console.log('Word Wise Web content script loaded');