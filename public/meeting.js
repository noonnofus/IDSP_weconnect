





// mdedia stream
const myFace = document.getElementById("myFace");
const muteBtn =  document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;


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
getCamera();
//getMedia(); 시그널링 끝나고 실행시키자

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

camerasSelect.addEventListener('change', async () => {
  const selectedCamera = camerasSelect.value;
  const constraints = {
    audio: true,
    video: { deviceId: { exact: selectedCamera } }
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(constraints);
    myFace.srcObject = myStream;
  } catch (error) {
    console.error('Error selecting camera:', error);
  }
});

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


//video welcome form 
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

let roomName;

welcomeForm = welcome.querySelector("form");

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia(); 
  makeConnection();
}

const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  console.log(`welcomeForm: ${input.value}`);
  await initCall();
  socket.emit("join_room", (input.value));
  roomName = input.value; 
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//socket code
socket.on("video_welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  console.log("someone joined");
  // console.log(offer);
  myPeerConnection.setLocalDescription(offer);
  console.log("offer sent");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log("Received offer:", offer);
  try {
    await myPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
  } catch (error) {
    console.error("Error handling offer:", error);
  }
});

socket.on("answer", async (answer) => {
  console.log("Received answer:", answer);
  try {
    await myPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error("Error handling answer:", error);
  }
});

socket.on("ice", (ice) => {
  console.log("ice received");
  myPeerConnection.addIceCandidate(ice);
});

//RTC code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      // STUN/TURN 서버 구성 예시
      {
        urls: "stun:stun.l.google.com:19302",
      },
      // 추가적인 STUN/TURN 서버를 구성할 수 있습니다.
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddTrack); // 'addstream' 대신 'track' 사용

  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}


const handleIce = (data) => {
  console.log("got ice candidate : ", data);
  console.log(data);
  console.log("sent ice");
  socket.emit("ice", data.candidate, roomName);
};

const handleAddTrack = (event) => {
  const peerFace = document.getElementById("peerFace");
  if (peerFace.srcObject !== event.streams[0]) {
    peerFace.srcObject = event.streams[0];
    console.log("Track event: received remote stream");
  }
};


// chat 
const cWelcome = document.getElementById("c-welcome");
const form = cWelcome.querySelector("form");
const room = document.getElementById("room");
const input = room.querySelector("input");

room.hidden = true;

let c_roomName;
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
  h3.innerHTML = `Room: ${c_roomName}`;
  const form = room.querySelector("form");
  form.addEventListener("submit", handleMessageSubmit);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = await getUserSession()
  console.log('session: ', user);
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

async function getUserSession() {
  const res = await fetch('/getUserSession', {
      method: 'POST',
  });
  const data = await res.json();
  return data;
}

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