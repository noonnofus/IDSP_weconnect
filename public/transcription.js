const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const historyId = urlParams.get('historyId');

async function load() {
    const transcriptions = await getTranscriptionByHistoryId(historyId);
    console.log(transcriptions);
}
 
load();

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