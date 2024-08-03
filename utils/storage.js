// 단어 저장 함수
window.saveWord = function (word, definition, example) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['recentWords', 'wordCount'], function (result) {
            let recentWords = result.recentWords || [];
            let wordCount = result.wordCount || 0;

            const newWord = {
                term: word,
                definition,
                example,
                addedDate: new Date().toISOString()
            };

            // 중복 검사
            const existingIndex = recentWords.findIndex(item => item.term === word);
            if (existingIndex !== -1) {
                // 이미 존재하는 단어라면 업데이트
                recentWords[existingIndex] = newWord;
            } else {
                // 새로운 단어라면 배열 앞에 추가
                recentWords.unshift(newWord);
                wordCount++;
            }

            chrome.storage.sync.set({ recentWords, wordCount }, function () {
                resolve({ recentWords, wordCount });
            });
        });
    });
};

// 단어 삭제 함수
window.deleteWord = function (wordToDelete) {
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
};

// 최근 저장한 단어 목록 가져오기
window.getRecentWords = function () {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['recentWords'], function (result) {
            let recentWords = result.recentWords || [];
            // 날짜순으로 정렬 (최신순)
            recentWords.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
            console.log('getRecentWords 함수 내부 - 정렬된 단어 목록:', recentWords); // 디버깅용 로그
            resolve(recentWords);
        });
    });
};

// 저장된 단어 수 가져오기
window.getWordCount = function () {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['recentWords'], function (result) {
            let recentWords = result.recentWords || [];
            console.log('getWordCount 함수 내부 - 단어 목록:', recentWords); // 디버깅용 로그
            resolve(recentWords.length);
        });
    });
};

// 프리미엄 남은 기간 가져오기
window.getPremiumDays = function () {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['premiumDays'], function (result) {
            resolve(result.premiumDays || 0);
        });
    });
};