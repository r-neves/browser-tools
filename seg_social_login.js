function expandLoginAccordion() {
    const toggle = document.querySelector('#toogleAuth');
    if (toggle && getComputedStyle(toggle).display !== 'none') {
        toggle.click();
    }
}

window.addEventListener('load', expandLoginAccordion);
