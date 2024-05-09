const room = document.getElementById("room");
const input = room.querySelector("input");
const chatSection = document.querySelector('.chat-section');
const sendbtn = room.querySelector('img');
let totalHeightBefore = chatSection.scrollHeight; // For scrolling.
let isFetchingMessages = false;

// get sender and receiver's id from url parameter.
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const sender = urlParams.get('sender');
const receiver = urlParams.get('receiver');
let count = 0;
let allMsg;

async function enterRoom() {
  const roomname = await getUserByUserId(sender, receiver);
  allMsg = await getMsgFromDb(roomname);
  
  socket.emit("enter_room", roomname);
  if (allMsg !== null) {
    count = allMsg.length; // 44
    for (let i = 0; i < 20; i++) {
      const message = allMsg[count - 1].message;
      await addMessage(message, allMsg[count - 1].senderId);
      chatSection.scrollTop = chatSection.scrollHeight;
      count--;
      if(count === 0) return;
    }
  }
}

chatSection.addEventListener('scroll', async () => {
  if (!isFetchingMessages && chatSection.scrollTop < 10 && count !== 0) {
    isFetchingMessages = true;

    const initialScrollHeight = chatSection.scrollHeight;

    let i = 0;
    for (i; i < 20; i++) {
      const message = allMsg[count - 1].message;
      await addMessage(message, allMsg[count - 1].senderId);
      count --;
      if (count === 0) {
        isScrolling = false;
        return;
      }
    }
    const finalScrollHeight = chatSection.scrollHeight;
    const scrollDifference = finalScrollHeight - initialScrollHeight;

    if (scrollDifference > 0) {
      chatSection.scrollTop = scrollDifference;
    }

    isFetchingMessages = false;
  }
})

enterRoom();

function prepareScroll() {
  window.setTimeout(scrollUl(), 50);
}

function scrollUl() {
  chatSection.scrollTop = chatSection.scrollHeight;
}

const handleMessageSubmit = async (event) => {
  event.preventDefault();
  const user = await getUserSession()
  const userData = JSON.parse(user.data);
  const input = room.querySelector("input");
  const roomId = await getUserByUserId(sender, receiver);
  socket.emit("new_message", input.value, roomId, userData, async () => {
    storeMsgInDb(roomId, userData.userId, input.value);
    await addMessageForInput(`${input.value}`, userData.userId);
    prepareScroll();
    console.log('emit hit')
  });
}

socket.on("new_message", async (msg, sender) => {
  await addMessageForInput(`${msg}`, sender);
  prepareScroll();
  console.log("on hit");
});

document.querySelector('#msg').addEventListener('submit', async (event) => {
  handleMessageSubmit(event);
})

sendbtn.addEventListener("click", async (event) => {
  handleMessageSubmit(event);
})

const addMessageForInput = async (msg, receiver) => {
  const user = await getUserSession()
  const currentUser = JSON.parse(user.data);
  const isSender = receiver === currentUser.userId;
  const div = document.querySelector(".chat-section");
  const chatMsg = document.createElement("div")
  const p = document.createElement("p");
  p.innerHTML = msg;
  chatMsg.appendChild(p);
  div.appendChild(chatMsg);
  if (isSender === true) {
    p.classList.add("p-2", "rounded-pill");
    chatMsg.classList.add("col-auto", "chat-sender");
  } else {
    p.classList.add("p-2", "rounded-start");
    chatMsg.classList.add("col-auto", "chat-receiver");
  }
  input.value = "";
}

const addMessage = async (msg, receiver) => {
  const user = await getUserSession()
  const currentUser = JSON.parse(user.data);
  const isSender = receiver === currentUser.userId;
  const div = document.querySelector(".chat-section");
  const chatMsg = document.createElement("div")
  const p = document.createElement("p");
  p.innerHTML = msg;
  chatMsg.appendChild(p);
  div.prepend(chatMsg);
  if (isSender === true) {
    p.classList.add("p-2", "rounded-pill");
    chatMsg.classList.add("col-auto", "chat-sender");
  } else {
    p.classList.add("p-2", "rounded-start");
    chatMsg.classList.add("col-auto", "chat-receiver");
  }
  input.value = "";
}

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

async function getUserByUserId(sender, receiver) {
  const res = await fetch(`/getUserBySenderReceiver?sender=${sender}&receiver=${receiver}`, {
    method: "GET"
})
  const result = await res.json();
  return result.data;
}

async function storeMsgInDb(roomId, senderId, msg) {
  const res = await fetch(`/storeMsgInDb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomId, senderId, msg }),
})
  const result = await res.json();
  return result.data;
}

async function getMsgFromDb(roomname) {
  const res = await fetch(`/getMsgFromDb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomname }),
})
const result = await res.json();

if (res.success !== false) {
  return result.data;
}
}