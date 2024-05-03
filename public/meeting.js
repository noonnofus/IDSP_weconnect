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

const myFace = document.getElementById("myFace");
const muteBtn =  document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
const getCamera = async () => {
  try {
    const device = await navigator.mediaDevices.enumerateDevices();
    const cameras = device.filter((device) => device.kind === "videoinput");
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      camerasSelect.appendChild(option);
    });
  } catch(e) {
    console.log(e);
  }
}
getCamera();
const getMedia = async () => {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    myFace.srcObject = myStream;
  } catch(e) {
    console.log(e);
  }
}
getMedia();
const handleMuteClick = () => {
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
 if(!muted) {
  muteBtn.innerText = "Unmute";
  muted = true;
 } else {
  muteBtn.innerText = "Mute";
  muted = false;
 }
}

const handleCameraClick = () => {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  }); 
  if(cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)


const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;



const handleMessageSubmit = (event) => {
  event.preventDefault();
  const input = room.querySelector("input");
  const value = input.value;
  socket.emit("new_message", input.value,roomName, () => {
    addMessage(`You: ${value}`, input);
  input.value = "";
  });
  
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerHTML = `Room: ${roomName}`;
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name") ;
  msgForm.addEventListener("submit", handleMessageSubmit);

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

socket.on("new_message", (msg) => { addMessage(msg) } );