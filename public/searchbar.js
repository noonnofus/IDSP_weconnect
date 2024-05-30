const socket = io();

const searchbar = document.querySelector('#searchuser');


searchbar.addEventListener("input", async (ev) => {
    const value = ev.target.value;

    if (value.length > 0) {
        const userResult = await searchUser(value);
        const currentUserStr = await getCurrnetUserSession();
        const currentUser = JSON.parse(currentUserStr);

        clearModal();

        userResult.forEach(user => {
            createModal(currentUser, user);
        });
        document.querySelectorAll('.user-result').forEach(element => {
            element.addEventListener("click", async (ev) => {
                ev.preventDefault();
                const a = element.querySelector('a');
                const href = a.getAttribute('href');
                const sender = currentUser.userEmail;
                const receiver = await userResult.find(u => u.username === a.textContent.trim()).email;
                await storeRoomInDb(sender, receiver);
                window.location.href = href;
            });
        });
    } else {
        clearModal();
    }
})

function createModal(currentUser, user) {
    const modal = document.querySelector('.searchModal-body');
    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
    <div class="row">
        <div class="col-12">
            <div class="search-result">
                <a href="/chat?sender=${currentUser.userId}&receiver=${user.userId}" class="user-link">
                    ${user.username}
                </a>
            </div>
        </div>
    </div>
    `
    
    newDiv.classList.add("user-result", "rounded-bottom");
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
    console.log(sender, receiver);
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
    const modal = document.querySelector('.searchModal-body');
    modal.innerHTML = '';
}