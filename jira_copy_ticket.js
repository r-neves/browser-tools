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
  btn.style.marginLeft = '8px';
  btn.style.backgroundColor = '#0C66E4';
  btn.style.color = '#FFFFFF';
  btn.style.border = 'none';
  btn.style.borderRadius = '3px';
  btn.style.padding = '4px 10px';
  btn.style.fontWeight = '500';
  btn.style.cursor = 'pointer';
  btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#0055CC'; });
  btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = '#0C66E4'; });

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
