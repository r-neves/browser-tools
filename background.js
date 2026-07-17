// Background service worker: performs cross-origin fetches on behalf of content
// scripts. Fetches here use the extension's host_permissions and are not subject
// to page-origin CORS, unlike fetch() inside a content script.

// Runs on every worker startup. After the palette "reload" action reloads the
// extension, this fires in the fresh worker and refreshes the tab it was
// triggered from, so that tab gets new content scripts and the palette works
// immediately. The tab id is stashed in storage.local because runtime.reload()
// tears this worker down (storage.session would be wiped by the reload).
chrome.storage.local.get('paletteReloadTabId', ({ paletteReloadTabId }) => {
    if (paletteReloadTabId != null) {
        chrome.storage.local.remove('paletteReloadTabId');
        chrome.tabs.reload(paletteReloadTabId).catch(() => {});
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'SSO_FETCH_OTP') {
        // credentials: 'omit' -> send no Google cookies, so the request is
        // anonymous (like Incognito). Otherwise the extension authenticates as
        // your default account, which may not own the script -> 404.
        fetch(msg.url, { method: 'GET', credentials: 'omit' })
            .then(async (r) => {
                const text = await r.text();
                try {
                    const data = JSON.parse(text);
                    sendResponse({ ok: true, code: data.code || null });
                } catch (e) {
                    // HTML instead of JSON usually means the web app requires
                    // login. Deploy it with "Who has access: Anyone".
                    sendResponse({
                        ok: false,
                        error: `Non-JSON response (HTTP ${r.status}). ` +
                            'Likely the Apps Script deployment requires login — ' +
                            'set "Who has access" to "Anyone". First bytes: ' +
                            text.slice(0, 80)
                    });
                }
            })
            .catch(err => sendResponse({ ok: false, error: String(err) }));
        return true; // keep the message channel open for the async response
    }
});

// Command palette: relay the browser-level shortcut to the active tab. Using
// chrome.commands means the page (and extensions like Vimium) never sees the
// keystroke. Rebind at chrome://extensions/shortcuts.
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-palette') return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PALETTE_TOGGLE' });
    } catch (e) {
        // No content script in this tab: chrome:// pages, Web Store, PDF
        // viewer, or a tab loaded before the extension was (re)loaded — the
        // latter fixes itself when the tab is reloaded.
        console.debug('Palette unavailable on this tab:', e.message);
    }
});

// Command palette: open the chosen result in a new tab next to the current
// one. openerTabId returns focus to the origin tab when the new tab closes.
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type === 'PALETTE_OPEN_TAB' && msg.url) {
        chrome.tabs.create({
            url: msg.url,
            index: sender.tab ? sender.tab.index + 1 : undefined,
            openerTabId: sender.tab?.id,
        });
    } else if (msg?.type === 'PALETTE_ACTION' && msg.action === 'reload-extension') {
        // Stash the triggering tab so the fresh worker can reload it after the
        // extension restarts (see the storage.local.get at the top of this
        // file). Reload only after the write commits, so it survives the reload.
        const tabId = sender.tab?.id;
        const reload = () => chrome.runtime.reload();
        if (tabId != null) chrome.storage.local.set({ paletteReloadTabId: tabId }, reload);
        else reload();
    }
});
