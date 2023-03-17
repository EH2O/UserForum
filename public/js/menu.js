const button = document.querySelector('.navbar__button');
const collapse = document.querySelector('.navbar__collapse');

button.addEventListener('click', function(event) {
    const menu = document.querySelector('.navbar__collapse');
    menu.classList.toggle('navbar__collapse--show');
});

const mql = window.matchMedia('(max-width: 599px)');

mql.addEventListener('change', (e) => {
    if (!e.matches && collapse.classList[1] == 'navbar__collapse--show') {
        collapse.classList.toggle('navbar__collapse--show');
    }
});