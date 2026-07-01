// Background service worker: performs cross-origin fetches on behalf of content
// scripts. Fetches here use the extension's host_permissions and are not subject
// to page-origin CORS, unlike fetch() inside a content script.
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
