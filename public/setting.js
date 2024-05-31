document.querySelector(".switch_account").addEventListener('click', async () => {
    const logout = await signout();
    if (logout === true) {
        window.location.href = "/";
    }
});

document.querySelector(".signout").addEventListener('click', async () => {
    const logout = await signout();
    if (logout === true) {
        window.location.href = "/";
    }
});

async function signout() {
    const res = await fetch('/signout', {
        method: "POST",
    })
    const result = await res.json();
    if (result.success === true) {
        return true;
    } else {
        console.error(error);
    }
}