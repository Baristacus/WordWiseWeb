// 단일 단어 항목(item)에 대한 UI 컴포넌트를 생성하고 관리
// 비교적 단순한 UI 컴포넌트 생성에 중점을 두고, 단어의 표시 방식, 형식, 상호작용 등을 다루는 컴포넌트

// 날짜 포맷팅 함수
window.formatDate = function (dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 단어 아이템 컴포넌트 생성 함수
window.createWordItem = function (word, index) {
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
};