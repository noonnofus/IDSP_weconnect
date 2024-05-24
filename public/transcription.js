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
    <div class="chattingRoomForm">
        <div class="chattingRoomContainer">
            <div class="chattingRoomDetail">
                <img class="chattingProfileImg" src="${user.profilePic}">
                <div class="chattingRoomSemi">
                    <h5>${user.username}'s room</h5>
                    <p>${history.last_message || ""}</p>
                </div>
            <h6 class="chattingRoomDate">${startDate}</h6>
            </div>
        </div>
    </div>
    `
    historySection.appendChild(div);
}

async function addTranscript(transcripts) {
    for (const transcript of transcripts) {
        const div = document.createElement('div');
        const user = await getUserByUserId(transcript.senderId);
        div.innerHTML = `
        <h6 class="transcript-sender">${user.username}</h6>
        <div class="transcript-message">${transcript.message}</div>
        `
        div.classList.add('mt-3')
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
    const texts = document.querySelectorAll('.transcript-message');
    for (const text of texts) {
        const translatedText = await translateText(targetLang, text.innerHTML);
        text.innerHTML = `
        <div class="original_text">${translatedText.original}</div>
        <div class="translated_text">${translatedText.translatedText}</div>
        `
    }
})

document.querySelector('.transcript_download').addEventListener("click", async (e) => {
    e.preventDefault();
    const texts = document.querySelectorAll('.transcript-message');
    const users = document.querySelectorAll(".transcript-sender");
    let definition = '';

    texts.forEach((text, index) => {
        const user = users[index]; // 해당 인덱스의 user 요소 가져오기
        definition += `${user.innerHTML}: ${text.innerHTML}\n`;
    });
    await generatePDF(definition);
})

async function generatePDF(definition) {
    pdfMake.fonts = {
        DM_Mono: {
            normal: 'DM Mono',
        }
    };

    const docDefinition = {
        content: [
            { text: definition, font: 'DM_Mono', fontSize: 15 },
        ]
    };

    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const fileName = `document_${timestamp}.pdf`;

    pdfMake.createPdf(docDefinition).download(fileName);
}