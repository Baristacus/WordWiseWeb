// Gemini API 키와 URL
let API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// 저장된 API 키 가져오기
chrome.storage.sync.get(['apiKey'], result => {
    if (result.apiKey) {
        API_KEY = result.apiKey;
    }
});

// Gemini API를 사용하여 단어 의미 가져오기
async function callGeminiAPI(word, context) {
    if (!API_KEY) {
        throw new Error('등록된 API_KEY가 없습니다.');
    }

    const prompt = `
        너는 백과사전이야. 아래의 텍스트와 텍스트가 포함된 문맥을 보고 텍스트의 사전적 의미와 예문을 알려줘.
        
        텍스트: ${word}
        문맥: ${context}

        텍스트의 의미가 여러개라면 문맥의 맥락을 파악해서 문맥 속에 사용된 의미로 대답해줘.
        그리고 문맥에서 사용된 표현을 그대로 사용하면 안돼.

        예문은 텍스트를 활용한 문장을 하나 작성해줘.
        의미를 정확하게 반영하는 예문이어야해.
        
        응답 형식은 아래와 같이 해줘:
        의미: (텍스트의 의미)
        예문: (작성된 예문)

        의미는 반드시 명사 또는 ~음, ~함 등의 명사형 어미로 끝나야 하고 절대 NEVER ~이다., ~하다. 등 서술형으로 끝나면 안돼.
        예문은 ~입니다., ~합니다. 등의 존댓말이 아니라 ~다., ~이다. 등의 평서형 어미로 끝나도록 답해줘.

        반드시 응답 형식을 지켜서 답변해야해.
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            if (response.status === 400) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message.includes('API key not valid')) {
                    throw new Error('API 키가 유효하지 않습니다. API 키를 확인해주세요.');
                }
            }
            throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.candidates[0].content.parts[0].text;

        const lines = result.split('\n');
        let definition = '';
        let example = '';

        for (const line of lines) {
            if (line.startsWith('의미:')) {
                definition = line.slice(3).trim();
            } else if (line.startsWith('예문:')) {
                example = line.slice(3).trim();
            }
        }

        if (!definition || !example) {
            throw new Error('응답 형식이 올바르지 않습니다.');
        }

        return { definition, example };
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        throw error;
    }
}

/// 단어 저장 함수
function saveWord(word, definition, example) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['recentWords', 'wordCount'], function (result) {
            let recentWords = result.recentWords || [];
            let wordCount = result.wordCount || 0;

            console.log('현재 저장된 단어 수:', wordCount);
            console.log('새로 저장할 단어:', word);

            const newWord = {
                term: word,
                definition,
                example,
                addedDate: new Date().toISOString()
            };

            const existingIndex = recentWords.findIndex(item => item.term === word);
            if (existingIndex !== -1) {
                console.log('이미 존재하는 단어 업데이트');
                recentWords[existingIndex] = newWord;
            } else {
                console.log('새 단어 추가');
                recentWords.unshift(newWord);
                wordCount++;
            }

            chrome.storage.sync.set({ recentWords, wordCount }, function () {
                if (chrome.runtime.lastError) {
                    console.error('저장 중 오류 발생:', chrome.runtime.lastError);
                    reject(new Error('단어 저장 중 오류가 발생했습니다.'));
                } else {
                    console.log('단어 저장 완료. 현재 단어 수:', wordCount);
                    resolve({ recentWords, wordCount });
                }
            });
        });
    });
}

// 단어 삭제 함수
function deleteWord(wordToDelete) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['recentWords', 'wordCount'], function (result) {
            let recentWords = result.recentWords || [];
            let wordCount = result.wordCount || 0;

            const index = recentWords.findIndex(word => word.term === wordToDelete);
            if (index !== -1) {
                recentWords.splice(index, 1);
                wordCount = Math.max(0, wordCount - 1);

                chrome.storage.sync.set({ recentWords, wordCount }, function () {
                    resolve({ recentWords, wordCount });
                });
            } else {
                reject(new Error('삭제할 단어를 찾을 수 없습니다.'));
            }
        });
    });
}

// 최근 저장한 단어 목록 가져오기
function getRecentWords() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['recentWords'], function (result) {
            let recentWords = result.recentWords || [];
            recentWords.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
            console.log('getRecentWords 함수 내부 - 정렬된 단어 목록:', recentWords);
            resolve(recentWords);
        });
    });
}

// 저장된 단어 수 가져오기
function getWordCount() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['recentWords'], function (result) {
            let recentWords = result.recentWords || [];
            console.log('getWordCount 함수 내부 - 단어 목록:', recentWords);
            resolve(recentWords.length);
        });
    });
}

// 프리미엄 남은 기간 가져오기
function getPremiumDays() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['premiumDays'], function (result) {
            resolve(result.premiumDays || 0);
        });
    });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('메시지 수신:', request);

    if (request.action === 'getDefinition') {
        console.log('getDefinition 요청 처리 시작');
        callGeminiAPI(request.word, request.context)
            .then(result => {
                console.log('Gemini API 결과:', result);
                sendResponse({
                    success: true,
                    word: request.word,
                    definition: result.definition,
                    example: result.example
                });
            })
            .catch(error => {
                console.error('Gemini API 오류:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'saveWord') {
        console.log('saveWord 요청 처리 시작');
        saveWord(request.word, request.definition, request.example)
            .then(result => {
                console.log('단어 저장 결과:', result);
                sendResponse({ success: true, result });
            })
            .catch(error => {
                console.error('단어 저장 오류:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'deleteWord') {
        deleteWord(request.word)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'getRecentWords') {
        getRecentWords()
            .then(words => sendResponse({ success: true, words }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'getWordCount') {
        getWordCount()
            .then(count => sendResponse({ success: true, count }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    } else if (request.action === 'getPremiumDays') {
        getPremiumDays()
            .then(days => sendResponse({ success: true, days }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    }
});

// API 키 변경 감지
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.apiKey) {
        API_KEY = changes.apiKey.newValue;
    }
});