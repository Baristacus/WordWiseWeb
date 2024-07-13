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
        createWordList();
        document.getElementById('word-info').style.display = 'none';
    });
}

function checkLastSavedWord() {
    chrome.storage.local.get('lastSavedWord', function (result) {
        if (result.lastSavedWord) {
            const { word, time } = result.lastSavedWord;
            const now = new Date().getTime();
            // 최근 5초 이내에 저장된 단어에 대해서만 토스트 메시지 표시
            if (now - time < 5000) {
                showToast(`단어 "${word}"가 저장되었습니다.`);
                createWordList(); // 단어 목록 새로고침
            }
            // 확인 후 lastSavedWord 정보 삭제
            chrome.storage.local.remove('lastSavedWord');
        }
    });
}

// 팝업이 열릴 때마다 최근 저장된 단어 확인
document.addEventListener('DOMContentLoaded', function () {
    createWordList();
    checkLastSavedWord();
});

function showToast(message) {
    const toast = document.getElementById('toast-message');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // 3초 후 메시지 사라짐
}