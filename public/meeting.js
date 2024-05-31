//const { type } = require("os");

const socket = window.io();

let currentUser = null;

async function initializeStorageKey() {
  const currentSession = await getUserSession();
  currentUser = JSON.parse(currentSession.data);
  console.log(currentUser);
}

const STORAGE_KEY = Object.freeze({
  USER_ID: "userId",
  USER_PASSWORD: "useremail",
  USER_NICKNAME: "Anonymouse"
});

const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    audio: params.get("audio") === "on",
    video: params.get("video") === "on",
    meetingId: params.get("meetingId"),
  };
};

let {
  audio: initialAudioState,
  video: initialVideoState,
  meetingId,
} = getUrlParams();

const translator = document.querySelector("#translate");
const rtcPeerConnectionMap = new Map();
let id = "";
let nickname = "";
let myStream;
let translation = false;
let stopRecording;
let currentla;
let targetla;

async function onReceiveChat(response) {
  console.log(response);
  const chatListContainer = document.getElementById("chat_list_container");
  const chatList = chatListContainer.querySelector(".chat-list");
  const chatItem = document.createElement("li");

  const nicknameView = document.createElement("strong");
  nicknameView.innerText = response.nickname;

  const contentView = document.createElement("div");
  contentView.innerText = response.msg;

  chatItem.appendChild(nicknameView);
  chatItem.appendChild(contentView);

  if (response.id === id) {
    console.log("hit if")
    chatItem.classList.add("self");
  }

  chatList.appendChild(chatItem);

  chatListContainer.scrollTop = chatListContainer.scrollHeight;
}

async function makeMediaStream() {
  try {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }

    myStream = await window.navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: "user",
      },
    });

    myStream.getVideoTracks().forEach((_track) => {
      const track = _track;
      track.enabled = initialVideoState;
      if (initialVideoState) {
        document.getElementById("video_on_off_button").classList.add("on");
        document
          .getElementById("video_on_off_button")
          .classList.add("ri-camera-fill");
        document
          .getElementById("video_on_off_button")
          .classList.remove("ri-camera-off-fill");
      } else {
        document.getElementById("video_on_off_button").classList.remove("on");
        document
          .getElementById("video_on_off_button")
          .classList.remove("ri-camera-fill");
        document
          .getElementById("video_on_off_button")
          .classList.add("ri-camera-off-fill");
      }
    });

    myStream.getAudioTracks().forEach((_track) => {
      const track = _track;
      track.enabled = initialAudioState;
      if (initialAudioState) {
        document.getElementById("mic_on_off_button").classList.add("on");
        document
          .getElementById("mic_on_off_button")
          .classList.add("ri-mic-fill");
        document
          .getElementById("mic_on_off_button")
          .classList.remove("ri-mic-off-fill");
      } else {
        document.getElementById("mic_on_off_button").classList.remove("on");
        document
          .getElementById("mic_on_off_button")
          .classList.remove("ri-mic-fill");
        document
          .getElementById("mic_on_off_button")
          .classList.add("ri-mic-off-fill");
      }
      if (initialAudioState && currentla !== undefined && targetla !== undefined) {
        translator.classList.remove('translator-not-available');
      } else {
        translator.classList.add("translator-not-available");
        translator.classList.remove("translator-clicked");
        if (stopRecording) {
          socket.emit("stop_recording");
          stopRecording();
        }
      }
    });

    document.getElementById("my_face").srcObject = myStream;
  } catch (e) {
    myStream = null;
    console.trace(e);
  }
}

const startRecording = (stream) => {
  try {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(500);

    mediaRecorder.addEventListener("dataavailable", async (event) => {
      const audioChunk = event.data;
      const arrBuffer = await audioChunk.arrayBuffer();

      const base64String = arrayBufferToBase64(arrBuffer);

      socket.emit('audio_chunk', base64String, meetingId);
    })

    const stopRecording = () => {
      mediaRecorder.stop();
    }
    return { mediaRecorder, stopRecording };
  }
  catch(err) {
    console.error(err);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// translation btn

translator.addEventListener('click', (eve) => {
  eve.preventDefault();
  if (!translation && initialAudioState === true) {
    socket.emit('start_recording', currentla, targetla);
    translation = true;
    translator.classList.remove('translator-available');
    translator.classList.add('translator-clicked');
    const result = startRecording(myStream);
    mediaRecorder = result.mediaRecorder;
    stopRecording = result.stopRecording;
  } else {
    translator.classList.remove('translator-clicked');
    translator.classList.add('translator-available');
    translation = false;
    socket.emit('stop_recording');
    if (stopRecording) {
      stopRecording();
    }
  }
});

socket.on("stop_recording", () => {
  if (stopRecording) {
    stopRecording();
  }
});

function createRTCPeerConnection(peerId, peerNickname) {
  const myRTCPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });

  myRTCPeerConnection.oniceconnectionstatechange = () => {
    console.log(`ICE connection state: ${myRTCPeerConnection.iceConnectionState}`);
    if (myRTCPeerConnection.iceConnectionState === "failed" || 
        myRTCPeerConnection.iceConnectionState === "disconnected" || 
        myRTCPeerConnection.iceConnectionState === "closed") {
      window.location.href = "/home";
    }
  };
  
  if (myStream) {
    myStream
      .getTracks()
      .forEach((track) => myRTCPeerConnection.addTrack(track, myStream));
  }

  const myPeerFacePlayerBorder = document.createElement("div");
  myPeerFacePlayerBorder.classList.add(
    "peer-face-player-border",
    "face-player-border"
  );
  myPeerFacePlayerBorder.dataset.peerId = peerId;

  const myPeerFacePlayer = document.createElement("video");
  myPeerFacePlayer.classList.add("peer-face-player", "face-player");
  myPeerFacePlayer.dataset.peerId = peerId;
  myPeerFacePlayer.autoplay = true;
  myPeerFacePlayer.playsinline = true;

  const myPeerFacePlayerCaption = document.createElement("div");
  myPeerFacePlayerCaption.classList.add(
    "peer-face-player-caption",
    "face-player-caption"
  );
  myPeerFacePlayerCaption.dataset.peerId = peerId;
  myPeerFacePlayerCaption.innerText = peerNickname;

  myPeerFacePlayerBorder.appendChild(myPeerFacePlayer);
  myPeerFacePlayerBorder.appendChild(myPeerFacePlayerCaption);

  myRTCPeerConnection.ontrack = (event) => {
    [myPeerFacePlayer.srcObject] = event.streams;
  };

  document
    .getElementById("face_player_container")
    .appendChild(myPeerFacePlayerBorder);

  return myRTCPeerConnection;
}

function createDataChannel(myRTCPeerConnection, isOffer) {
  const onChatDataChannelMessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'chat') {
      onReceiveChat(data);
    } else if (data.type === 'file') {
      onReceiveData(data);
    }
  };

  if (isOffer) {
    myRTCPeerConnection.chatDataChannel = myRTCPeerConnection.createDataChannel('chat');
    myRTCPeerConnection.chatDataChannel.onmessage = onChatDataChannelMessage;
  } else {
    myRTCPeerConnection.ondatachannel = (event) => {
      myRTCPeerConnection.chatDataChannel = event.channel;
      myRTCPeerConnection.chatDataChannel.onmessage = onChatDataChannelMessage;
    };
  }
}


async function joinRoomCallback(response) {
  if (response.error) {
    window.alert(response.message);
    return;
  }
  const res = await fetch("/validMeetingId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meetingId: meetingId,
    }),
  });
  const data = await res.json();
  console.log(data);
  if (data.success) {
    const roomName = document.getElementById("app_title");
    //console.log(data.data.description)
    roomName.innerText = data.data.description;
    const roomId = document.getElementById("share-url-input");
    roomId.value = data.data.roomId;
  }

  document.getElementById("chat_room_form_container").style.display = "none";
  document.getElementById("chat_room_list_container").style.display = "none";
  document.getElementById("face_player_container").style.display = "";
  document.getElementById("chat_list_container").style.display = "";
  document.getElementById("chat_form_container").style.display = "";
  //document.getElementById("chat_controller").style.display = "";

  const icon = document.createElement("i");
  icon.classList.add("ri-user-fill");

  const sizeOfRoom = document.createElement("span");
  sizeOfRoom.id = "size_of_room";
  sizeOfRoom.innerText = response.sizeOfRoom;

  const  leaveButton = document.getElementById("leaveButton");
  window.onpopstate = () => {
     leaveButton.click();
  };
  
  window.onbeforeunload = () => {
    leaveButton.click();
  };
  const appTitleDiv = document.createElement("div");
  appTitleDiv.style.display = "flex";
  appTitleDiv.innerHTML = "&nbsp;(";
  appTitleDiv.appendChild(icon);
  appTitleDiv.appendChild(sizeOfRoom);
  appTitleDiv.appendChild(document.createTextNode(")"));

  document.getElementById("app_title").appendChild(appTitleDiv);
  //document.getElementById("meetingFooter").appendChild(leaveButton);

  document.querySelector("#chat_list_container .chat-list").innerHTML = "";
  document.querySelector("#nickname_form .nickname-text-input").value =
    nickname;
  document.querySelector("#chat_submit_form .chat-submit-text-input").value =
    "";

    
  leaveButton.addEventListener("click", (event) => {
    event.preventDefault();
    rtcPeerConnectionMap.forEach((connection) => {
      document
        .querySelectorAll("#face_player_container .peer-face-player-border")
        .forEach((peerFacePlayerBorder) => {
          peerFacePlayerBorder.remove();
        });
      connection.close();
    });
    rtcPeerConnectionMap.clear();

    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      myStream = null;
    }

    socket.emit("leave-room", async (rooms) => {
      // document.getElementById("chat_room_form_container").style.display = "";
      // document.getElementById("chat_room_list_container").style.display = "";
      // document.getElementById("face_player_container").style.display = "none";
      // document.getElementById("chat_list_container").style.display = "none";
      // document.getElementById("chat_form_container").style.display = "none";
      // document.getElementById("chat_controller").style.display = "none";
      //document.getElementById("app_title").innerText = "Noom";

      //move to homepage rounting

      if (rooms.length === 0) {
        //#working
        const res = await fetch('/meetingClosed', {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ meetingId }),
      })
    }
    window.location.href = "/home";
    });
  });
}

async function joinRoom(room) {
  if (room.trim()) {
    await makeMediaStream();
    socket.emit("join-room", room, joinRoomCallback);
  }
}

function refreshRooms(rooms) {
  const chatRoomListContainer = document.getElementById(
    "chat_room_list_container"
  );
  chatRoomListContainer.innerHTML = "";
  
  rooms.forEach((room) => {
    const roomDiv = document.createElement("div");
    roomDiv.classList.add("room-enter-badge");
    roomDiv.innerText = room;

    roomDiv.addEventListener("click", async () => {
      await joinRoom(roomDiv.innerText);
    });

    chatRoomListContainer.appendChild(roomDiv);
  });


}
const chatRoomForm = document.getElementById("chat_room_form");
  const chatRoomTextInput = chatRoomForm.querySelector(".chat-room-text-input");
  const nicknameForm = document.getElementById("nickname_form");
  const nicknameTextInput = nicknameForm.querySelector(".nickname-text-input");
  const chatSubmitForm = document.getElementById("chat_submit_form");
  const chatSubmitTextInput = chatSubmitForm.querySelector(
    ".chat-submit-text-input"
  );
async function initApplication() {
  


  


  chatRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await joinRoom(chatRoomTextInput.value);
  });``

  nicknameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    socket.emit("change-nickname", nicknameTextInput.value, () => {
      nickname = nicknameTextInput.value;
    });
  });

  chatSubmitForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const text = chatSubmitTextInput.value.trim()

      socket.emit('chat_translation', text, targetla);
    }
    catch(error) {
      console.error(error);
    }
  });

  socket.on("translated", async (transcription, translatedText) => {
    let chat;
  
    if (translatedText !== null) {
      chat = {
        type: 'chat',
        id,
        nickname,
        msg: `${transcription} -> ${translatedText}`,
      };
    } else {
      chat = {
        type: 'chat',
        id,
        nickname,
        msg: `${transcription}`,
      };
    }
  
    rtcPeerConnectionMap.forEach((connection) => {
      if (connection.chatDataChannel) {
        connection.chatDataChannel.send(JSON.stringify(chat));
      }
    });
  
    onReceiveChat(chat);
  
  
    const userReuslt = await getUserSession();
    const user = JSON.parse(userReuslt.data);
  
    const history = await getHistoryByRoomId(meetingId);
    await addMsgToTrnascription(transcription, user.userId, history.historyId);
    await addMsgToHistory(transcription, meetingId);
  })

  document
    .getElementById("video_on_off_button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      if (myStream && myStream.getVideoTracks().length) {
        const isOn = button.classList.contains("on");
        button.classList.toggle("on", !isOn);
        button.classList.toggle("ri-camera-fill", !isOn);
        button.classList.toggle("ri-camera-off-fill", isOn);

        myStream.getVideoTracks().forEach((track) => {
          track.enabled = !isOn;
        });
      }
    });

  document
    .getElementById("mic_on_off_button")
    .addEventListener("click", (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const isOn = button.classList.contains("on");
      if (myStream && myStream.getAudioTracks().length) {
        button.classList.toggle("on", !isOn);
        button.classList.toggle("ri-mic-fill", !isOn);
        button.classList.toggle("ri-mic-off-fill", isOn);

        myStream.getAudioTracks().forEach((track) => {
          track.enabled = !isOn;
        });
        initialAudioState = !initialAudioState;
        if (stopRecording) {
          stopRecording();
        }
      }
      // #working1
      if (isOn) {
        console.log("toggle off");
        if(translator.classList.contains('translator-clicked')){
          console.log("toggle off and translator clicked");
          translator.classList.remove('translator-clicked');
          translator.classList.add('translator-not-available');
          if (stopRecording) {
            stopRecording();
          }
        }
       translator.classList.add('translator-not-available');
      } else {
        console.log("toggle on");
        translator.classList.remove('translator-not-available');
        //translator.classList.remove('translator-clicked');
        translator.classList.add('translator-available');
      if (stopRecording) {
        stopRecording();
      }
    }
    });

  socket.emit(
    "login",
    // window.sessionStorage.getItem(STORAGE_KEY.USER_ID),
    // window.sessionStorage.getItem(STORAGE_KEY.USER_PASSWORD),
    currentUser.userId,
    currentUser.userEmail,
    currentUser.username,
    (user) => {
      window.sessionStorage.setItem(STORAGE_KEY.USER_ID, user.id);
      window.sessionStorage.setItem(STORAGE_KEY.USER_PASSWORD, user.password);
      window.sessionStorage.setItem(STORAGE_KEY.USER_NICKNAME, user.nickname);
      id = user.id;
      nickname = user.nickname;

      console.log("login", user);
      if (meetingId) {
        joinRoom(meetingId);
      }
    }
  );
}

socket.on('transcription', async (transcription) => {
  try {
    socket.emit('translation', transcription);
  } catch(error) {
    console.error(error);
  }
});

socket.on("translatedChat", async (originalChat, translatedText) => {
  const chat = {
    type: 'chat',
    id,
    nickname,
    msg: `${originalChat} -> ${translatedText}`,
    from: "translatedChat 585"
  };

  if (chat.msg) {
    rtcPeerConnectionMap.forEach((connection) => {
      if (connection.chatDataChannel && connection.chatDataChannel.readyState === 'open') {
        connection.chatDataChannel.send(JSON.stringify(chat));
      } else {
        console.error('DataChannel is not open:', connection.chatDataChannel.readyState);
      }
    });

    onReceiveChat(chat);
    chatSubmitTextInput.value = "";

    const chatListContainer = document.getElementById("chat_list_container");
    chatListContainer.scrollTop = chatListContainer.scrollHeight;

    const userReuslt = await getUserSession();
    const user = JSON.parse(userReuslt.data);

    const history = await getHistoryByRoomId(meetingId);

    await addMsgToTrnascription(originalChat, user.userId, history.historyId);

    await addMsgToHistory(originalChat, meetingId);
  }
});

socket.on("refresh-rooms", refreshRooms);

socket.on("notify-join-room", async (response) => {
  document.getElementById("size_of_room").innerText = response.sizeOfRoom;

  onReceiveChat({
    type: 'chat',
    id: response.id,
    nickname: response.nickname,
    msg: `#${response.nickname} has joined the room.`,
  });

  const myRTCPeerConnection = createRTCPeerConnection(
    response.id,
    response.nickname
  );
  myRTCPeerConnection.onicecandidate = (event) => {
    socket.emit("webrtc-ice-candidate", response.id, event.candidate);
  };
  createDataChannel(myRTCPeerConnection, true);
  rtcPeerConnectionMap.set(response.id, myRTCPeerConnection);

  const offer = await myRTCPeerConnection.createOffer();
  myRTCPeerConnection.setLocalDescription(offer);
  socket.emit("webrtc-offer", response.id, offer);
});

socket.on("notify-leave-room", (response) => {
  document.getElementById("size_of_room").innerText = response.sizeOfRoom;
  onReceiveChat({
    id: response.id,
    nickname: response.nickname,
    msg: "# Goodbye",
  });

  if (rtcPeerConnectionMap.has(response.id)) {
    const peerFacePlayerBorder = document.querySelector(
      `#face_player_container .peer-face-player-border[data-peer-id="${response.id}"]`
    );
    if (peerFacePlayerBorder) {
      peerFacePlayerBorder.remove();
    }
    rtcPeerConnectionMap.get(response.id).close();
    rtcPeerConnectionMap.delete(response.id);
  }
});

socket.on("notify-change-nickname", (response) => {
  onReceiveChat({
    id: response.id,
    nickname: response.oldNickname,
    msg: `# Change my nickname to ${response.nickname}`,
  });

  const peerFacePlayerCaption = document.querySelector(
    `.peer-face-player-caption[data-peer-id="${response.id}"]`
  );
  if (peerFacePlayerCaption) {
    peerFacePlayerCaption.innerText = response.nickname;
  }
});

socket.on("webrtc-offer", async (userId, userNickname, offer) => {
  const myRTCPeerConnection = createRTCPeerConnection(userId, userNickname);
  myRTCPeerConnection.onicecandidate = (event) => {
    socket.emit("webrtc-ice-candidate", userId, event.candidate);
  };
  createDataChannel(myRTCPeerConnection, false);
  rtcPeerConnectionMap.set(userId, myRTCPeerConnection);

  myRTCPeerConnection.setRemoteDescription(offer);
  const answer = await myRTCPeerConnection.createAnswer();
  myRTCPeerConnection.setLocalDescription(answer);
  socket.emit("webrtc-answer", userId, answer);
});

socket.on("webrtc-answer", (userId, userNickname, answer) => {
  if (!rtcPeerConnectionMap.has(userId)) {
    return;
  }

  rtcPeerConnectionMap.get(userId).setRemoteDescription(answer);
});

socket.on("webrtc-ice-candidate", (userId, candidate) => {
  if (rtcPeerConnectionMap.has(userId) && candidate) {
    rtcPeerConnectionMap.get(userId).addIceCandidate(candidate);
  }
});

document.getElementById("share_url").addEventListener("click", () => {
  const copyText = document.getElementById("share-url-input");

  // 입력 필드를 선택
  copyText.select();
  copyText.setSelectionRange(0, 99999); // 모바일 기기에서 사용할 수 있도록 범위 설정

  // 텍스트를 클립보드에 복사
  navigator.clipboard
    .writeText(copyText.value)
    .then(() => {
      // 복사가 성공했을 때 사용자에게 알림
      alert("Room ID copied to clipboard!");
    })
    .catch((err) => {
      // 복사 실패 시 오류 처리
      console.error("Error copying text: ", err);
    });
});
window.onload = async () => {
  await initializeStorageKey();
  initApplication();
};


// dropdown menu
document.querySelectorAll('.currentLang a').forEach(function(element) {
  element.addEventListener('click', function(e) {
    e.preventDefault();
    const mic = document.getElementById("mic_on_off_button").classList
    const dropdown = this.closest('.dropdown');
    const button = dropdown.querySelector('.btn');
    button.innerHTML = this.getAttribute('data-value');

    const currentLang = this.getAttribute('data-language');

    currentla = currentLang;
    //#working2
    // if (mic.contains('ri-mic-fill')) {
    //   alert("1");
    //   translator.classList.remove('translator-not-available');
    // }
  });
});

document.querySelectorAll('.targetLang a').forEach(function(element) {
  element.addEventListener('click', function(e) {
    e.preventDefault();
    const mic = document.getElementById("mic_on_off_button").classList
    const dropdown = this.closest('.dropdown');
    const button = dropdown.querySelector('.btn');
    button.innerHTML = this.getAttribute('data-value');
    // this = a tag

    const targetLang = this.getAttribute('data-language');

    targetla = targetLang;
    // if (currentla && targetla !== undefined && mic.contains('ri-mic-fill')) {
    //   translator.classList.remove('translator-not-available');
    // }
  });
});

document.getElementById('chat_submit_file').addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const base64String = event.target.result.split(',')[1];
      const fileInfo = {
        filename: file.name,
        data: base64String,
        id:currentUser.id,
        nickname:currentUser.username,
      };
      socket.emit('file_upload', fileInfo);
    };
    reader.readAsDataURL(file);
  }
});

socket.on('file_uploaded', (file) => {
  const fileInfo = {
    type: 'file',
    id,
    nickname,
    textContent: file.filename,
    url: file.url,
  };
  rtcPeerConnectionMap.forEach((connection) => {
    if (connection.chatDataChannel) {
      connection.chatDataChannel.send(JSON.stringify(fileInfo));
    }
  });
  console.log("보낸자?");
  onReceiveData(fileInfo);

});

function onReceiveData(file) {
  console.log("file : ")
  console.log(file)
  const chatListContainer = document.getElementById('chat_list_container');
  const chatList = chatListContainer.querySelector('.chat-list');
  const chatItem = document.createElement('li');
  const dataLink = document.createElement('a');
  dataLink.href = file.url;
  dataLink.textContent = file.textContent;
  dataLink.download = file.textContent;

  const nicknameView = document.createElement('strong');
  nicknameView.innerText = file.nickname;

  const contentView = document.createElement('div');
  contentView.appendChild(dataLink);

  chatItem.appendChild(nicknameView);
  chatItem.appendChild(contentView);

  if (file.id === id) {
    chatItem.classList.add('self');
  }

  chatList.appendChild(chatItem);
  console.log("appended Child!")
  chatListContainer.scrollTop = chatListContainer.scrollHeight;
}async function addMsgToHistory(text, meetingId) {
  const res = await fetch('/addMsgToHistory', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, meetingId }),
  })
  const result = res.json();
  if (result.success === false) {
    throw new Error("Error while updating history");
  }
}

async function addMsgToTrnascription(text, userId, historyId) {
  const res = await fetch('/addMsgToTranscription', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, userId, historyId }),
  })
  const result = res.json();
  if (result.success === false) {
    throw new Error("Error while updating history");
  }
}

async function getHistoryByRoomId(roomId) {
  const res = await fetch('/getHistoryByRoomId', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId }),
  })
  const result = await res.json();
  console.log(result);
  return result.data;
}

async function getUserSession() {
  const res = await fetch('/getUserSession', {
      method: 'POST',
  });
  const data = await res.json();
  return data;
}