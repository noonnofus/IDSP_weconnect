const searchbar = document.querySelector('#searchuser');

searchbar.addEventListener("input", async (ev) => {
    const value = ev.target.value;
    if(value.length > 1) {
    console.log(value);
    clearModal();

    const userResult = await searchUser(value);

    userResult.forEach(user => {
        createModal(user.username);
    });
}
})

function createModal(user) {
    const modal = document.querySelector('.modal-body');
    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
    <a href="#">${user}</a>
  `
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

function clearModal() {
    const modal = document.querySelector('.modal-body');
    modal.innerHTML = ''; // 모든 자식 요소를 삭제
}