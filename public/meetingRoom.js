const meetingSection = document.querySelector(".meeting-section");

async function showActivatedMeetings() {
    const meetings = await getMeetingRooms();
    
    console.log(meetings.data);

    if (meetings.data) {
      for (i = 0; i < meetings.data.length; i++) {
        const div = document.createElement("div");
        const meetingname = meetings.data[i].description;
        const meetingId = meetings.data[i].roomId;
        div.innerHTML = `
        <a href="/meeting?meetingId=${meetingId}" class="transcriptForm" method="get">
            <div class="transcriptContainer custom-shadow p-3 mb-3 bg-white rounded">
                <h6 class="transcriptHeader">${meetingname}</h6>
                    <div class="meeting-rooms">
                        <p class="meetingroom">
                        meeting Id: ${meetings.data[i].roomId}
                        </p>
                        <i class="bi bi-chevron-right bi-fw"></i>
                    </div>
                </div>
            </a>
        `;
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

document.addEventListener("DOMContentLoaded", showActivatedMeetings);