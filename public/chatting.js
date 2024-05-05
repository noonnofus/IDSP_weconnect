// chat "/chat"

// const socket = io();

// const cWelcome = document.getElementById("c-welcome");
// const form = cWelcome.querySelector("form");
const room = document.getElementById("room");
const input = room.querySelector("input");

// room.hidden = true;

const handleMessageSubmit = async (event) => {
  event.preventDefault();
  const user = await getUserSession()
  const userData = JSON.parse(user.data);
  const input = room.querySelector("input");
  
  const getRoom = socket.emit("get_room", (res) => {
    if (res.success) {
      socket.emit("new_message", input.value, getRoom.data, userData.username, () => {
        addMessage(`${userData.username}: ${input.value}`, input);
      });
    }
  })

}

document.querySelector('#msg').addEventListener('submit', (event) => {
  handleMessageSubmit(event);
})

// function showRoom() {
//   cWelcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerHTML = `Room: ${c_roomName}`;
//   // const form = room.querySelector("form");
//   form.addEventListener("submit", handleMessageSubmit);
// }

// form.addEventListener("submit", async (event) => {
//   event.preventDefault();
//   const user = await getUserSession()
//   console.log('session: ', user);
//   const userData = JSON.parse(user.data);
//   console.log('session: ', userData);
//   const input = form.querySelector("input");
//   socket.emit("enter_room", input.value, userData, showRoom);
//   roomName = input.value;
//   input.value = "";
// });

const addMessage = (msg) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.appendChild(li);

  input.value = "";
}

socket.on("welcome", () => {
  console.log("emit welcome");
  addMessage("Someone joined!");
})

socket.on("bye", () => {
  addMessage("Someone left!");
});

async function getUserSession() {
  const res = await fetch('/getUserSession', {
      method: 'POST',
  });
  const data = await res.json();
  return data;
}

// socket.on("new_message", (msg, username) => { 
//   addMessage(`${username}: ${msg}`)
// });

async function getUserSession() {
  const res = await fetch('/getUserSession', {
      method: 'POST',
  });
  const data = await res.json();
  return data;
}

async function storeRoomInDb(sender, receiver) {
  const res = await fetch('/storeInDb', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender, receiver }),
  })
  const result = await res.json();
  return result.data;
}