// 웹 페이지 텍스트 분석: 전문 용어 및 학습 대상 단어 식별
// 인라인 단어 설명: 마우스 오버 시 단어 설명 표시
// 텍스트 선택 이벤트 처리: 사용자가 선택한 텍스트에 대한 액션 제공
// 페이지 컨텍스트 분석: 현재 페이지의 주제 및 전문 분야 파악
// 동적 하이라이팅: 저장된 단어나 학습 중인 단어 하이라이트
// 플로팅 아이콘 표시: 선택된 텍스트 근처에 학습 옵션 아이콘 표시
// 페이지 내 학습 위젯 삽입: 필요시 학습 관련 UI 요소 동적 추가

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

async function handleIconClick() {
    // 선택된 텍스트를 가져옴
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        try {
            // 문맥을 가져옴
            const context = window.getSelection().anchorNode.textContent; // 현재 문맥을 가져옴
            console.log('context:', context); // 디버깅용 콘솔 로그 추가
            // API 호출
            const { definition, example } = await callGeminiAPI(selectedText, context); // 정의와 예문을 가져옴
            console.log('정의:', definition);
            console.log('예문:', example);

            // 단어 저장
            window.saveWord(selectedText, definition, example).then(() => {
                console.log('단어가 저장되었습니다:', selectedText);
            }).catch(error => {
                console.error('단어 저장 중 오류 발생:', error);
            });
        } catch (error) {
            console.error('단어 처리에 실패했습니다:', error);
        }
    }
    hideFloatingIcon();
}

// 문서 클릭 이벤트 리스너 추가
document.addEventListener('click', (event) => {
    if (event.target !== floatingIcon) {
        hideFloatingIcon();
    }
});
