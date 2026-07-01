const SHORTCUTS = [
    { title: 'Posição atual', url: 'https://www.seg-social.pt/ptss/ci/posicao-atual/posicao-atual' },
    { title: 'Entregar declaração trimestral', url: 'https://www.seg-social.pt/ptss/qlf/trabalhadores-independentes/registar-declaracao' },
    { title: 'Consultar declaração trimestral', url: 'https://www.seg-social.pt/ptss/qlf/trabalhadores-independentes/consultar-declaracao' },
    { title: 'Consultar carreira contributiva', url: 'https://www.seg-social.pt/ptss/cci/carreiraContributiva/consultar_carreira_ss' },
    { title: 'Simular pensão', url: 'https://www.seg-social.pt/ptss/sip/simulador/paginaPrincipal' },
];

function buildShortcutsPanel() {
    const panel = document.createElement('div');
    panel.id = 'sso-shortcuts-panel';
    Object.assign(panel.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        padding: '16px 0 24px',
    });

    for (const item of SHORTCUTS) {
        const card = document.createElement('a');
        card.href = item.url;
        Object.assign(card.style, {
            display: 'flex',
            alignItems: 'center',
            minHeight: '72px',
            padding: '16px 18px',
            background: '#fff',
            border: '1px solid #d9e2ec',
            borderLeft: '4px solid #004b87',
            borderRadius: '8px',
            color: '#004b87',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,.08)',
            transition: 'box-shadow .15s, transform .15s',
        });
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,.15)';
            card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)';
            card.style.transform = 'none';
        });
        card.textContent = item.title;
        panel.appendChild(card);
    }
    return panel;
}

const poll = setInterval(() => {
    const hero = document.querySelector('#pssd-hero');
    if (!hero) return;

    clearInterval(poll);

    if (document.getElementById('sso-shortcuts-panel')) return;
    hero.parentElement.insertBefore(buildShortcutsPanel(), hero);
}, 200);

setTimeout(() => clearInterval(poll), 15000);
