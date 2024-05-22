async function getUser() {
    const user = await getUserSession();
    const userData = JSON.parse(user.data); // user obj from session
    const rooms = await getRoomByUserId(userData.userId);
    await showAllRooms(userData.userId, rooms);
}

async function showAllRooms(currentUserId, rooms) {
    const containerdiv = document.querySelector(".messages")

    for (const room of rooms) {
        console.log(currentUserId);
        console.log(typeof currentUserId);
        const isSender = room.senderId === currentUserId;
        const userId = isSender? room.receiverId: room.senderId;
        const roomUser = await getUserByUserId(userId);

        const roomLastTime = changeDateFormat(room.last_time);

        const div = document.createElement('div');

        div.innerHTML = `
        <a href="/chat?sender=${currentUserId}&receiver=${roomUser.userId}" class="chattingRoomForm" method="get">
            <div class="chattingRoomContainer">
                <div class="chattingRoomDetail">
                    <img class="chattingProfileImg" src="${roomUser.profilePic}">
                    <div class="chattingRoomSemi">
                        <h5>${roomUser.username}</h5>
                        <p>${room.last_message || ""}</p>
                    </div>
                <h6 class="chattingRoomDate">${roomLastTime}</h6>
                </div>
            </div>
        </a>
        `
        div.classList.add('container', 'mb-3', 'chatting-room');
        containerdiv.appendChild(div);
    }
}

function changeDateFormat(dateTime) {
    const aDate = new Date(dateTime);
    const currentTime = new Date();
    const isToday = aDate.toDateString() === currentTime.toDateString();

    const timeDiff = currentTime.getTime() - aDate.getTime();

    const diffInMinutes = Math.floor(timeDiff / (1000 * 60));

    if (isToday) {
        const hours = ('0' + aDate.getHours()).slice(-2);
        const hourCheck = hours >= 12;
        const minutes = ('0' + aDate.getMinutes()).slice(-2);
        
        if (hourCheck === true) {
            const hoursFormat = hours - 12;
            if (Number(hours) === 12) {
                const date = `12:${minutes} PM`;
                return date;
            } else {
                const date = `${hoursFormat}:${minutes} PM`;
                return date;
            }
        } else {
            const date = `${hours}:${minutes}AM`;
            return date;
        }

    } else {
        const diffInDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (diffInDays < 2) {
            const date = "Yesterday";
            return date;
        } else {
            const day = aDate.getDate();
            const month = aDate.getMonth() + 1;
            const year = aDate.getFullYear();
            const date = `${month}/${day}/${year}`;
            return date;
        }
    }
}

async function getUserSession() {
    const res = await fetch('/getUserSession', {
        method: 'POST',
    });
    const data = await res.json();
    return data;
}

async function getRoomByUserId(userId) {
    const res = await fetch('/getRoomByUserId', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
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

getUser();