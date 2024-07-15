const API_KEY = 'AIzaSyDOcTqKHLy2WkusecvcvcZ89PQIcVJTFB0'; // 실제 API 키로 교체하세요

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SAVE_WORD") {
        getWordInfo(request.word)
            .then(() => {
                sendResponse({ success: true });
                notifyWordSaved(request.word);
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
                        text: `"${word}"의 의미를 앞, 뒤 문맥을 파악하여 가장 정확하다고 판단한 것을 예문은 제외하고 뜻만 간단히 알려줘. ~입니다와 같은 문장으로 답변하지 말고, 단어의 의미만 알려줘.`
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

    } catch (error) {
        console.error('API 요청 중 오류 발생:', error);
        throw error;
    }
}

function notifyWordSaved(word) {
    // 콘텐츠 스크립트로 메시지 전송 (변경 없음)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "WORD_SAVED", word: word })
                .catch(error => console.error('Error sending message to content script:', error));
        }
    });

    // 팝업으로 직접 메시지를 보내는 대신 스토리지에 정보 저장
    chrome.storage.local.set({ lastSavedWord: { word: word, time: new Date().getTime() } }, function () {
        console.log('Last saved word info stored');
    });
}