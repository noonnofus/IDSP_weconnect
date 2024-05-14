document.querySelector('.logout-btn').addEventListener('click', async () => {
    await logout();
    window.location.href = "/";
})

async function logout() {
  await fetch(`/logout`, {
    method: "GET"
  })
}