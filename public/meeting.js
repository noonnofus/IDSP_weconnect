// const socket = window.io();
const STORAGE_KEY = Object.freeze({
  USER_ID: "userId",
  USER_PASSWORD: "userPassword",
});

const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    audio: params.get('audio') === 'on',
    video: params.get('video') === 'on',
    meetingId: params.get('meetingId'),
  };
};

let { audio: initialAudioState, video: initialVideoState, meetingId } = getUrlParams();

const translator = document.querySelector('#translate');
const rtcPeerConnectionMap = new Map();
let id = "";
let nickname = "";
let myStream;
let translation = false;
let stopRecording;

function onReceiveChat(response) {
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
        document.getElementById("video_on_off_button").classList.add("ri-camera-fill");
        document.getElementById("video_on_off_button").classList.remove("ri-camera-off-fill");
      } else {
        document.getElementById("video_on_off_button").classList.remove("on");
        document.getElementById("video_on_off_button").classList.remove("ri-camera-fill");
        document.getElementById("video_on_off_button").classList.add("ri-camera-off-fill");
      }
    });

    myStream.getAudioTracks().forEach((_track) => {
      const track = _track;
      track.enabled = initialAudioState;
      if (initialAudioState) {
        document.getElementById("mic_on_off_button").classList.add("on");
        document.getElementById("mic_on_off_button").classList.add("ri-mic-fill");
        document.getElementById("mic_on_off_button").classList.remove("ri-mic-off-fill");
      } else {
        document.getElementById("mic_on_off_button").classList.remove("on");
        document.getElementById("mic_on_off_button").classList.remove("ri-mic-fill");
        document.getElementById("mic_on_off_button").classList.add("ri-mic-off-fill");
      }
      // 초기 mic 상태에 따라 translator 아이콘 초기화
      if (initialAudioState) {
        translator.classList.remove('translator-not-available');
      } else {
        translator.classList.add('translator-not-available');
        translator.classList.remove('translator-clicked');
        if (stopRecording) {
          socket.emit('stop_recording');
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
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// translation btn

translator.addEventListener('click', () => {
  if (!translation && initialAudioState === true) {
    socket.emit('start_recording');
    translation = true;
    translator.classList.add('translator-clicked');
    const result = startRecording(myStream);
    mediaRecorder = result.mediaRecorder;
    stopRecording = result.stopRecording;
  } else {
    translator.classList.remove('translator-clicked');
    translation = false;
    socket.emit('stop_recording');
    if (stopRecording) {
      stopRecording();
    }
  }
});

socket.on('stop_recording', () => {
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

  if (myStream) {
    myStream.getTracks().forEach((track) => myRTCPeerConnection.addTrack(track, myStream));
  }

  const myPeerFacePlayerBorder = document.createElement("div");
  myPeerFacePlayerBorder.classList.add("peer-face-player-border", "face-player-border");
  myPeerFacePlayerBorder.dataset.peerId = peerId;

  const myPeerFacePlayer = document.createElement("video");
  myPeerFacePlayer.classList.add("peer-face-player", "face-player");
  myPeerFacePlayer.dataset.peerId = peerId;
  myPeerFacePlayer.autoplay = true;
  myPeerFacePlayer.playsinline = true;

  const myPeerFacePlayerCaption = document.createElement("div");
  myPeerFacePlayerCaption.classList.add("peer-face-player-caption", "face-player-caption");
  myPeerFacePlayerCaption.dataset.peerId = peerId;
  myPeerFacePlayerCaption.innerText = peerNickname;

  myPeerFacePlayerBorder.appendChild(myPeerFacePlayer);
  myPeerFacePlayerBorder.appendChild(myPeerFacePlayerCaption);

  myRTCPeerConnection.ontrack = (event) => {
    [myPeerFacePlayer.srcObject] = event.streams;
  };

  document.getElementById("face_player_container").appendChild(myPeerFacePlayerBorder);

  return myRTCPeerConnection;
}

function createDataChannel(_myRTCPeerConnection, isOffer) {
  const myRTCPeerConnection = _myRTCPeerConnection;
  const onChatDataChannelMessage = (event) => {
    onReceiveChat(JSON.parse(event.data));
  };

  if (isOffer) {
    myRTCPeerConnection.chatDataChannel = myRTCPeerConnection.createDataChannel("chat");
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

  document.getElementById("chat_room_form_container").style.display = "none";
  document.getElementById("chat_room_list_container").style.display = "none";
  document.getElementById("face_player_container").style.display = "";
  document.getElementById("chat_list_container").style.display = "";
  document.getElementById("chat_form_container").style.display = "";
  document.getElementById("chat_controller").style.display = "";

  const icon = document.createElement("i");
  icon.classList.add("ri-user-fill");

  const sizeOfRoom = document.createElement("span");
  sizeOfRoom.id = "size_of_room";
  sizeOfRoom.innerText = response.sizeOfRoom;

  const leaveButton = document.createElement("button");
  leaveButton.type = "button";
  leaveButton.classList.add("chat-room-leave-button");
  leaveButton.innerText = "Leave";

  //document.getElementById("app_title").innerText = `${response.chatRoom}`;

  const appTitleDiv = document.createElement("div");
  appTitleDiv.style.display = "flex";
  appTitleDiv.innerHTML = "&nbsp;(";
  appTitleDiv.appendChild(icon);
  appTitleDiv.appendChild(sizeOfRoom);
  appTitleDiv.appendChild(document.createTextNode(")"));

  document.getElementById("app_title").appendChild(appTitleDiv);
  document.getElementById("app_title").appendChild(leaveButton);

  document.querySelector("#chat_list_container .chat-list").innerHTML = "";
  document.querySelector("#nickname_form .nickname-text-input").value = nickname;
  document.querySelector("#chat_submit_form .chat-submit-text-input").value = "";

  leaveButton.addEventListener("click", () => {
    rtcPeerConnectionMap.forEach((connection) => {
      document.querySelectorAll("#face_player_container .peer-face-player-border").forEach((peerFacePlayerBorder) => {
        peerFacePlayerBorder.remove();
      });
      connection.close();
    });
    rtcPeerConnectionMap.clear();

    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      myStream = null;
    }

    socket.emit("leave-room", () => {
      document.getElementById("chat_room_form_container").style.display = "";
      document.getElementById("chat_room_list_container").style.display = "";
      document.getElementById("face_player_container").style.display = "none";
      document.getElementById("chat_list_container").style.display = "none";
      document.getElementById("chat_form_container").style.display = "none";
      document.getElementById("chat_controller").style.display = "none";
      document.getElementById("app_title").innerText = "Noom";
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
  const chatRoomListContainer = document.getElementById("chat_room_list_container");
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

function initApplication() {
  const chatRoomForm = document.getElementById("chat_room_form");
  const chatRoomTextInput = chatRoomForm.querySelector(".chat-room-text-input");
  const nicknameForm = document.getElementById("nickname_form");
  const nicknameTextInput = nicknameForm.querySelector(".nickname-text-input");
  const chatSubmitForm = document.getElementById("chat_submit_form");
  const chatSubmitTextInput = chatSubmitForm.querySelector(".chat-submit-text-input");

  chatRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await joinRoom(chatRoomTextInput.value);
  });

  nicknameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    socket.emit("change-nickname", nicknameTextInput.value, () => {
      nickname = nicknameTextInput.value;
    });
  });

  chatSubmitForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = chatSubmitTextInput.value.trim()

    const result = await addMsgToHistory(text, meetingId);
    if (result.success === true) {
      socket.emit('chat_translation', text);
    }
  });

  socket.on('translatedChat', async (originalChat, translatedText) => {
    // call function to add originalchat to db here.

    console.log('translated chat: ', translatedText);
    const chat = {
      id,
      nickname,
      msg: `${originalChat} -> ${translatedText}`,
    };

    if (chat.msg) {
      rtcPeerConnectionMap.forEach((connection) => {
        if (connection.chatDataChannel) {
          connection.chatDataChannel.send(JSON.stringify(chat));
        }
      });

      onReceiveChat(chat);
      chatSubmitTextInput.value = "";

      const chatListContainer = document.getElementById("chat_list_container");
      chatListContainer.scrollTop = chatListContainer.scrollHeight;
    }
  });

  document.getElementById("video_on_off_button").addEventListener("click", (event) => {
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

  document.getElementById("mic_on_off_button").addEventListener("click", (event) => {
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

     if (isOn) {
      translator.classList.add('translator-not-available');
    } else {
      translator.classList.remove('translator-not-available');
      translator.classList.remove('translator-clicked');
      if (stopRecording) {
        stopRecording();
      }
    }
  });

  socket.emit("login", window.sessionStorage.getItem(STORAGE_KEY.USER_ID), window.sessionStorage.getItem(STORAGE_KEY.USER_PASSWORD), (user) => {
    window.sessionStorage.setItem(STORAGE_KEY.USER_ID, user.id);
    window.sessionStorage.setItem(STORAGE_KEY.USER_PASSWORD, user.password);
    id = user.id;
    nickname = user.nickname;

    if (meetingId) {
      joinRoom(meetingId);
    }
  });

  socket.emit("get-rooms", refreshRooms);
}

socket.on('transcription', async (transcription) => {
  // calling open ai function
  socket.emit('translation', transcription);
});

socket.on('translated', async (transcription, translatedText) => {
  let chat;

  if (translatedText !== null) {
    chat = {
      id,
      nickname,
      msg: `${transcription} -> ${translatedText}`,
    };
  } else {
    chat = {
      id,
      nickname,
      msg: `${transcription}`,
    }
  }

  rtcPeerConnectionMap.forEach((connection) => {
    if (connection.chatDataChannel) {
      connection.chatDataChannel.send(JSON.stringify(chat));
    }
  })
  onReceiveChat(chat);
})

socket.on("refresh-rooms", refreshRooms);

socket.on("notify-join-room", async (response) => {
  document.getElementById("size_of_room").innerText = response.sizeOfRoom;

  onReceiveChat({
    id: response.id,
    nickname: response.nickname,
    msg: `#${response.nickname} has joined the room.`,
  });

  const myRTCPeerConnection = createRTCPeerConnection(response.id, response.nickname);
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
    const peerFacePlayerBorder = document.querySelector(`#face_player_container .peer-face-player-border[data-peer-id="${response.id}"]`);
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

  const peerFacePlayerCaption = document.querySelector(`.peer-face-player-caption[data-peer-id="${response.id}"]`);
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

window.onload =  async () => {
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
    console.log(data);
    if(data.success){
      const roomName = document.getElementById("app_title");
      //console.log(data.data.description)
      roomName.innerText = data.data.description;
      const roomId = document.getElementById("share-url-input");
      roomId.value = data.data.roomId;
    }
}

initApplication();


// dropdown menu
document.querySelectorAll('.currentLang a').forEach(function(element) {
  element.addEventListener('click', function(e) {
    e.preventDefault();
    const dropdown = this.closest('.dropdown');
    const button = dropdown.querySelector('.btn');
    button.innerHTML = this.getAttribute('data-value');

    const currentLang = this.getAttribute('data-language');

    socket.emit('set_currentLang', currentLang)
  });
});

document.querySelectorAll('.targetLang a').forEach(function(element) {
  element.addEventListener('click', function(e) {
    e.preventDefault();
    const dropdown = this.closest('.dropdown');
    const button = dropdown.querySelector('.btn');
    button.innerHTML = this.getAttribute('data-value');
    // this = a tag

    const targetLang = this.getAttribute('data-language');

    socket.emit('set_targetLang', targetLang)
  });
});

async function addMsgToHistory(text, meetingId) {
  const res = await fetch('/addMsgToHistory', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, meetingId }),
  })
  const result = res.json();
  return result;
}