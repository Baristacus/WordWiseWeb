// 브라우저 액션 이벤트 리스너: 확장 프로그램 아이콘 클릭 등의 이벤트 처리
// 컨텍스트 메뉴 생성 및 관리: 우클릭 시 나타나는 메뉴 항목 관리
// 알림 관리: 학습 알림 등을 위한 크롬 알림 API 사용
// API 호출 관리: Gemini API 호출 로직 중앙화
// 데이터 동기화: 클라우드 저장소와의 동기화 관리
// 백그라운드 학습 알고리즘 실행: 주기적인 복습 알고리즘 실행
// 오프라인 모드 관리: 네트워크 상태 모니터링 및 오프라인 모드 전환
importScripts('api.js');
importScripts('storage.js');

// content.js로부터 메시지를 받아 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDefinition') {
        getDefinition(request.word, request.context)
            .then(result => sendResponse({
                success: true,
                word: request.word,
                definition: result.definition,
                example: result.example
            }))
            .catch(error => sendResponse({
                success: false,
                error: error.message
            }));

        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'saveWord') {
        handleSaveWord(request.word, request.definition, request.example)
            .then(result => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // 비동기 응답을 위해 true 반환
    }
});

async function getDefinition(word, context) {
    try {
        const { definition, example } = await callGeminiAPI(word, context);

        return { definition, example }
    } catch (error) {
        throw error;
    }
}

async function handleSaveWord(word, definition, example) {
    try {
        await saveWord(word, definition, example);
    } catch {
        throw error;
    }
}