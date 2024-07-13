let selectedText = '';
let icon = null;

function createIcon(rect) {
    if (icon) {
        document.body.removeChild(icon);
    }

    icon = document.createElement('div');
    icon.className = 'ai-word-helper-icon';

    // 위치 계산 로직 수정
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    icon.style.position = 'absolute';
    icon.style.top = `${scrollY + rect.top - 30}px`; // 단어 위 30px 위치
    icon.style.left = `${scrollX + rect.left - 30}px`; // 단어 왼쪽 30px 위치
    icon.textContent = '📚';
    icon.title = '이 단어 저장하기';

    icon.addEventListener('click', function (e) {
        e.stopPropagation();
        console.log('Sending message to save word:', selectedText);
        chrome.runtime.sendMessage({ action: "SAVE_WORD", word: selectedText }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
            } else if (response && response.success) {
                console.log('단어가 성공적으로 저장되었습니다.');
            } else {
                console.error('단어 저장 중 오류 발생:', response ? response.error : 'Unknown error');
            }
        });
        removeIcon();
    });

    document.body.appendChild(icon);

    console.log('Icon created:', icon); // 디버깅용 로그
}

function removeIcon() {
    if (icon && icon.parentNode) {
        icon.parentNode.removeChild(icon);
        icon = null;
    }
}

document.addEventListener('mouseup', function (event) {
    setTimeout(() => {
        const selection = window.getSelection();
        selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            createIcon(rect);
        } else {
            removeIcon();
        }
    }, 10); // 약간의 지연을 추가하여 선택이 완료된 후 아이콘이 생성되도록 함
});

// 클릭 이벤트 리스너
document.addEventListener('click', function (event) {
    if (icon && !icon.contains(event.target)) {
        removeIcon();
    }
});

// 스크롤 이벤트 리스너
window.addEventListener('scroll', function () {
    if (icon) {
        removeIcon();
    }
});

// 디버깅용 메시지
console.log('Content script loaded and running');