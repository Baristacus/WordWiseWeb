function createWordList() {
    chrome.storage.local.get(null, function (items) {
        const wordList = document.getElementById('word-list');
        wordList.innerHTML = '';

        // 실제 단어 데이터만 필터링
        const validWords = Object.keys(items).filter(key =>
            items[key] && typeof items[key] === 'object' && items[key].meaning && items[key].date
        );

        const sortedWords = validWords.sort((a, b) => {
            return new Date(items[b].date) - new Date(items[a].date);
        });

        sortedWords.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const wordHeader = document.createElement('div');
            wordHeader.className = 'word-header';

            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            const savedDate = new Date(items[word].date).toLocaleDateString();
            wordText.textContent = `${word} (${savedDate})`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '삭제';
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteWord(word);
            });

            wordHeader.appendChild(wordText);
            wordHeader.appendChild(deleteBtn);

            const wordMeaning = document.createElement('div');
            wordMeaning.className = 'word-meaning';

            try {
                console.log('Word meaning:', items[word].meaning); // 디버깅용 로그
                const parsedMeaning = marked.parse(items[word].meaning);
                wordMeaning.innerHTML = DOMPurify.sanitize(parsedMeaning);
            } catch (error) {
                console.error('Error parsing word meaning:', error);
                wordMeaning.textContent = '의미를 표시하는 중 오류가 발생했습니다.';
            }

            wordItem.appendChild(wordHeader);
            wordItem.appendChild(wordMeaning);

            wordHeader.addEventListener('click', function () {
                toggleWordMeaning(wordMeaning);
            });

            wordList.appendChild(wordItem);
        });

        // 임시 데이터 정리
        cleanupTemporaryData();
    });
}

function cleanupTemporaryData() {
    chrome.storage.local.get(null, function (items) {
        const keysToRemove = Object.keys(items).filter(key =>
            key === 'lastDeletedWord' || key === 'lastSavedWord' ||
            (items[key] && typeof items[key] !== 'object')
        );

        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, function () {
                console.log('Temporary data cleaned up:', keysToRemove);
            });
        }
    });
}

function toggleWordMeaning(meaningElement) {
    const allMeanings = document.querySelectorAll('.word-meaning');
    allMeanings.forEach(el => {
        if (el !== meaningElement) {
            el.classList.remove('active');
        }
    });
    meaningElement.classList.toggle('active');
}

function deleteWord(word) {
    chrome.storage.local.remove(word, function () {
        console.log('단어가 삭제되었습니다:', word);
        showToast(`단어 "${word}"가 삭제되었습니다.`);
        createWordList(); // 목록 새로고침
    });
}

function checkLastWordAction() {
    chrome.storage.local.get(['lastSavedWord', 'lastDeletedWord'], function (result) {
        const now = new Date().getTime();

        if (result.lastSavedWord && now - result.lastSavedWord.time < 5000) {
            showToast(`단어 "${result.lastSavedWord.word}"가 저장되었습니다.`);
            chrome.storage.local.remove('lastSavedWord');
        } else if (result.lastDeletedWord && now - result.lastDeletedWord.time < 5000) {
            showToast(`단어 "${result.lastDeletedWord.word}"가 삭제되었습니다.`);
            chrome.storage.local.remove('lastDeletedWord');
        }

        createWordList(); // 단어 목록 새로고침
    });
}

// 팝업이 열릴 때마다 최근 단어 액션 확인
document.addEventListener('DOMContentLoaded', function () {
    checkLastWordAction();
});

function showToast(message) {
    const toast = document.getElementById('toast-message');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // 3초 후 메시지 사라짐
}