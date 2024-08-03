// 전역 변수
let selectedText = '';
let selectedContext = '';

// 플로팅 아이콘 생성
const floatingIcon = document.createElement('div');
floatingIcon.id = 'word-wise-web-floating-icon';
floatingIcon.style.cssText = `
    display: none;
    position: absolute;
    width: 24px;
    height: 24px;
    background-image: url(${chrome.runtime.getURL('images/floating-icon.png')});
    background-size: cover;
    cursor: pointer;
    z-index: 9999;
`;
document.body.appendChild(floatingIcon);

// 텍스트 선택 이벤트 리스너
document.addEventListener('selectionchange', handleTextSelection);

// 텍스트 선택 처리 함수
function handleTextSelection() {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();

    if (selectedText.length > 0 && selectedText.split(/\s+/).length <= 3) {
        const range = selection.getRangeAt(0);
        selectedContext = getTextContext(range, 500);
        const rect = range.getBoundingClientRect();
        showFloatingIcon(rect.left + window.scrollX, rect.top + window.scrollY);
        console.log('선택된 텍스트:', selectedText);
        console.log('문맥:', selectedContext);
    } else {
        hideFloatingIcon();
    }
}

// 플로팅 아이콘 표시 함수
function showFloatingIcon(x, y) {
    const iconSize = 24;
    const margin = 5;
    floatingIcon.style.left = `${Math.max(x - iconSize - margin, margin)}px`;
    floatingIcon.style.top = `${Math.max(y - iconSize - margin, margin)}px`;
    floatingIcon.style.display = 'block';
}

// 플로팅 아이콘 숨김 함수
function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
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
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'getDefinition',
                    word: selectedText,
                    context: selectedContext
                }, resolve);
            });
            console.log('Gemini API 응답:', response);

            if (response && response.success) {
                console.log('단어 저장 시작');
                const saveResponse = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: 'saveWord',
                        word: response.word,
                        definition: response.definition,
                        example: response.example
                    }, resolve);
                });
                console.log('단어 저장 응답:', saveResponse);

                if (saveResponse && saveResponse.success) {
                    console.log('단어가 성공적으로 저장됨');
                    alert(`단어가 저장되었습니다: ${selectedText}`);
                } else {
                    console.error('단어 저장 실패:', saveResponse ? saveResponse.error : '응답 없음');
                    alert('단어 저장에 실패했습니다.');
                }
            } else {
                console.error('단어 의미 가져오기 실패:', response ? response.error : '응답 없음');
                alert('단어의 의미를 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('오류 발생:', error);
            alert('오류가 발생했습니다: ' + error.message);
        }
    } else {
        console.error('선택된 텍스트가 없습니다.');
        alert('선택된 텍스트가 없습니다. 단어를 선택한 후 다시 시도해주세요.');
    }
    hideFloatingIcon();
}

// 문서 클릭 이벤트 리스너 추가
document.addEventListener('click', (event) => {
    if (event.target !== floatingIcon) {
        hideFloatingIcon();
    }
});

console.log('Word Wise Web content script loaded');