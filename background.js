// IndexedDB 초기화
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('WordWiseWebDB', 1);

        request.onerror = (event) => {
            console.error('IndexedDB 열기 실패:', event.target.error);
            reject('IndexedDB 열기 실패');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB 연결 성공');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const objectStore = db.createObjectStore('words', { keyPath: 'term' });
            objectStore.createIndex('addedDate', 'addedDate', { unique: false });
            console.log('IndexedDB 스키마 업그레이드 완료');
        };
    });
}

// Gemini API 키와 URL
let API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// API 키 확인 함수
async function checkApiKey() {
    if (!API_KEY) {
        await loadApiKey();
    }
    return API_KEY !== '';
}

// 저장된 API 키 가져오기
async function loadApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['apiKey'], result => {
            API_KEY = result.apiKey || '';
            console.log(API_KEY ? 'API 키 로드됨' : '저장된 API 키가 없음');
            resolve(API_KEY);
        });
    });
}

// 초기화 함수
async function initialize() {
    try {
        await initDB();
        await loadApiKey();
        console.log('초기화 완료');
    } catch (error) {
        console.error('초기화 실패:', error);
    }
}

// 확장 프로그램 설치 또는 업데이트 시 초기화
chrome.runtime.onInstalled.addListener(initialize);

// 초기 API 키 로드
loadApiKey();

// Gemini API를 사용하여 단어 의미 가져오기
async function callGeminiAPI(word, context) {
    if (!API_KEY) {
        await loadApiKey();
    }

    if (!API_KEY) {
        throw new Error('등록된 API_KEY가 없습니다. 옵션 페이지에서 API 키를 설정해주세요.');
    }

    const prompt = `
        너는 백과사전이야. 아래의 텍스트와 텍스트가 포함된 문맥을 보고 텍스트의 사전적 의미와 예문을 알려줘.

        '텍스트': ${word}
        '문맥': ${context}

        '텍스트'의 의미가 여러 개라면 '문맥'의 맥락을 파악해서 '문맥' 속에 사용된 의미로 대답해줘.
        그리고 의미에 '텍스트'를 직접 언급하거나 '문맥'에서 사용된 표현을 그대로 사용하면 안 돼.

        예문은 '텍스트'를 활용한 문장을 하나 작성해줘.
        '텍스트'가 반드시 포함된 문장이어야 하며, 의미를 정확하게 반영하는 예문이어야 해.
        예문에서 '텍스트'가 빠지지 않도록 유의해줘. 예문은 '텍스트'가 들어간 문장이어야 하며, '텍스트'가 없는 예문은 안 돼.
        '의미'에서 작성된 의미와 일치하는 예문을 작성해줘.

        응답 형식은 아래와 같이 해줘:
        의미: ('텍스트'의 의미)
        예문: (작성된 예문)

        의미는 반드시 정확한 사전적 의미를 가져야해.
        의미는 반드시 명사 또는 ~음, ~함 등의 명사형 어미로 끝나야 하고 절대 NEVER ~이다., ~하다. 등 서술형으로 끝나면 안 돼.
        예문은 ~입니다., ~합니다. 등의 존댓말이 아니라 ~다., ~이다. 등의 평서형 어미로 끝나도록 답변해줘.
        그리고 응답에 마크다운이나 HTML코드를 절대 포함하지 마.

        반드시 응답 형식을 지켜서 답변해야 해.
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
            return callGeminiAPI(word, context);
        }

        return { definition, example };
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        throw error;
    }
}

// 단어 저장 함수
async function saveWord(word, definition, example) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        // 이전에 저장된 단어인지 확인
        const getRequest = store.get(word);

        getRequest.onsuccess = function(event) {
            let newWord;
            if (event.target.result) {
                // 기존 단어가 있으면 카운트를 증가시키고 날짜 갱신
                newWord = event.target.result;
                newWord.count = (newWord.count || 1) + 1;
                newWord.addedDate = new Date().toISOString();

                // 새 정의와 예문으로 업데이트 - 추후 동음이의어 등 구분 예정
                if (definition) newWord.definition = definition;
                if (example) newWord.example = example;
            } else {
                // 새로운 단어면 추가
                newWord = {
                    term: word,
                    definition: definition,
                    example: example,
                    addedDate: new Date().toISOString(),
                    count: 1
                };
            }

            // 새 데이터 저장
            const putRequest = store.put(newWord)

            putRequest.onerror = function(evnet) {
                console.error('단어 저장 중 오류 발생:', event.target.error);
                reject(new Error('단어 저장 중 오류가 발생했습니다.'));
            };

            putRequest.onsuccess = function(event) {
                console.log('단어가 성공적으로 저장되었습니다:', word);
            resolve(newWord);
            };
        };

        getRequest.onerror = (event) => {
            console.error('단어 조회 중 오류 발생:', event.target.error);
            reject(new Error('단어 조회 중 오류가 발생했습니다.'));
        };
    });
}

// 단어 삭제 함수
async function deleteWord(wordToDelete) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const request = store.delete(wordToDelete);

        request.onerror = (event) => {
            console.error('단어 삭제 중 오류 발생:', event.target.error);
            reject(new Error('단어 삭제 중 오류가 발생했습니다.'));
        };

        request.onsuccess = (event) => {
            console.log('단어가 성공적으로 삭제되었습니다:', wordToDelete);
            resolve();
        };
    });
}

// 단어 목록 가져오기 함수
async function getRecentWords(limit = 100) {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const index = store.index('addedDate');

        const request = index.openCursor(null, 'prev');
        const words = [];

        request.onerror = (event) => {
            reject(new Error('단어 목록을 가져오는 중 오류가 발생했습니다.'));
        };

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && words.length < limit) {
                words.push(cursor.value);
                cursor.continue();
            } else {
                resolve(words);
            }
        };
    });
}


// 단어 수 가져오기 함수
async function getWordCount() {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const countRequest = store.count();

        countRequest.onerror = (event) => {
            console.error('단어 수 가져오기 중 오류 발생:', event.target.error);
            reject(new Error('단어 수를 가져오는 중 오류가 발생했습니다.'));
        };

        countRequest.onsuccess = (event) => {
            const count = event.target.result;
            console.log('현재 저장된 단어 수:', count);
            resolve(count);
        };
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

// IndexedDB 크기 확인 함수
async function getDatabaseSize() {
    if (!db) {
        await initDB();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const request = store.getAll();

        request.onerror = (event) => {
            console.error('DB 크기 확인 중 오류 발생:', event.target.error);
            reject(new Error('DB 크기를 확인하는 중 오류가 발생했습니다.'));
        };

        request.onsuccess = (event) => {
            const data = event.target.result;
            const size = new Blob([JSON.stringify(data)]).size;
            resolve(size);
        };
    });
}

// 크롬 확장 프로그램의 저장소 제한 (5MB)
const STORAGE_LIMIT = 5 * 1024 * 1024;

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('메시지 수신:', request);

    switch (request.action) {
        case 'getRecentWords':
            getRecentWords().then(words => {
                sendResponse({ success: true, words: words });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // 비동기 응답을 위해 true 반환

        case 'getDefinition':
            callGeminiAPI(request.word, request.context)
                .then(result => {
                    sendResponse({
                        success: true,
                        word: request.word,
                        definition: result.definition,
                        example: result.example
                    });
                })
                .catch(error => {
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });
            return true;

        case 'saveWord':
            saveWord(request.word, request.definition, request.example)
                .then(result => {
                    sendResponse({ success: true, result });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case 'deleteWord':
            deleteWord(request.word)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case 'getWordCount':
            getWordCount()
                .then(count => {
                    console.log('단어 수 요청에 대한 응답:', count);
                    sendResponse({ success: true, count: count });
                })
                .catch(error => {
                    console.error('단어 수 가져오기 오류:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case 'getPremiumDays':
            getPremiumDays()
                .then(days => {
                    sendResponse({ success: true, days });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case 'getDatabaseSize':
            getDatabaseSize()
                .then(size => {
                    const usagePercentage = (size / STORAGE_LIMIT) * 100;
                    sendResponse({
                        success: true,
                        size: size,
                        usagePercentage: usagePercentage.toFixed(2)
                    });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case 'checkApiKey':
            checkApiKey()
                .then(isValid => {
                    if (isValid) {
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'API 키를 먼저 등록해 주세요.' });
                    }
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        default:
            sendResponse({ success: false, error: '알 수 없는 액션' });
            return false;
    }
});

// API 키 변경 감지
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.apiKey) {
        API_KEY = changes.apiKey.newValue;
        console.log('API 키가 업데이트됨');
    }
});