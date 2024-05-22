const navHome = document.querySelector('.nav-home');
const navMessage = document.querySelector('.nav-msg');

navHome.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = '/home';
});

navMessage.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = '/messages';
});