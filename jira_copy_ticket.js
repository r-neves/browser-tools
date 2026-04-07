function injectCopyButton() {
  const ticketId = window.location.pathname.split('/browse/')[1];
  if (!ticketId) return;

  if (document.getElementById('ext-copy-ticket-btn')) return;

  const breadcrumbsWrapper = document.querySelector('[data-component-selector="breadcrumbs-wrapper"]');
  if (!breadcrumbsWrapper) return;

  const btn = document.createElement('button');
  btn.id = 'ext-copy-ticket-btn';
  btn.textContent = ticketId;
  btn.title = 'Copy ticket number';
  btn.className = '_ymio1r31 _ypr0glyw _zcxs1o36 _mizu194a _1ah3dkaa _ra3xnqa1 _128mdkaa _1cvmnqa1 _4davt94y _19itglyw _vchhusvi _r06hglyw _80omtlke _2rkofajl _11c8fhey _v5649dqc _189eidpf _1rjc12x7 _1e0c116y _1bsb1wug _p12f1osq _kqswh2mm _4cvr1q9y _1bah1h6o _gy1p12x7 _1o9zidpf _4t3iviql _k48p1wq8 _y4tiutpp _bozgutpp _y3gn1h6o _s7n4nkob _14mj1kw7 _9v7aze3t _1tv3nqa1 _39yqe4h9 _11fnglyw _18postnw _bfhkomb0 _syaz15cr _105315cr _f8pj15cr _30l315cr _9h8h15cr _irr31wqm _1di617hq _4bfu18uv _1hmsglyw _ajmmnqa1 _1a3b18uv _4fprglyw _5goinqa1 _9oik18uv _1bnxglyw _jf4cnqa1 _1nrm18uv _c2waglyw _1iohnqa1';
  btn.style.marginLeft = '8px';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(ticketId).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = ticketId; }, 1500);
    });
  });

  breadcrumbsWrapper.parentElement.appendChild(btn);
}

const observer = new MutationObserver(() => {
  injectCopyButton();
});

observer.observe(document.body, { childList: true, subtree: true });
