async function validMeetingRoom(id) {
    const res = await fetch('/validMeetingId', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            meetingId: id
        })
    });
    const data = await res.json();

    console.log(data);
    return data.success;
}

async function generateRandomId() {
    const length = 8;
    const characters = '123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const res = await validMeetingRoom(result);
    if(res) { 
        const inputField = document.getElementById('meetingIdInput');
        const labelField = document.getElementById('lb_meetingId');
        inputField.value = result;
        labelField.textContent = result; 
    } else { 
        console.log('Error: Invalid Meeting ID');
    }
}



document.addEventListener("DOMContentLoaded", generateRandomId);
