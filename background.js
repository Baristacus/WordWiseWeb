// Constants
const DB_NAME = 'WordWiseWebDB';
const STORE_NAME = 'words';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

// Global variables
let db;
let API_KEY = '';

// IndexedDB 초기화
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = event => reject('IndexedDB 열기 실패');
        request.onsuccess = event => {
            db = event.target.result;
            resolve(db);
        };
        request.onupgradeneeded = event => {
            db = event.target.result;
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'term' });
            objectStore.createIndex('addedDate', 'addedDate', { unique: false });
        };
    });
}

// API 키 관련 함수
async function loadApiKey() {
    return new Promise(resolve => {
        chrome.storage.sync.get(['apiKey'], result => {
            API_KEY = result.apiKey || '';
            resolve(API_KEY);
        });
    });
}

async function checkApiKey() {
    if (!API_KEY) await loadApiKey();
    return API_KEY !== '';
}

// 초기화 함수
async function initialize() {
    try {
        await initDB();
        await loadApiKey();
    } catch (error) {
        console.error('초기화 실패:', error);
    }
}

// Gemini API 호출 함수
async function callGeminiAPI(word, context) {
    if (!API_KEY) {
        await loadApiKey();
        if (!API_KEY) throw new Error('등록된 API_KEY가 없습니다. 옵션 페이지에서 API 키를 설정해주세요.');
    }

    const prompt = `
        너는 백과사전이야. 아래의 텍스트와 텍스트가 포함된 문맥을 보고 텍스트의 사전적 의미와 예문을 알려줘.

        '텍스트': ${word}
        '문맥': ${context}

        '텍스트'의 의미가 여러 개라면 '문맥'의 맥락을 파악해서 '문맥' 속에 사용된 의미로 대답해줘.
        그리고 의미에 '텍스트'를 직접 언급하거나 '문맥'에서 사용된 표현을 그대로 사용하면 안 돼.
        '텍스트'의 의미가 20자 넘는다면 요약해서 알려줘. 절대 30자를 넘기면 안 돼.

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
            headers: { 'Content-Type': 'application/json' },
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
            if (line.startsWith('의미:')) definition = line.slice(3).trim();
            else if (line.startsWith('예문:')) example = line.slice(3).trim();
        }

        if (!definition || !example) return callGeminiAPI(word, context);

        return { definition, example };
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        throw error;
    }
}

// 단어 관련 함수
async function getWord(word) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(word);

        request.onerror = () => reject(new Error('단어 조회 중 오류가 발생했습니다.'));
        request.onsuccess = (event) => {
            const wordData = event.target.result;
            if (wordData) {
                resolve(wordData);
            } else {
                reject(new Error('단어를 찾을 수 없습니다.'));
            }
        };
    });
}

async function saveWord(word, definition, example, userMemo) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(word);

        getRequest.onsuccess = function (event) {
            let newWord = event.target.result || {
                term: word,
                count: 0,
                addedDate: new Date().toISOString()
            };

            newWord.count++;
            newWord.definition = definition;
            newWord.example = example;
            newWord.usermemo = userMemo;
            newWord.addedDate = new Date().toISOString();

            const putRequest = store.put(newWord);
            putRequest.onerror = () => reject(new Error('단어 저장 중 오류가 발생했습니다.'));
            putRequest.onsuccess = () => resolve(newWord);
        };

        getRequest.onerror = () => reject(new Error('단어 조회 중 오류가 발생했습니다.'));
    });
}

// 단어 메모 업데이트
async function updateWordMemo(word, memo) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(word);

        getRequest.onsuccess = function (event) {
            const wordData = event.target.result;
            if (wordData) {
                wordData.usermemo = memo;
                const putRequest = store.put(wordData);
                putRequest.onerror = () => reject(new Error('메모 업데이트 중 오류가 발생했습니다.'));
                putRequest.onsuccess = () => resolve(wordData);
            } else {
                reject(new Error('단어를 찾을 수 없습니다.'));
            }
        };

        getRequest.onerror = () => reject(new Error('단어 조회 중 오류가 발생했습니다.'));
    });
}

async function deleteWord(wordToDelete) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(wordToDelete);

        request.onerror = () => reject(new Error('단어 삭제 중 오류가 발생했습니다.'));
        request.onsuccess = () => resolve();
    });
}

async function getRecentWords(limit = 100) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('addedDate');
        const request = index.openCursor(null, 'prev');
        const words = [];

        request.onerror = () => reject(new Error('단어 목록을 가져오는 중 오류가 발생했습니다.'));
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

async function getWordCount() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();

        countRequest.onerror = () => reject(new Error('단어 수를 가져오는 중 오류가 발생했습니다.'));
        countRequest.onsuccess = (event) => resolve(event.target.result);
    });
}

// 기타 함수
function getPremiumDays() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['premiumDays'], result => resolve(result.premiumDays || 0));
    });
}

async function getDatabaseSize() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(new Error('DB 크기를 확인하는 중 오류가 발생했습니다.'));
        request.onsuccess = (event) => {
            const data = event.target.result;
            const size = new Blob([JSON.stringify(data)]).size;
            resolve(size);
        };
    });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        getRecentWords: () => getRecentWords().then(words => ({ success: true, words })),
        getDefinition: () => callGeminiAPI(request.word, request.context).then(result => ({
            success: true,
            word: request.word,
            definition: result.definition,
            example: result.example
        })),
        getWord: () => getWord(request.word).then(word => ({ success: true, word })),
        saveWord: () => saveWord(request.word, request.definition, request.example, request.userMemo).then(result => ({ success: true, result })),
        updateWordMemo: () => updateWordMemo(request.word, request.memo).then(result => ({ success: true, result })),
        deleteWord: () => deleteWord(request.word).then(() => ({ success: true })),
        getWordCount: () => getWordCount().then(count => ({ success: true, count })),
        getPremiumDays: () => getPremiumDays().then(days => ({ success: true, days })),
        getDatabaseSize: () => getDatabaseSize().then(size => ({
            success: true,
            size: size,
            usagePercentage: ((size / STORAGE_LIMIT) * 100).toFixed(2)
        })),
        checkApiKey: () => checkApiKey().then(isValid => ({
            success: isValid,
            error: isValid ? null : 'API 키를 먼저 등록해 주세요.'
        }))
    };

    const action = actions[request.action];
    if (action) {
        action().then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    sendResponse({ success: false, error: '알 수 없는 액션' });
    return false;
});

// API 키 변경 감지
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.apiKey) {
        API_KEY = changes.apiKey.newValue;
    }
});

// 확장 프로그램 설치 또는 업데이트 시 초기화
chrome.runtime.onInstalled.addListener(initialize);

// 초기 API 키 로드
loadApiKey();