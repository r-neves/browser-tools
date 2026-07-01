const SHORTCUT_LINKS = [
    { label: 'Recibos Verdes', url: 'https://irs.portaldasfinancas.gov.pt/recibos/portal/consultar' },
    { label: 'Declaração Periódica do IVA', url: 'https://iva.portaldasfinancas.gov.pt/dpiva/portal' },
    { label: 'Declaração Recapitulativa do IVA', url: 'https://iva.portaldasfinancas.gov.pt/driva/portal' },
];

// Native-styled section, matching the portal's own "Serviços Frequentes" block.
function buildNativeSection() {
    const section = document.createElement('section');
    section.id = 'ext-shortcuts-content';
    section.className = 'clearfix margin-bottom-xl';
    section.innerHTML = `
        <h2>Os Meus Atalhos</h2>
        <div class="col-xs-12 no-paddings">
            <ul class="col-xs-12 no-paddings list-item-utilities">
                ${SHORTCUT_LINKS.map(({ label, url }) => `
                    <li class="col-sm-4 col-xs-12">
                        <a href="${url}" class="item-utilities-secondary">
                            <div class="item-content">
                                <p class="h4">${label}</p>
                            </div>
                            <span class="fa fa-chevron-right"></span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    return section;
}

// Self-styled fallback for pages that lack the native "Serviços Frequentes" block.
function buildFallbackSection() {
    const section = document.createElement('section');
    section.id = 'ext-shortcuts-content';
    Object.assign(section.style, { padding: '24px 16px', maxWidth: '1170px', margin: '0 auto' });

    const heading = document.createElement('h2');
    heading.textContent = 'Os Meus Atalhos';
    heading.style.marginBottom = '16px';
    section.appendChild(heading);

    const grid = document.createElement('div');
    Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
    });

    for (const { label, url } of SHORTCUT_LINKS) {
        const card = document.createElement('a');
        card.href = url;
        Object.assign(card.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '64px',
            padding: '16px 18px',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderLeft: '4px solid #3c7ab5',
            borderRadius: '6px',
            color: '#004c8c',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,.08)',
        });
        card.innerHTML = `<span>${label}</span><span class="fa fa-chevron-right"></span>`;
        grid.appendChild(card);
    }
    section.appendChild(grid);
    return section;
}

function injectShortcuts() {
    if (document.getElementById('ext-shortcuts-content')) return true;

    // Preferred: insert above the portal's native "Serviços Frequentes" block.
    const native = document.getElementById('servicosFrequentes-content');
    if (native) {
        native.parentElement.insertBefore(buildNativeSection(), native);
        return true;
    }

    // Fallback: insert at the top of the main content once the app has rendered.
    const container = document.querySelector('main') || document.querySelector('#root');
    if (container && container.firstElementChild) {
        container.insertBefore(buildFallbackSection(), container.firstElementChild);
        return true;
    }
    return false;
}

const poll = setInterval(() => {
    if (injectShortcuts()) clearInterval(poll);
}, 300);

setTimeout(() => clearInterval(poll), 15000);
