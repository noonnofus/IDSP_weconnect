const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", async () => {
    console.log("connected to server ✅")
    
    getUserSession().then(userStr => socket.send(userStr));
})

socket.addEventListener("close", () => {
    console.log("disconnected from the server ❌");
})

socket.addEventListener("message", (ev) => {
    const blobMsg = ev.data;
    const reader = new FileReader();

    reader.onload = async () => {
        const textmsg = reader.result;
        const userStr = await getUserSession();
        // const username = 
        const user = JSON.parse(userStr.data);


        console.log('user who wrote the msg: ', user);
        console.log('does it with user data?: ', textmsg); // where msgs are.

        const chat = document.querySelector('.chatting')
        
        const msg = document.createElement("div");

        if (typeof textmsg === "string") {
            msg.innerHTML = `
            <p>${user.username}: ${textmsg}</p>
            `
            chat?.appendChild(msg);
        }
    }

    reader.readAsText(blobMsg);
})

const form = document.querySelector('.message');

form?.addEventListener("submit", (event) => {
    event.preventDefault()
    console.log('from frontend: ', event);
    const input = form.querySelector("input");
    if (input) {
        socket.send(input.value);
        input.value = "";
    }
})

async function getUserSession() {
    const res = await fetch('/getUserSession', {
        method: 'POST',
    })
    return res.json()
}