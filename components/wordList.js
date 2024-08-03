// 복잡한 데이터 처리와 다양한 기능을 포함하는 컴포넌트
// 전체 단어 목록을 관리하고 조작하는 기능
// 여러 단어 항목들을 종합적으로 다루며, 목록 전체에 대한 작업을 수행
// 데이터 관리, 정렬, 필터링, 검색 등의 기능

// 단어 목록 저장소
let wordList = [];

// 단어 목록 로드 함수
function loadWords() {
    getRecentWords().then(words => {
        wordList = words;
        renderWordList();
    }).catch(error => {
        console.error('단어 목록을 불러오는데 실패했습니다:', error);
    });
}

// 단어 삭제 함수
function handleDeleteWord(term) {
    deleteWord(term).then(() => {
        wordList = wordList.filter(word => word.term !== term);
        renderWordList();
    }).catch(error => {
        console.error('단어 삭제에 실패했습니다:', error);
    });
}

// 단어 목록 렌더링 함수
function renderWordList() {
    const wordListContainer = document.getElementById('wordListContainer');
    wordListContainer.innerHTML = '';
    wordList.forEach((word, index) => {
        const wordItem = createWordItem(word, index);
        wordListContainer.appendChild(wordItem);
    });
}

// 단어 아이템 생성 함수
function createWordItem(word, index) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    accordionItem.innerHTML = `
        <h2 class="accordion-header d-flex align-items-center" id="heading${index}">
            <button class="accordion-button collapsed flex-grow-1" type="button" data-bs-toggle="collapse" 
                    data-bs-target="#collapse${index}" aria-expanded="false" 
                    aria-controls="collapse${index}">
                ${word.term} 
                <small class="text-muted ms-2">(${formatDate(word.addedDate)})</small>
            </button>
            <button class="btn btn-link text-danger delete-word" data-word="${word.term}">
                <i class="bi bi-trash"></i>
            </button>
        </h2>
        <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#recentWordsAccordion">
            <div class="accordion-body">
                <p><strong>의미:</strong> ${word.definition}</p>
                <p><strong>예문:</strong> ${word.example}</p>
            </div>
        </div>
    `;

    // 삭제 버튼에 이벤트 리스너 추가
    const deleteBtn = accordionItem.querySelector('.delete-word');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 아코디언 토글 방지
        handleDeleteWord(word.term);
    });

    return accordionItem;
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 초기화
loadWords();
