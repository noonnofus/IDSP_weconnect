const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const historyId = urlParams.get('historyId');
const transcriptSection = document.querySelector('.transcript-section');
const historySection = document.querySelector('.chatting_receiver');
let targetLang = "";

async function load() {
    const transcriptions = await getTranscriptionByHistoryId(historyId);
    const history = await getHistoryByHistoryId(historyId);
    addTranscript(transcriptions);
    await addHistory(history);
}
 
load();

async function addHistory(history) {
    const user = await getUserByUserId(history.host_userId);
    const startDate = changeDateFormat(history.start_time);

    const div = document.createElement('div');

    div.innerHTML = `
    <div class="transcriptForm">
        <div class="transcriptContainer">
            <div class="transcriptDetail">
                <img class="transcriptProfileImg" src="${user.profilePic}">
                <div class="transcriptSemi">
                    <h5>${user.username}'s room</h5>
                    <p>${history.last_message || ""}</p>
                </div>
            <h6 class="transcriptDate">${startDate}</h6>
            </div>
        </div>
    </div>
    `

    historySection.appendChild(div);
}

async function addTranscript(transcripts) {
    const userData = await getUserSession();
    const currentUser = JSON.parse(userData.data);
    for (const transcript of transcripts) {
        const user = await getUserByUserId(transcript.senderId);
        const isSender = currentUser.userId === user.userId;
        const div = document.createElement('div');
        div.innerHTML = `
        <h6>${user.username}:</h6>
        <div class="original_text">${transcript.message}</div>
        `
        div.classList.add('mt-3')
        if (isSender === true) {
            div.classList.add("p-2", "col-auto", "transcript-sender");
        } else {
            div.classList.add("p-2", "col-auto", "transcript-receiver");
        }
        transcriptSection.appendChild(div);
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

async function getTranscriptionByHistoryId(historyId) {
    const res = await fetch('/getTranscriptionByHistoryId', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ historyId }),
    })
    const result = await res.json();
    return result.data;
}

async function getHistoryByHistoryId(historyId) {
    const res = await fetch('/getHistoryByHistoryId', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ historyId }),
    })
    const result = await res.json();
    return result.data;
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

async function translateText(targetLang, text) {
    const res = await fetch('/translateText', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetLang, text }),
    })
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

document.querySelectorAll('.targetLang a').forEach(function(element) {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdown = this.closest('.dropdown');
      const button = dropdown.querySelector('.btn');
      button.innerHTML = this.getAttribute('data-value');
      // this = a tag
  
      const language = this.getAttribute('data-language');
  
      targetLang = language;
    });
});

document.querySelector('.translate-btn').addEventListener("click", async (ev) => {
    ev.preventDefault();
    const translated = document.querySelectorAll('.translated_text');
    if (translated.length > 0) {
        translated.forEach((el) => {
            el.remove();
        })
    }
    const texts = document.querySelectorAll('.original_text');
    for (const text of texts) {
        const translatedText = await translateText(targetLang, text.innerHTML);
        text.innerHTML = `
        <div class="original_text">${translatedText.original}</div>
        <div class="translated_text">${translatedText.translatedText}</div>
        `
    }
})