// 플로팅 아이콘 요소 생성 및 스타일 적용
const floatingIcon = document.createElement('div');
floatingIcon.id = 'word-wise-web-floating-icon';
floatingIcon.style.display = 'none';
floatingIcon.style.position = 'absolute';
floatingIcon.style.width = '24px';
floatingIcon.style.height = '24px';
floatingIcon.style.backgroundImage = `url(${chrome.runtime.getURL('images/floating-icon.png')})`;
floatingIcon.style.backgroundSize = 'cover';
floatingIcon.style.cursor = 'pointer';
floatingIcon.style.zIndex = '9999';

document.body.appendChild(floatingIcon);

// 마우스 업 이벤트 리스너 추가
document.addEventListener('mouseup', handleTextSelection);

// 텍스트 선택 처리 함수
function handleTextSelection(event) {
    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();

        if (selectedText.length > 0 && selectedText.split(/\s+/).length <= 3) {
            // 선택된 텍스트가 있고, 3단어 이하인 경우에만 플로팅 아이콘 표시
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            showFloatingIcon(rect.left + window.scrollX, rect.top + window.scrollY);
        } else {
            // 선택된 텍스트가 없거나 3단어 초과인 경우 플로팅 아이콘 숨김
            hideFloatingIcon();
        }
    }, 10); // 약간의 지연을 두어 선택이 완료된 후 처리
}

// 플로팅 아이콘 표시 함수
function showFloatingIcon(x, y) {
    const iconSize = 24;
    const margin = 5;

    // 화면 왼쪽 경계 확인
    let left = Math.max(x - iconSize - margin, margin);

    // 화면 위쪽 경계 확인
    let top = Math.max(y - iconSize - margin, margin);

    floatingIcon.style.left = `${left}px`;
    floatingIcon.style.top = `${top}px`;
    floatingIcon.style.display = 'block';
}

// 플로팅 아이콘 숨김 함수
function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
}

// 플로팅 아이콘 클릭 이벤트 처리
floatingIcon.addEventListener('click', handleIconClick);

// 아이콘 클릭 처리 함수
function handleIconClick() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        // TODO: 선택된 단어 처리 로직 구현
        console.log('선택된 단어:', selectedText);
        // 여기에 단어 저장 또는 팝업 표시 등의 로직을 추가할 수 있습니다.
    }
    hideFloatingIcon();
}

// 문서 클릭 이벤트 리스너 추가
document.addEventListener('click', (event) => {
    if (event.target !== floatingIcon) {
        hideFloatingIcon();
    }
});