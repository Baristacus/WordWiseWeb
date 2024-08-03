// Gemini API 키
let API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';


// 저장되어 있는 API 키 가져오기
chrome.storage.sync.get(['apiKey'], result => {
    if (result.apiKey) {
        API_KEY = result.apiKey;
    }
});


// Gemini API를 사용하여 단어 의미 가져오기
window.callGeminiAPI = async function(word, context) {
// async function callGeminiAPI(word, context) {    // js 테스트용 코드
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
                    temperature: 2.0,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            if (response.status === 400) {
                // API 키 오류인지 확인
                const errorData = await response.json();
                if (errorData.error && errorData.error.message.includes('API key not valid')) {
                    throw new Error('API 키가 유효하지 않습니다. API 키를 확인해주세요.');
                }
            }
            throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.candidates[0].content.parts[0].text;

        // 응답을 줄 단위로 분리
        const lines = result.split('\n');
        let definition = '';
        let example = '';

        // 각 줄을 순회하며 의미와 예문 추출
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
};


// // js 테스트용 코드
// const word = "혁신";
// const context = "기술의 발전은 우리 삶에 큰 혁신을 가져왔습니다. 스마트폰의 등장으로 커뮤니케이션 방식이 완전히 바뀌었고, 인공지능의 발전은 다양한 산업 분야에 새로운 가능성을 열어주고 있습니다.";

// callGeminiAPI(word, context)
//     .then(({ definition, example }) => {
//         console.log("의미:", definition);
//         console.log("예문:", example);
//     })
//     .catch(error => {
//         console.error("에러 발생:", error.message);
//     });