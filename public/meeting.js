const socket = io();

// mdedia stream
const myFace = document.getElementById("myFace");
const muteBtn =  document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;
let myDataChannel;

const getCamera = async () => {
  try {
    const device = await navigator.mediaDevices.enumerateDevices();
    const cameras = device.filter((device) => device.kind === "videoinput");
    //console.log(myStream.getVideoTracks());
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(( camera ) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch(e) {
    console.log(e);
  }
}
const getMedia = async (deviceId) => { 
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };

  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  }

  try { 
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if(!deviceId) {
      await getCamera();
    }

  } catch(e) {
    console.log(e);
  }
}
 //getCamera();
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

const handleCameraChange = async () => {
  //console.log(camerasSelect.value);
  await getMedia(camerasSelect.value);
  if(myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];  
    //console.log(myPeerConnection.getSenders());
    const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video"); 
    console.log(videoSender); 
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


//video welcome form 
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
call.hidden = true;
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
socket.on("welcome", async () => {
  //data channel send 
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", console.log);
  //console.log("mada data channel");

  const offer = await myPeerConnection.createOffer();
  console.log("someone joined");
  console.log(offer);
  myPeerConnection.setLocalDescription(offer);
  console.log("offer sent");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  //data Channel receive 
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", console.log);
  });
  //console.log("Received offer:", offer);

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
      {
        urls: "stun:stun.l.google.com:19302",
      },
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

window.onload = function() {
  // URL에서 쿼리 매개변수 추출
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get('meetingId');
  console.log(`meetingId: ${meetingId}`);
  // input 요소를 찾고 meetingId 값으로 설정
  const roomInput = document.getElementById('roomInput');
  console.log(`roomInput: `);
  console.log(roomInput);
  if (roomInput && meetingId) {
    roomInput.value = meetingId;
    // 폼을 찾아 제출
    const form = document.querySelector('#roomForm');
    //form.submit();
    const fakeEvent = { preventDefault: () => {} };
    handleWelcomeSubmit(fakeEvent);
  }
}