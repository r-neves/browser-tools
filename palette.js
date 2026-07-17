// Spotlight-style command palette. Toggled by the browser-level shortcut
// declared in manifest.json ("commands" -> toggle-palette), relayed here by
// background.js as a PALETTE_TOGGLE message — the page (and Vimium) never sees
// the shortcut itself. Fuzzy-searches PALETTE_ENTRIES (palette_links.js).
// Enter opens in a new tab; Cmd+Enter navigates the current tab.
(() => {
    const HOST_ID = 'ext-palette-host';
    const MAX_RESULTS = 10;

    // Inline brand-logo SVGs (from simple-icons), rendered in the shadow DOM so
    // they work regardless of the host page's CSP (no network / no img load).
    const svg = (d, color) =>
        `<svg viewBox="0 0 24 24" fill="${color}" aria-hidden="true"><path d="${d}"/></svg>`;
    const ICONS = {
        gcp: svg('M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-2.821-4.552l-.043.043.006-.05A9.344 9.344 0 0 0 12.19 2.38zm-.358 4.146c1.244-.04 2.518.368 3.486 1.15a5.186 5.186 0 0 1 1.862 4.078v.518c3.53-.07 3.53 5.262 0 5.193h-5.193l-.008.009v-.04H6.785a2.59 2.59 0 0 1-1.067-.23h.001a2.597 2.597 0 1 1 3.437-3.437l3.013-3.012A6.747 6.747 0 0 0 8.11 8.24c.018-.01.04-.026.054-.023a5.186 5.186 0 0 1 3.67-1.69z', '#4285F4'),
        gitlab: svg('m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z', '#FC6D26'),
    };
    // Pick an icon by destination host. Add more hosts here as needed.
    function iconFor(entry) {
        const u = entry.url || '';
        if (u.includes('console.cloud.google.com')) return ICONS.gcp;
        if (u.includes('gitlab.com')) return ICONS.gitlab;
        return '';  // others get an empty 16px spacer so text stays aligned
    }

    // Precompute lowercase haystacks once.
    const ENTRIES = PALETTE_ENTRIES.map(e => ({
        ...e,
        hay: (e.title + ' ' + e.keywords).toLowerCase(),
    }));

    let host = null, shadow, input, listEl, results = [], selected = 0;

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.type === 'PALETTE_TOGGLE') host ? close() : open();
    });

    // ---------- fuzzy matching ----------
    // A token scores against a haystack as a substring (best) or as an
    // in-order subsequence (weaker). -1 means no match.
    function scoreToken(hay, token) {
        const idx = hay.indexOf(token);
        if (idx !== -1) {
            let s = 100;
            if (idx === 0 || hay[idx - 1] === ' ') s += 40; // word-boundary start
            s += Math.max(0, 20 - idx);                     // earlier is better
            return s;
        }
        // subsequence: every char in order
        let s = 30, from = 0, prev = -2;
        for (const ch of token) {
            const i = hay.indexOf(ch, from);
            if (i === -1) return -1;
            if (i === prev + 1) s += 3;                     // consecutive run
            if (i === 0 || hay[i - 1] === ' ') s += 5;      // hits word starts
            prev = i; from = i + 1;
        }
        return s - Math.min(20, prev - token.length);       // spread penalty
    }

    function search(query) {
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length) return ENTRIES.slice(0, MAX_RESULTS);
        const scored = [];
        for (const e of ENTRIES) {
            let total = 0, ok = true;
            for (const t of tokens) {
                const s = scoreToken(e.hay, t);
                if (s < 0) { ok = false; break; }           // every token must match
                total += s;
            }
            if (ok) scored.push({ e, total });
        }
        scored.sort((a, b) => b.total - a.total
            || a.e.title.length - b.e.title.length
            || a.e.title.localeCompare(b.e.title));
        return scored.slice(0, MAX_RESULTS).map(x => x.e);
    }

    // ---------- overlay ----------
    function open() {
        host = document.createElement('div');
        host.id = HOST_ID;
        Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '2147483647' });
        // Open (not closed) shadow root: identical style isolation, but lets
        // Vimium's insert-mode detection find the focused input, so it ignores
        // keys typed in the palette.
        shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                #backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.3);
                    display: flex; justify-content: center; align-items: flex-start; }
                #panel { margin-top: 18vh; width: min(640px, 90vw);
                    background: rgba(30,30,34,.98); border-radius: 12px;
                    box-shadow: 0 16px 60px rgba(0,0,0,.5); overflow: hidden;
                    border: 1px solid rgba(255,255,255,.1); }
                #query { width: 100%; padding: 16px 20px; font-size: 20px;
                    background: transparent; border: none; outline: none; color: #eee; }
                #query::placeholder { color: #777; }
                #list { list-style: none; max-height: 420px; overflow-y: auto;
                    border-top: 1px solid rgba(255,255,255,.08); }
                #list:empty { border-top: none; }
                #list li { display: flex; align-items: center; gap: 10px;
                    padding: 10px 20px; cursor: pointer; }
                #list li.sel { background: rgba(80,120,255,.25); }
                .icon { flex: 0 0 16px; width: 16px; height: 16px;
                    display: flex; align-items: center; justify-content: center; }
                .icon svg { width: 16px; height: 16px; display: block; }
                .txt { min-width: 0; }  /* allow .u to truncate */
                .t { color: #eee; font-size: 14px; }
                .u { color: #888; font-size: 11px; overflow: hidden;
                     text-overflow: ellipsis; white-space: nowrap; }
            </style>
            <div id="backdrop"><div id="panel">
                <input id="query" type="text" spellcheck="false" autocomplete="off"
                       placeholder="Search destinations…">
                <ul id="list"></ul>
            </div></div>`;
        input = shadow.getElementById('query');
        listEl = shadow.getElementById('list');
        const backdrop = shadow.getElementById('backdrop');

        input.addEventListener('keydown', onKeydown);
        input.addEventListener('input', () => render(input.value));
        // Click on the dimmed backdrop (not the panel) closes.
        backdrop.addEventListener('mousedown', (e) => {
            if (e.target === backdrop) close();
        });
        // Keep the input focused when clicking inside the panel; open on li click.
        shadow.getElementById('panel').addEventListener('mousedown', (e) => {
            const li = e.target.closest('li');
            e.preventDefault();                              // don't blur the input
            if (li) openResult(results[+li.dataset.i], e.metaKey);
        });
        // If focus escapes the palette (e.g. Vimium handled Escape by blurring
        // the field before our handler could run), close it.
        input.addEventListener('blur', () => requestAnimationFrame(() => {
            if (host && shadow.activeElement !== input) close();
        }));

        (document.body || document.documentElement).appendChild(host);
        input.focus();
        render('');
    }

    function close() {
        if (host) host.remove();
        host = null;
    }

    function render(query) {
        results = search(query);
        selected = 0;
        listEl.replaceChildren(...results.map((r, i) => {
            const li = document.createElement('li');
            li.dataset.i = i;
            if (i === 0) li.className = 'sel';
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.innerHTML = iconFor(r);  // static, trusted SVG constants
            const txt = document.createElement('div'); txt.className = 'txt';
            const t = document.createElement('div'); t.className = 't'; t.textContent = r.title;
            const u = document.createElement('div'); u.className = 'u'; u.textContent = r.url || r.hint || '';
            txt.append(t, u);
            li.append(icon, txt);
            return li;
        }));
    }

    function moveSelection(delta) {
        if (!results.length) return;
        selected = (selected + delta + results.length) % results.length;
        [...listEl.children].forEach((li, i) => li.classList.toggle('sel', i === selected));
        listEl.children[selected].scrollIntoView({ block: 'nearest' });
    }

    function openResult(entry, sameTab) {
        if (!entry) return;
        close();
        if (entry.action) chrome.runtime.sendMessage({ type: 'PALETTE_ACTION', action: entry.action });
        else if (sameTab) location.href = entry.url;
        else chrome.runtime.sendMessage({ type: 'PALETTE_OPEN_TAB', url: entry.url });
    }

    function onKeydown(e) {
        // Contain ALL keys typed in the palette so the host page and other
        // extensions' bubble-phase listeners never see them.
        e.stopPropagation();
        if (e.isComposing) return;                           // don't hijack IME
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); moveSelection(1); }
        else if (e.key === 'ArrowUp'   || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); moveSelection(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); openResult(results[selected], e.metaKey); }
    }
})();
