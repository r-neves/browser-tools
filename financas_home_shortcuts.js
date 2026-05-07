function injectShortcuts() {
    const target = document.getElementById('servicosFrequentes-content');
    if (!target || document.getElementById('ext-shortcuts-content')) return;

    const links = [
        { label: 'Recibos Verdes', url: 'https://irs.portaldasfinancas.gov.pt/recibos/portal/consultar' },
        { label: 'Declaração Periódica do IVA', url: 'https://iva.portaldasfinancas.gov.pt/dpiva/portal' },
        { label: 'Declaração Recapitulativa do IVA', url: 'https://iva.portaldasfinancas.gov.pt/driva/portal' },
    ];

    const section = document.createElement('section');
    section.id = 'ext-shortcuts-content';
    section.className = 'clearfix margin-bottom-xl';
    section.innerHTML = `
        <h2>Os Meus Atalhos</h2>
        <div class="col-xs-12 no-paddings">
            <ul class="col-xs-12 no-paddings list-item-utilities">
                ${links.map(({ label, url }) => `
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

    target.parentElement.insertBefore(section, target);
}

window.addEventListener('load', injectShortcuts);
