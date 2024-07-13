let selectedText = '';
let icon = null;

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
    }, 10);
});

function createIcon(rect) {
    if (icon) {
        document.body.removeChild(icon);
    }

    icon = document.createElement('div');
    icon.className = 'ai-word-helper-icon';

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    icon.style.position = 'absolute';
    icon.style.top = `${scrollY + rect.top - 30}px`;
    icon.style.left = `${scrollX + rect.left - 30}px`;
    icon.textContent = '📚';
    icon.title = '이 단어 저장하기';

    icon.addEventListener('click', function (e) {
        e.stopPropagation();
        console.log('Sending message to save word:', selectedText);
        chrome.runtime.sendMessage({ action: "SAVE_WORD", word: selectedText })
            .then(response => {
                if (response && response.success) {
                    console.log('단어가 성공적으로 저장되었습니다.');
                } else {
                    console.error('단어 저장 중 오류 발생:', response ? response.error : 'Unknown error');
                }
            })
            .catch(error => {
                console.error('메시지 전송 중 오류 발생:', error);
            });
        removeIcon();
    });

    document.body.appendChild(icon);
}

function removeIcon() {
    if (icon && icon.parentNode) {
        icon.parentNode.removeChild(icon);
        icon = null;
    }
}

document.addEventListener('click', function (event) {
    if (icon && !icon.contains(event.target)) {
        removeIcon();
    }
});

window.addEventListener('scroll', function () {
    if (icon) {
        removeIcon();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "WORD_SAVED") {
        showContentToast(`단어 "${request.word}"가 저장되었습니다.`);
    }
});

function showContentToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

console.log('Content script loaded and running');