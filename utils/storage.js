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
            const isDuplicate = recentWords.some(item => item.term === word);
            if (!isDuplicate) {
                recentWords.unshift(newWord);
                if (recentWords.length > 5) recentWords.pop();
                wordCount++;

                chrome.storage.sync.set({ recentWords, wordCount }, function () {
                    resolve({ recentWords, wordCount });
                });
            } else {
                reject(new Error('이미 저장된 단어입니다.'));
            }
        });
    });
};

// 최근 저장한 단어 목록 가져오기
window.getRecentWords = function () {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['recentWords'], function (result) {
            resolve(result.recentWords || []);
        });
    });
};

// 저장된 단어 수 가져오기
window.getWordCount = function () {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['wordCount'], function (result) {
            resolve(result.wordCount || 0);
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