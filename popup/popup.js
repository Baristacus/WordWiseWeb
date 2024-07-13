function createWordList() {
    chrome.storage.local.get(null, function (items) {
        const wordList = document.getElementById('word-list');
        wordList.innerHTML = ''; // Clear existing list

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
            wordText.addEventListener('click', function () {
                const wordInfo = document.getElementById('word-info');
                // Convert markdown to HTML and sanitize
                const htmlContent = DOMPurify.sanitize(marked.parse(items[word].meaning));
                wordInfo.innerHTML = htmlContent;
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '삭제';
            deleteBtn.addEventListener('click', function () {
                deleteWord(word);
            });

            wordItem.appendChild(wordText);
            wordItem.appendChild(deleteBtn);
            wordList.appendChild(wordItem);
        });
    });
}

function deleteWord(word) {
    chrome.storage.local.remove(word, function () {
        console.log('단어가 삭제되었습니다:', word);
        createWordList(); // Refresh the word list
        document.getElementById('word-info').textContent = ''; // Clear word info
    });
}

document.addEventListener('DOMContentLoaded', function () {
    createWordList();
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "WORD_SAVED") {
        createWordList(); // Refresh the word list when a new word is saved
    }
});