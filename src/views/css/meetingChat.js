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