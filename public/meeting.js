const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
const input = room.querySelector("input");

room.hidden = true;

let roomName;

const handleMessageSubmit = async (event) => {
  event.preventDefault();
  const user = await getUserSession()
  const userData = JSON.parse(user.data);
  console.log('session: ', userData);
  const input = room.querySelector("input");
  socket.emit("new_message", input.value, roomName, userData.username, () => {
    addMessage(`${userData.username}: ${input.value}`, input);
  });
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerHTML = `Room: ${roomName}`;
  const form = room.querySelector("form");
  form.addEventListener("submit", handleMessageSubmit);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = await getUserSession()
  const userData = JSON.parse(user.data);
  console.log('session: ', userData);
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, userData, showRoom);
  roomName = input.value;
  input.value = "";
});

const addMessage = (msg) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  input.value = "";

  li.innerText = msg;
  ul.appendChild(li);
}

socket.on("welcome", () => {
  console.log("emit welcome");
  addMessage("Someone joined!");
})

socket.on("bye", () => {
  addMessage("Someone left!");
});

socket.on("new_message", (msg, username) => { 
  addMessage(`${username}: ${msg}`) 
});

async function getUserSession() {
  const res = await fetch('/getUserSession', {
      method: 'POST',
  });
  const data = await res.json();
  return data;
}