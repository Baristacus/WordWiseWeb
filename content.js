let selectedText = ''; // 선택된 텍스트를 저장할 변수
let selectedContext = ''; // 선택된 텍스트의 문맥을 저장할 변수

// 부트스트랩 CSS 포함
const bootstrapCSS = document.createElement('link');
bootstrapCSS.rel = 'stylesheet';
bootstrapCSS.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css';
document.head.appendChild(bootstrapCSS);

// 부트스트랩 아이콘 CSS 포함
const bootstrapIconsCSS = document.createElement('link');
bootstrapIconsCSS.rel = 'stylesheet';
bootstrapIconsCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.4.1/font/bootstrap-icons.min.css';
document.head.appendChild(bootstrapIconsCSS);

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

// 마우스 다운 이벤트 리스너 추가
floatingIcon.addEventListener('mousedown', handleIconMouseDown);

// 텍스트 선택 처리 함수
function handleTextSelection(event) {
    setTimeout(() => {
        selectedText = window.getSelection().toString().trim();
        if (selectedText.length > 0) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            selectedContext = range.startContainer.textContent.trim();
        }
        console.log('선택된 텍스트:', selectedText); // 디버깅용 로그 추가
        console.log('context:', selectedContext); // 디버깅용 로그 추가

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
    console.log('플로팅 아이콘 표시됨'); // 디버깅용 로그
}

// 플로팅 아이콘 숨김 함수
function hideFloatingIcon() {
    floatingIcon.style.display = 'none';
    console.log('플로팅 아이콘 숨김'); // 디버깅용 로그
}

// 플로팅 아이콘 클릭 전에 텍스트 저장 함수
function handleIconMouseDown(event) {
    selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        selectedContext = range.startContainer.textContent.trim();
    }
    console.log('mousedown - 선택된 텍스트:', selectedText); // 디버깅용 로그 추가
    console.log('mousedown - context:', selectedContext); // 디버깅용 로그 추가
}

// 부트스트랩과 함께 플로팅 팝업 생성 및 스타일 적용
function createFloatingPopup(word, definition, example) {
    console.log('플로팅 팝업 생성 시작'); // 디버깅용 로그 추가
    const existingPopup = document.getElementById('floatingPopup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'floatingPopup';
    popup.className = 'card'; // Bootstrap 클래스를 사용
    popup.style.position = 'fixed';
    popup.style.top = '10px';
    popup.style.right = '10px';
    popup.style.zIndex = '10000';
    popup.style.width = '500px'; // 너비 조정

    popup.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <span class="h5"><img src="${chrome.runtime.getURL('images/icon-32.png')}" alt="Word Wise Web 로고" height="24"> Word Wise Web</span>
            <div>
                <i class="bi bi-list" style="font-size: 1.5rem; cursor: pointer; margin-right: 10px;"></i>
                <i class="bi bi-gear" style="font-size: 1.5rem; cursor: pointer; margin-right: 10px;"></i>
                <i class="bi bi-x" id="closePopupBtn" style="font-size: 1.5rem; cursor: pointer;"></i>
            </div>
        </div>
        <div class="card-body">
            <p><strong>단어:</strong> ${word}</p>
            <p><strong>의미:</strong> ${definition}</p>
            <p><strong>예문:</strong> ${example}</p>
        </div>
        <div class="card-footer">
            <div class="d-flex justify-content-between">
                <a href="#" class="btn btn-link">저장된 단어인지 표시</a>
                <a href="#" class="btn btn-link">몇 번 찾아본 단어인지 표시</a>
                <a href="#" class="btn btn-link">저장된 단어라면 날짜 표시</a>
                <i class="bi bi-bookmark" style="font-size: 1.5rem; cursor: pointer;"></i>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
    console.log('플로팅 팝업 생성됨'); // 디버깅용 로그

    document.getElementById('closePopupBtn').addEventListener('click', () => {
        popup.remove();
    });

    document.getElementById('saveWordBtn').addEventListener('click', async () => {
        try {
            const result = await callBackendAPI(word, selectedContext);
            await saveWord(word, result.definition, result.example);
            alert('단어가 성공적으로 저장되었습니다.');
            popup.remove();
        } catch (error) {
            console.error('단어 저장 오류:', error);
            alert('단어 저장 중 오류가 발생했습니다.');
        }
    });
}

// 플로팅 아이콘 클릭 이벤트 처리
floatingIcon.addEventListener('click', handleIconClick);

function handleIconClick() {
    console.log('플로팅 아이콘 클릭됨'); // 디버깅용 로그
    console.log('선택된 텍스트:', selectedText); // 디버깅용 로그 추가
    if (selectedText.length > 0) {
        console.log('context:', selectedContext); // 디버깅용 콘솔 로그 추가

        // 플로팅 팝업 생성 및 API 호출
        createFloatingPopup(selectedText, "정의를 불러오는 중...", "예문을 불러오는 중...");
        
        chrome.runtime.sendMessage({
            action: 'getDefinition',
            word: selectedText,
            context: selectedContext
        });
    }
    hideFloatingIcon();
}

// 백그라운드에서 정의 및 예문 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'definitionResult') {
        const popup = document.getElementById('floatingPopup');
        if (popup) {
            popup.querySelector('.card-body').innerHTML = `
                <p><strong>단어:</strong> ${message.word}</p>
                <p><strong>의미:</strong> ${message.definition}</p>
                <p><strong>예문:</strong> ${message.example}</p>
            `;
        }
    }
});
