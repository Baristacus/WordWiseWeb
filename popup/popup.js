function createWordList() {
    chrome.storage.local.get(null, function (items) {
        const wordList = document.getElementById('word-list');
        wordList.innerHTML = '';

        const sortedWords = Object.keys(items).sort((a, b) => {
            return new Date(items[b].date) - new Date(items[a].date);
        });

        sortedWords.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            const savedDate = new Date(items[word].date).toLocaleDateString();
            wordText.textContent = `${word} (${savedDate})`;

            wordItem.appendChild(wordText);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '삭제';
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteWord(word);
            });

            wordItem.appendChild(deleteBtn);

            wordItem.addEventListener('click', function () {
                toggleWordInfo(wordItem, items[word].meaning);
            });

            wordList.appendChild(wordItem);
        });
    });
}

function toggleWordInfo(wordItem, meaning) {
    const wordInfo = document.getElementById('word-info');

    if (wordItem.classList.contains('active')) {
        wordItem.classList.remove('active');
        wordInfo.classList.remove('active');
        setTimeout(() => {
            wordInfo.style.display = 'none';
        }, 300);
    } else {
        document.querySelectorAll('.word-item.active').forEach(item => {
            item.classList.remove('active');
        });
        wordItem.classList.add('active');
        wordInfo.innerHTML = DOMPurify.sanitize(marked.parse(meaning));
        wordInfo.style.display = 'block';
        setTimeout(() => {
            wordInfo.classList.add('active');
        }, 10);
    }
}

function deleteWord(word) {
    chrome.storage.local.remove(word, function () {
        console.log('단어가 삭제되었습니다:', word);
        showToast(`단어 "${word}"가 삭제되었습니다.`);
        createWordList();
        document.getElementById('word-info').style.display = 'none';

        // 최근 삭제된 단어 정보 저장
        chrome.storage.local.set({ lastDeletedWord: { word: word, time: new Date().getTime() } }, function () {
            console.log('Last deleted word info stored');
        });
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