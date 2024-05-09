const socket = io();

const searchbar = document.querySelector('#searchuser');

searchbar.addEventListener("input", async (ev) => {
    const value = ev.target.value;

    clearModal();

    if (value.length > 0) {
        const userResult = await searchUser(value);
        const currentUserStr = await getCurrnetUserSession();
        const currentUser = JSON.parse(currentUserStr)
    
        userResult.forEach(user => {
            createModal(currentUser, user);
        });
        
        document.querySelectorAll('.user-link').forEach(element => {
            element.addEventListener("click", async () => {
                const sender = currentUser.userEmail;
                const receiver = userResult.find(u => u.username === element.textContent).email;
                await storeRoomInDb(sender, receiver);
            });
        });
    }
})

function createModal(currentUser, user) {
    const modal = document.querySelector('.modal-body');
    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
    <a href="/chat?sender=${currentUser.userId}&receiver=${user.userId}" class="user-link">${user.username}</a>
    `

    newDiv.classList.add("user-result");
    modal.append(newDiv);
}

async function searchUser(value) {
    const res = await fetch('/searchUser', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: value }),
    })
    const arr = await res.json();
    return arr.data;
}

async function getCurrnetUserSession() {
    const res = await fetch('/getUserSession', {
        method: 'POST',
    });
    const result = await res.json();
    return result.data;
  }

async function storeRoomInDb(sender, receiver) {
    const res = await fetch('/storeInDb', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender, receiver }),
    })
    const result = await res.json();
    return result.data;
}

function clearModal() {
    const modal = document.querySelector('.modal-body');
    modal.innerHTML = '';
}

// export default socket;