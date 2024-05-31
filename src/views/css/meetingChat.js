const chatIcon = document.getElementById("chat_icon");
//const chatIcon = document.getElementById("chat_icon");
const chatModal = new bootstrap.Modal(document.getElementById("chatModal"));

  chatIcon.addEventListener("click", (event) => {  
    event.preventDefault();
    chatModal.toggle();
   });

document.addEventListener('DOMContentLoaded', function () {
    // 'translate-en' ID를 가진 요소를 찾아 클릭 이벤트를 발생시킵니다.
    document.getElementById('translate-en').click();
});


const alignBtn = document.getElementById("alignBtn");
const border = document.getElementsByClassName("face-player-container")[0]; // 첫 번째 요소를 선택

alignBtn.addEventListener("click", (event) => {
    event.preventDefault();
    // toggle 메소드로 클래스를 추가하거나 제거
    border.classList.toggle("face-player-container-align");
});
