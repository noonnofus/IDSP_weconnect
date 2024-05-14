//const socket = io();
//const { url } = require("inspector");

//const { handleViewsIO } = require("@prisma/migrate/dist/views/handleViewsIO");

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const chat = document.getElementById("chat");
const message = document.getElementById("message");
const leave = document.getElementById("leave");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let userNum = 0;
let audioChunks = [];

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (camera.label === currentCamera.label) {
        option.selected = true;
      }
      camerasSelect.append(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const constraints = {
    audio: true,
    video: deviceId
      ? {
          deviceId: {
            exact: deviceId,
          },
        }
      : { facingMode: "user" },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(constraints);
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
    startRecording(myStream);
  } catch (e) {
    console.log(e);
  }
}

const startRecording = (stream) => {
  try {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(10000);
    
    mediaRecorder.addEventListener("dataavailable", async (event) => {
      const audioChunk = event.data;

      const arrBuffer = await audioChunk.arrayBuffer();

      const uint8Arr = new Uint8Array(arrBuffer);

      // spechToText(audioChunk);
    })
  
    const stopRecording = () => {
      mediaRecorder.stop();
    }
    return stopRecording;
  }
  catch(err) {
    console.error(err);
  }
}

// fetch for google STT api
async function spechToText(chunk) {
  const apiKey = "API_KEY"

  try {
    const formData = new FormData();
    formData.append('audio', chunk);
    const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: "POST",
      body: formData,
    })
    const result = await res.json();
    console.log('from api: ', result);
  }
  catch(err) {
    console.error(err);
  }
}

muteBtn.addEventListener("click", () => {
  myStream
    .getAudioTracks()
    .forEach((audio) => (audio.enabled = !audio.enabled));
  const icon = muteBtn.querySelector("i");
  if (muted) {
    muted = false;
    // muteBtn.innerText = "Mute";
    icon.classList.replace("bi-mic-mute-fill", "bi-mic-fill");
  } else {
    muted = true;
    icon.classList.replace("bi-mic-fill", "bi-mic-mute-fill");
  }
});

cameraBtn.addEventListener("click", () => {
  myStream
    .getVideoTracks()
    .forEach((video) => (video.enabled = !video.enabled));
  const icon = cameraBtn.querySelector("i");
  if (cameraOff) {
    cameraOff = false;
    // cameraBtn.innerText = "Turn Camera Off";
    icon.classList.replace("bi-camera-video-off-fill", "bi-camera-video-fill");
  } else {
    cameraOff = true;
    // cameraBtn.innerText = "Turn Camera On";
    icon.classList.replace("bi-camera-video-fill", "bi-camera-video-off-fill");
  }
});

camerasSelect.addEventListener("input", async () => {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
    myStream
      .getAudioTracks()
      .forEach((audio) => (audio.enabled = !audio.enabled));
  }
});

message.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = message.querySelector("input");
  const li = document.createElement("li");
  li.innerText = input.value;
  li.classList.add("list-group-item", "list-group-item-primary", "text-end");
  chat.append(li);
  if (myDataChannel) {
    myDataChannel.send(input.value);
  }
  input.value = "";
});

leave.addEventListener("click", () => {
  socket.emit("left_room", roomName, () => {
    myDataChannel = undefined;
    myStream = undefined;
    myFace.srcObject = myStream;
    call.hidden = true;
    welcome.hidden = false;
    muted = false;
    cameraOff = false;
    camerasSelect.innerHTML = "";
    muteBtn
      .querySelector("i")
      .classList.replace("bi-mic-mute-fill", "bi-mic-fill");
    cameraBtn
      .querySelector("i")
      .classList.replace("bi-camera-video-off-fill", "bi-camera-video-fill");
    chat.innerHTML = "";
    message.querySelector("input").value = "";
  });
  myPeerConnection.close();
});

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");

const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  const peerFace = document.getElementById("peerFace");
  peerFace.hidden = true;
  await getMedia();
  await setupRoom();
  setupMediaSettiong();
  makeConnection();
}

const setupRoom = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get("meetingId");
  const res = await fetch("/validMeetingId", {
    method: "POST",
    headers:{
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meetingId: meetingId
    })
    })
    const data = await res.json();
    // console.log(data);
    if(data.success){
      const roomName = document.getElementById("roomName");
      // console.log(data.data.description)
      roomName.innerText = data.data.description;
      const roomId = document.getElementById("share-url-input");
      roomId.value = data.data.roomId;
    }
}

const setupMediaSettiong = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const audio = urlParams.get("audio") === 'on';
  const video = urlParams.get("video") === 'on';
  const meetingId = urlParams.get("meetingId");
  console.log(audio, video, meetingId)
  if(audio !== !muted){
    muteBtn.click();
  }
  if(video !== !cameraOff){
    cameraBtn.click();
  }
}


const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;
  socket.emit("check_room", roomName);
  setTimeout(async () => {
    if (userNum < 3) {
      await initCall();
      socket.emit("join_room", roomName);
    } else {
      alert("The room is full!");
    }
    input.value = "";
  }, 1000);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);


// Socket Code
socket.on("users", (users) => {
  userNum = users;
  console.log("got event user num:", userNum);
});

socket.on("welcome", async () => {
// 상대가 들어와야지 실행 됨.
  myDataChannel = myPeerConnection.createDataChannel("chat");
  // myDataChannel.onopen = function (event) {
  //   myDataChannel.send("Join host");
  // };
  myDataChannel.onmessage = function (event) {
    const li = document.createElement("li");
    li.innerText = event.data;
    li.classList.add("list-group-item", "text-start");
    chat.append(li);
    console.log(event.data);
  };

  myDataChannel.onclose = function () {
    console.log("datachannel close");
  };

  // chatting
  const li = document.createElement("li");
  li.innerText = "User joined!";
  li.classList.add("list-group-item", "list-group-item-warning", "text-center");
  chat.append(li);
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.ondatachannel = function (event) {
    myDataChannel = event.channel;
    // myDataChannel.onopen = function (event) {
    //   myDataChannel.send("Join guest");
    // };
    myDataChannel.onmessage = function (event) {
      const li = document.createElement("li");
      li.innerText = event.data;
      li.classList.add("list-group-item", "text-start");
      chat.append(li);
      console.log(event.data);
    };
    myDataChannel.onclose = function () {
      console.log("datachannel close");
    };
  };
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

socket.on("bye", () => {
  const li = document.createElement("li");
  li.innerText = "User left";
  li.classList.add("list-group-item", "list-group-item-warning", "text-center");
  chat.append(li);
  const peerFace = document.getElementById("peerFace");
  peerFace.hidden = true;
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", (data) => {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
  });
  myPeerConnection.addEventListener("addstream", (data) => {
    const peerFace = document.getElementById("peerFace");
    peerFace.hidden = false;
    peerFace.srcObject = data.stream;
  });
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
    
}

document.getElementById('share_url').addEventListener('click', () => {
  const copyText = document.getElementById('share-url-input');

  // 입력 필드를 선택
  copyText.select();
  copyText.setSelectionRange(0, 99999); // 모바일 기기에서 사용할 수 있도록 범위 설정

  // 텍스트를 클립보드에 복사
  navigator.clipboard.writeText(copyText.value)
      .then(() => {
          // 복사가 성공했을 때 사용자에게 알림
          alert('Room ID copied to clipboard!');
      })
      .catch(err => {
          // 복사 실패 시 오류 처리
          console.error('Error copying text: ', err);
      });
});

window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get("meetingId");
  
  console.log(meetingId);
  if(meetingId !== null) {
    const roomInput = document.getElementById("inputRoomId");
    roomInput.value = meetingId;
    //initCall();
    const fakeEvnet = {preventDefault: () => {}};
    handleWelcomeSubmit(fakeEvnet);
  }
}