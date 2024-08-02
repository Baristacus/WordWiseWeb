// 브라우저 액션 이벤트 리스너: 확장 프로그램 아이콘 클릭 등의 이벤트 처리
// 컨텍스트 메뉴 생성 및 관리: 우클릭 시 나타나는 메뉴 항목 관리
// 알림 관리: 학습 알림 등을 위한 크롬 알림 API 사용
// API 호출 관리: Gemini API 호출 로직 중앙화
// 데이터 동기화: 클라우드 저장소와의 동기화 관리
// 백그라운드 학습 알고리즘 실행: 주기적인 복습 알고리즘 실행
// 오프라인 모드 관리: 네트워크 상태 모니터링 및 오프라인 모드 전환


// 컨텐츠 스크립트로부터의 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveWord') {
        handleSaveWord(request.word, request.context)
            .then(result => sendResponse({ success: true, result: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // 비동기 응답을 위해 true 반환
    }
});

// 단어 저장 처리 함수
async function handleSaveWord(word, context) {
    try {
        // api.js의 Gemini API 함수 호출
        const { definition, example } = await window.callGeminiAPI(word, context);

        // storage.js의 saveWord 함수 호출
        await window.saveWord(word, definition, example);

        return { word, definition, example };
    } catch (error) {
        console.error('Error saving word:', error);
        throw error;
    }
}

