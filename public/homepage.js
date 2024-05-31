const transcriptSection = document.querySelector(".transcript-section");
const meetingSection = document.querySelector(".meeting-section");
const createMeeting = document.querySelector("#meeting-start");

async function validMeetingRoom(id) {
  const res = await fetch("/validMeetingId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meetingId: id,
    }),
  });
  const data = await res.json();

  return data.success;
}

async function generateRandomId() {
  const length = 8;
  const characters = "123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const res = await validMeetingRoom(result);
  if (res) {
    const inputField = document.getElementById("meetingIdInput");
    const labelField = document.getElementById("lb_meetingId");
    inputField.value = result;
    labelField.textContent = result;
  } else {
    console.log("Error: Invalid Meeting ID");
  }
}

async function showMeetingHistory() {
  const result = await getUserSession();
  const user = JSON.parse(result.data);
  const transcripts = await getAllTranscripts(user.userId);
  const newTranscripts = transcripts.slice(-2);
  addTranscripts(newTranscripts);
}

async function showActivatedMeetings() {
  const meetings = await getMeetingRooms();

  if (meetings.data) {
    for (i = 0; i < meetings.data.length; i++) {
        console.log("i: " + i);
      if (i > 2) {
        break;
      }
      const div = document.createElement("div");
      const meetingname = meetings.data[i].description;
      const meetingId = meetings.data[i].roomId;
      div.innerHTML = `
        <a href="/meeting?meetingId=${meetingId}" class="transcriptForm" method="get">
            <div class="transcriptContainer custom-shadow p-3 mb-3 bg-white rounded">
            <h6 class="transcriptHeader">${meetingname}</h6>`;
      div.classList.add("active-meetings");
      meetingSection.appendChild(div);
    }
  } else {
    const div = document.createElement("div");
    div.innerHTML = `
        <div class="transcriptContainer custom-shadow p-3 mb-3 bg-white rounded">
        <h6 class="transcriptHeader">No active meetings</h6>    
    `;
    div.classList.add("active-meetings");
    meetingSection.appendChild(div);
  }
}

async function addTranscripts(transcripts) {
  for (const transcript of transcripts) {
    const div = document.createElement("div");
    const user = await getUserByUserId(transcript.host_userId);
    const date = changeDateFormat(transcript.start_time);
    div.innerHTML = `
        <a href="/transcript?historyId=${
          transcript.historyId
        }" class="transcriptForm" method="get">
            <div class="transcriptContainer custom-shadow p-3 mb-3 bg-white rounded">
            <h6 class="transcriptHeader">${user.username}'s room</h6>
            <div class="transcriptDetails">
                <div class="transcriptDate">${date}</div>
                <p class="transcriptMessage">${
                  transcript.last_message || ""
                }</p>
                <i class="bi bi-chevron-right bi-fw"></i>
            </div>
            </div>
        </a>
        `;
    div.classList.add("meeting-history");
    transcriptSection.appendChild(div);
  }
}

function changeDateFormat(dateTime) {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  const dateStr = `${year}-${month}-${day}`;
  return dateStr;
}

function showLoadingModal() {
  document.getElementById('loadingModal').style.display = 'block';
  
  // 예시: 3초 후에 로딩 모달 숨기기
  setTimeout(hideLoadingModal, 3000);
}

function hideLoadingModal() {
  document.getElementById('loadingModal').style.display = 'none';
}

async function getUserSession() {
  const res = await fetch("/getUserSession", {
    method: "POST",
  });
  const data = await res.json();
  return data;
}

async function getAllTranscripts(userId) {
  const res = await fetch("/getAllTranscripts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
    }),
  });
  const result = await res.json();
  return result.data;
}

async function getUserByUserId(userId) {
  const res = await fetch("/getUserByUserId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const result = await res.json();
  return result.data;
}

async function getTranscriptionByHistoryId(historyId) {
  const res = await fetch("/getTranscriptionByHistoryId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ historyId }),
  });
  const result = await res.json();
  return result.data;
}

async function getMeetingRooms() {
  const res = await fetch("/activatedMeetings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data;
}

document.addEventListener("DOMContentLoaded", generateRandomId);
document.addEventListener("DOMContentLoaded", showMeetingHistory);
document.addEventListener("DOMContentLoaded", showActivatedMeetings);
createMeeting.addEventListener('click', showLoadingModal);