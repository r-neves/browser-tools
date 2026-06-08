function setValue(el, value) {
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
}

function fillParts() {
    const parts = [
        { partNumber: 'JNPA', designation: 'R2D2', quantity: '' },
        { partNumber: '0xDS', designation: 'Carbon disk brake', quantity: '4' },
        { partNumber: 'PLAT-534', designation: 'Platinum coil', quantity: '1' },
    ];

    const addBtn = document.querySelector('.mro-btn-add');

    // One row exists on load; click "+ Add Part" until we have enough rows.
    // The button's inline onclick runs in page context, so a real click triggers it.
    let guard = 0;
    while (document.querySelectorAll('#mro-table-body tr').length < parts.length && guard < 20) {
        if (!addBtn) break;
        addBtn.click();
        guard++;
    }

    const rows = document.querySelectorAll('#mro-table-body tr');
    parts.forEach((part, i) => {
        const row = rows[i];
        if (!row) return;
        const inputs = row.querySelectorAll('input');
        setValue(inputs[0], part.partNumber);
        setValue(inputs[1], part.designation);
        if (part.quantity !== '') setValue(inputs[2], part.quantity);
    });
}

function fillForm() {
    setValue(document.getElementById('form-field-name'), 'Rodrigo Neves');
    setValue(document.getElementById('form-field-email'), 'rneves.cse@gmail.com');
    setValue(document.getElementById('form-field-field_fc49f4a'), 'Low'); // Priority
    setValue(document.getElementById('phoneNumber'), '912345678');
    fillParts();
    setValue(document.getElementById('form-field-field_cc5799e'), 'This is a test RN message');
}

function injectFillButton() {
    if (document.getElementById('ext-mrocare-fill-btn')) return;
    if (!document.querySelector('.elementor-form')) return;

    const btn = document.createElement('button');
    btn.id = 'ext-mrocare-fill-btn';
    btn.type = 'button';
    btn.textContent = 'Fill quote form (test)';
    btn.style.cssText = `
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background-color: #2abfbf;
        color: #ffffff;
        border: none;
        cursor: pointer;
        border-radius: 6px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'DM Sans', 'Segoe UI', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    btn.addEventListener('click', fillForm);
    document.body.appendChild(btn);
}

window.addEventListener('load', injectFillButton);
