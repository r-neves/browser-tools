// ---- CONFIG (edit these) ---------------------------------------------------

// The /exec URL of your deployed Apps Script web app (seg_social_otp_broker.gs).
const BROKER_URL = 'https://script.google.com/macros/s/AKfycbx0Q1VSm6oxBBI03rbMj4HCCnzXAGaMqvByEvjB6ZZLJ7nbEpOS5a3mYgOIeGOYjCwKFw/exec';

// The same SHARED_TOKEN you set in the Apps Script.
const BROKER_TOKEN = '54e72f49ddf8c0a6ef8267ef0baccb13ed105f9c0067233a';

// CSS selector for the OTP input on the login page. If left null, we try to
// auto-detect a one-time-code style field (autocomplete=one-time-code, or a
// short text/number/tel input with maxlength ~6).
const CODE_FIELD_SELECTOR = '#tokenEmailContacto';

// ---------------------------------------------------------------------------

function expandLoginAccordion() {
    const toggle = document.querySelector('#toogleAuth');
    if (toggle && getComputedStyle(toggle).display !== 'none') {
        toggle.click();
    }
}

function findCodeField() {
    if (CODE_FIELD_SELECTOR) {
        return document.querySelector(CODE_FIELD_SELECTOR);
    }
    const otc = document.querySelector('input[autocomplete="one-time-code"]');
    if (otc) return otc;
    const candidates = document.querySelectorAll(
        'input[type="text"], input[type="tel"], input[type="number"]'
    );
    for (const el of candidates) {
        const max = parseInt(el.getAttribute('maxlength') || '0', 10);
        if (el.offsetParent !== null && max > 0 && max <= 8) return el;
    }
    return null;
}

function setFieldValue(field, code) {
    // Set value in a way React/Angular controlled inputs will notice.
    const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    setter.call(field, code);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
}

async function fetchCodeOnce() {
    const url = `${BROKER_URL}?token=${encodeURIComponent(BROKER_TOKEN)}`;
    // Fetch via the background worker to avoid page-origin CORS restrictions.
    const res = await chrome.runtime.sendMessage({ type: 'SSO_FETCH_OTP', url });
    if (!res || !res.ok) {
        throw new Error(res && res.error ? res.error : 'fetch failed');
    }
    return res.code || null;
}

async function fillCodeFromEmail(button) {
    const field = findCodeField();
    if (!field) {
        button.textContent = 'No code field found';
        return;
    }
    button.disabled = true;
    // Poll a few times — the email may arrive a moment after you click.
    for (let attempt = 1; attempt <= 15; attempt++) {
        button.textContent = `Fetching code… (${attempt}/15)`;
        try {
            const code = await fetchCodeOnce();
            if (code) {
                setFieldValue(field, code);
                field.focus();
                button.textContent = 'Code filled ✓';
                button.disabled = false;
                return;
            }
        } catch (err) {
            button.textContent = 'Broker error — see console';
            console.error('[seg-social OTP]', err);
            button.disabled = false;
            return;
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    button.textContent = 'No code yet — click to retry';
    button.disabled = false;
}

function addFillButton() {
    if (document.getElementById('sso-otp-fill-btn')) return;
    const button = document.createElement('button');
    button.id = 'sso-otp-fill-btn';
    button.type = 'button';
    button.textContent = 'Fill code from email';
    Object.assign(button.style, {
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999,
        padding: '10px 16px', background: '#004b87', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer',
        fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.25)'
    });
    button.addEventListener('click', () => fillCodeFromEmail(button));
    document.body.appendChild(button);
}

window.addEventListener('load', () => {
    expandLoginAccordion();
    addFillButton();
    // Auto-trigger only on the code screen (where the OTP field exists).
    if (findCodeField()) {
        const button = document.getElementById('sso-otp-fill-btn');
        if (button) fillCodeFromEmail(button);
    }
});
