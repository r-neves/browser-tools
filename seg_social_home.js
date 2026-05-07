const poll = setInterval(() => {
    const header = document.querySelector('#pv_id_1_header');
    const hero = document.querySelector('#pssd-hero');
    if (!header || !hero) return;

    clearInterval(poll);

    const favoritesPanel = header.closest('[data-pc-name="panel"]');
    if (!favoritesPanel) return;

    hero.parentElement.insertBefore(favoritesPanel, hero);

    setTimeout(() => {
        const h = document.querySelector('#pv_id_1_header');
        if (h && h.getAttribute('aria-expanded') !== 'true') {
            h.click();
        }
    }, 500);
}, 200);

setTimeout(() => clearInterval(poll), 15000);
