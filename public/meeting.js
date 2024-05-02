/*const socket = new WebSocket(`ws://${window.location.host}/meeting`);

socket.addEventListener("open", () => { 
    console.log("Connected to Server");
})

socket.addEventListener ("message", (message) => {
    console.log("New message: ", message, "from the server");
});

socket.addEventListener("close", () => { 
    console.log("Disconnected from browser"); 
});
*/

const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;


function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerHTML = `Room: ${roomName}`;
  const form = room.querySelector("form");
  form.addEventListener("submit", (event) => { });
  
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom );
  roomName = input.value;
  input.value = "";
});

const addMessage = (msg) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");

  li.innerText =  msg; 
  ul.appendChild(li);
}

socket.on("welcome", () => {
  console.log("emit welcome");
  addMessage("Someone joined!");  
})

socket.on("bye", () => {
  addMessage("Someone left!");
});