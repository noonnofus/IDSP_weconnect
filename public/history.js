const historySection = document.querySelector('.transcripts');
async function load() {
    const result = await getUserSession();
    const user = JSON.parse(result.data);
    
    const transcripts = await getAllTranscripts(user.userId);
    
    if (transcripts !== null) {
        await showAllHistories(transcripts);
    }
}

load();

async function showAllHistories(transcripts) {
    for (const transcript of transcripts) {
        const user = await getUserByUserId(transcript.host_userId);
        const startDate = changeDateFormat(transcript.start_time);

        const div = document.createElement('div');

        div.innerHTML = `
        <a href="/transcript?historyId=${transcript.historyId}" class="transcriptForm" method="get">
            <div class="transcriptContainer">
                <div class="transcriptDetail">
                    <img class="transcriptProfileImg" src="${user.profilePic}">
                    <div class="transcriptSemi">
                        <h5>${user.username}'s room</h5>
                        <p>${transcript.last_message || ""}</p>
                    </div>
                <h6 class="transcriptDate">${startDate}</h6>
                </div>
            </div>
        </a>
        `
        historySection.appendChild(div);
    }
}

function changeDateFormat(dateTime) {

    const aDate = new Date(dateTime);

    const dateFormat = aDate.toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const hours = ('0' + aDate.getHours()).slice(-2);
    const hourCheck = hours >= 12;
    const minutes = ('0' + aDate.getMinutes()).slice(-2);
    
    if (hourCheck === true) {
        const hoursFormat = hours - 12;
        if (Number(hours) === 12) {
            const date = `${dateFormat} | 12:${minutes} PM`;
            return date;
        } else {
            const date = `${dateFormat} | ${hoursFormat}:${minutes} PM`;
            return date;
        }
    } else {
        const date = `${dateFormat} | ${hours}:${minutes}AM`;
        return date;
    }
}

async function getAllTranscripts(userId) {
    const res = await fetch('/getAllTranscripts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId
        })
    });
    const result = await res.json();
    return result.data;
}

async function getUserSession() {
    const res = await fetch('/getUserSession', {
        method: 'POST',
    });
    const data = await res.json();
    return data;
}

async function getUserByUserId(userId) {
    const res = await fetch('/getUserByUserId', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
    })
    const result = await res.json();
    return result.data;
}