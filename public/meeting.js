const socket = new WebSocket(`ws://${window.location.host}/meeting`);

socket.addEventListener("open", () => { 
    console.log("Connected to Server");
})

socket.addEventListener ("message", (message) => {
    console.log("New message: ", message, "from the server");
});

socket.addEventListener("close", () => { 
    console.log("Disconnected from browser"); 
});


// socket.onopen = function(event) {
//   console.log("WebSocket is open now.");
//   //  메시지 보내기 서버에
//   socket.send("Hello, server!");
// }; 

// socket.onmessage = function(event) {
//   console.log("Received:", event.data);
//   // 서버로부터 메시지 받기 !!
// };

// socket.onerror = function(event) {
//   console.error("WebSocket error observed:", event);
// };

// socket.onclose = function(event) {
//   console.log("WebSocket is closed now.");
// };

// document.addEventListener('keydown', function(event) {
//     if (event.key === 'Escape') { // ESC 키를 체크합니다.
//       console.log("ESC key pressed. Closing WebSocket.");
//       socket.close(); // WebSocket 연결을 닫습니다.
//     }
//   });