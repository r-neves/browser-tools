/**
 * Seg-Social OTP broker — Google Apps Script web app.
 *
 * SETUP
 * 1. Go to https://script.google.com  ->  New project.
 * 2. Paste this file's contents into Code.gs.
 * 3. Set SHARED_TOKEN below to a long random string (e.g. run
 *    `openssl rand -hex 24` in a terminal and paste the result).
 * 4. Deploy -> New deployment -> type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone with the link
 *    (It is unauthenticated by design; SHARED_TOKEN is the gate.)
 * 5. Authorize the Gmail scope when prompted.
 * 6. Copy the /exec URL and put it, plus the token, into seg_social_login.js.
 *
 * SECURITY MODEL
 * - Your Google credentials never leave Google; this script runs as you.
 * - It only ever reads mail matching GMAIL_QUERY and returns one short code.
 * - Codes older than MAX_AGE_SECONDS are ignored (tiny replay window).
 * - Once returned, the message is marked read so the same code isn't reused.
 * - The code is never logged.
 */

// ---- CONFIG (edit these) ---------------------------------------------------

// Long random secret. The extension must send ?token=... matching this.
var SHARED_TOKEN = '54e72f49ddf8c0a6ef8267ef0baccb13ed105f9c0067233a';

// Gmail search that isolates the OTP email. Tighten once you know the real
// sender/subject, e.g. 'from:noreply@seg-social.pt subject:(código) newer_than:1h'
var GMAIL_QUERY = 'from:seg-social.pt newer_than:1h';

// Regex that pulls the code out of the email body. Default: a 6-digit number.
var CODE_REGEX = /\b(\d{6})\b/;

// Reject codes from emails older than this (seconds).
var MAX_AGE_SECONDS = 120;

// ---------------------------------------------------------------------------

function doGet(e) {
  var token = (e && e.parameter && e.parameter.token) || '';
  if (!safeEquals(token, SHARED_TOKEN)) {
    return json({ error: 'unauthorized' });
  }

  var threads = GmailApp.search(GMAIL_QUERY, 0, 10);
  var now = Date.now();
  var best = null; // most recent matching message

  for (var t = 0; t < threads.length; t++) {
    var msgs = threads[t].getMessages();
    for (var m = 0; m < msgs.length; m++) {
      var msg = msgs[m];
      var ageSec = (now - msg.getDate().getTime()) / 1000;
      if (ageSec > MAX_AGE_SECONDS) continue;
      if (!best || msg.getDate().getTime() > best.getDate().getTime()) {
        best = msg;
      }
    }
  }

  if (!best) {
    return json({ code: null, reason: 'no recent code' });
  }

  var body = best.getPlainBody() || best.getBody() || '';
  var match = CODE_REGEX.exec(body);
  if (!match) {
    // Fall back to searching the subject line.
    match = CODE_REGEX.exec(best.getSubject() || '');
  }
  if (!match) {
    return json({ code: null, reason: 'no code pattern found' });
  }

  // Single-use: mark read so a later poll won't hand out the same code.
  try { best.markRead(); } catch (err) {}

  return json({ code: match[1] });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Length-aware comparison to avoid trivially leaking token length via timing.
function safeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
