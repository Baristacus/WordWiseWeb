const API_KEY = 'AIzaSyDOcTqKHLy2WkusecvcvcZ89PQIcVJTFB0'; // 실제 API 키로 교체하세요

console.log('Background script loaded');

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in background:', request);
    if (request.action === "SAVE_WORD") {
        getWordInfo(request.word)
            .then(() => {
                console.log('Word saved successfully');
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error('Error saving word:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // 비동기 응답을 위해 true 반환
    }
});

async function getWordInfo(word) {
    console.log('Fetching word info for:', word);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `"${word}"의 사전적 의미만 간단히 알려주세요. 예문은 제외하고 의미만 알려주세요.`
                    }]
                }]
            })
        });

        const data = await response.json();
        const wordInfo = data.candidates[0].content.parts[0].text;

        // 단어 정보 저장 (날짜 포함)
        const savedDate = new Date().toISOString();
        await chrome.storage.local.set({ [word]: { meaning: wordInfo, date: savedDate } });
        console.log('단어 정보가 저장되었습니다:', word);

        // 팝업에 메시지 전송
        chrome.runtime.sendMessage({ action: "WORD_SAVED", word: word });

    } catch (error) {
        console.error('API 요청 중 오류 발생:', error);
        throw error;
    }
}