/**
 * BE695 Peer Evaluation — Code.gs
 * Web app entry points (doGet / doPost), roster access, submission handling.
 *
 * PRIVACY MODEL
 *  - This script is container-bound to a Google Sheet that lives ONLY in the
 *    instructor's BU Google Workspace account. All ratings stay in that Sheet.
 *  - Identity is captured server-side via Session.getActiveUser().getEmail().
 *    Students never type their identity and no codes are distributed.
 *  - Deploy the web app as: Execute as ME (instructor), access "Anyone within
 *    Boston University". Within the same Workspace domain,
 *    Session.getActiveUser() returns the visitor's verified email.
 *
 * TRANSPORT NOTE
 *  - The form submits via google.script.run (the HtmlService same-origin RPC
 *    channel). A raw HTTP POST from the sandboxed HtmlService iframe to the
 *    /exec URL would actually be cross-origin (the page is served from
 *    *.googleusercontent.com), so google.script.run is the reliable path.
 *  - doPost(e) is still provided and delegates to the same handler, so the
 *    endpoint also accepts a direct JSON POST if ever needed.
 */

// ─────────────────────────── Configuration ───────────────────────────

var CONFIG = {
  ALLOWED_DOMAIN: 'bu.edu',
  ROUND: 'Round 1',              // label stamped on every submission
  SCALE_MIN: 1,
  SCALE_MAX: 5,
  OUTLIER_GAP: 0.75,             // flag if student peer mean ≤ team mean − this
  MIN_RATERS_FOR_REPORT: 3,      // suppress peer numbers in a student's report below this
  MIN_RATERS_FOR_OUTLIER: 2,     // don't flag outliers on fewer peer ratings than this
  EMAIL_SUBJECT: 'BE695 Peer Evaluation — Your Individual Report',
  EMAIL_SENDER_NAME: 'BE695 Peer Evaluation'
};

var SHEET_NAMES = {
  ROSTER: 'Roster',           // Email | Name | Team   (instructor fills in)
  SUBMISSIONS: 'Submissions', // one row per submission (double-submit key)
  RATINGS: 'Ratings',         // one row per rater→ratee pair (collation source)
  COLLATION: 'Collation',
  TEAM_ROLLUPS: 'Team Rollups',
  REPORT_EXPORT: 'Report Export'
};

/**
 * The instrument. Five dimensions modeled on the CATME-B five factors
 * (wording is original, not copied from the CATME instrument, which is
 * copyrighted). 1–5 integer scale with behavioral anchors at 1 / 3 / 5.
 */
var DIMENSIONS = [
  {
    id: 'contrib',
    label: "Contributing to the Team's Work",
    short: 'Contributing',
    anchors: {
      5: 'Does more than their fair share; work is complete, on time, and they help teammates with theirs.',
      3: 'Does their fair share; work is usually complete and on time.',
      1: 'Does little or no work, or work is routinely late or unusable.'
    }
  },
  {
    id: 'interact',
    label: 'Interacting with Teammates',
    short: 'Interacting',
    anchors: {
      5: "Actively invites and builds on others' views; communicates clearly, constructively, and respectfully.",
      3: "Responds to and respects others' input; communicates adequately.",
      1: 'Interrupts, ignores, or dismisses teammates; hard to reach or engage.'
    }
  },
  {
    id: 'ontrack',
    label: 'Keeping the Team on Track',
    short: 'On track',
    anchors: {
      5: 'Monitors progress and conditions, notices problems early, and helps the team adjust.',
      3: "Aware of the team's progress and does what is asked to keep things moving.",
      1: 'Unaware of team progress; misses or ignores problems that affect the team.'
    }
  },
  {
    id: 'quality',
    label: 'Expecting Quality',
    short: 'Quality',
    anchors: {
      5: 'Pushes the team toward excellent work and holds their own work to a high standard.',
      3: 'Expects the team to meet requirements; accepts good-enough work.',
      1: 'Content with minimal or substandard work.'
    }
  },
  {
    id: 'ksa',
    label: 'Having Relevant Knowledge, Skills & Abilities',
    short: 'Skills',
    anchors: {
      5: 'Brings strong, relevant skills and learns what the team needs; teammates rely on their expertise.',
      3: 'Has adequate skills for their role and picks up new ones when needed.',
      1: 'Lacks skills the team needs and does not try to acquire them.'
    }
  }
];

// ─────────────────────────── Web app entry points ───────────────────────────

function doGet() {
  var email = getVerifiedEmail_();
  if (!email) {
    return messagePage_('Sign-in required',
      'This form is only available to Boston University accounts. ' +
      'Please open it while signed in to your @' + CONFIG.ALLOWED_DOMAIN +
      ' Google account (use a private/incognito window if you are signed ' +
      'in to multiple Google accounts).');
  }

  var roster = getRoster_();
  var me = roster.byEmail[email];
  if (!me) {
    return messagePage_('Not on the roster',
      'Your BU account (' + email + ') is not on the course roster for this ' +
      'evaluation. If you believe this is an error, contact the instructor.');
  }

  if (hasSubmitted_(email)) {
    return messagePage_('Already submitted',
      'A peer evaluation for ' + CONFIG.ROUND + ' has already been recorded ' +
      'for ' + email + '. Each student submits once per round. ' +
      'Contact the instructor if you need to change your responses.');
  }

  var people = roster.all
    .filter(function (p) { return p.team === me.team; })
    .map(function (p) {
      return { email: p.email, name: p.name, isSelf: p.email === email };
    })
    .sort(function (a, b) {
      // Self first, then alphabetical by name.
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  var template = HtmlService.createTemplateFromFile('Form');
  template.modelJson = safeJson_({
    raterEmail: email,
    raterName: me.name,
    team: me.team,
    round: CONFIG.ROUND,
    scaleMin: CONFIG.SCALE_MIN,
    scaleMax: CONFIG.SCALE_MAX,
    people: people,
    dimensions: DIMENSIONS
  });

  return template.evaluate()
    .setTitle('BE695 Peer Evaluation')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Optional direct-POST entry point; the form itself uses google.script.run.
 * Expects a JSON body identical to the submitEvaluation payload.
 */
function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    result = submitEvaluation(payload);
  } catch (err) {
    result = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────── Submission handling ───────────────────────────

/**
 * Called from the form via google.script.run.
 * payload = {
 *   ratings: [{ ratee: <email>, dims: { contrib: 1..5, ... } }, ...],
 *   comment: <optional string, confidential to instructor>
 * }
 * Identity is NEVER taken from the payload — always from the session.
 */
function submitEvaluation(payload) {
  var email = getVerifiedEmail_();
  if (!email) {
    return { ok: false, error: 'Could not verify a @' + CONFIG.ALLOWED_DOMAIN + ' account for this session. Please sign in with your BU Google account and reload the form.' };
  }

  var roster = getRoster_();
  var me = roster.byEmail[email];
  if (!me) {
    return { ok: false, error: 'Your account (' + email + ') is not on the course roster.' };
  }

  var validation = validateSubmission_(payload, email, me, roster);
  if (validation) return { ok: false, error: validation };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return { ok: false, error: 'The server is busy; please try submitting again in a moment.' };
  }

  try {
    if (hasSubmitted_(email)) {
      return { ok: false, error: 'A submission has already been recorded for ' + email + '.' };
    }

    var now = new Date();
    var comment = String(payload.comment || '').slice(0, 5000);

    // One row per submission — this is the double-submission key.
    getOrCreateSheet_(SHEET_NAMES.SUBMISSIONS).appendRow([
      now, email, me.team, CONFIG.ROUND, JSON.stringify(payload.ratings), comment
    ]);

    // One row per rater→ratee pair — the collation source.
    var ratingsSheet = getOrCreateSheet_(SHEET_NAMES.RATINGS);
    var rows = payload.ratings.map(function (r) {
      var ratee = String(r.ratee).trim().toLowerCase();
      var row = [now, CONFIG.ROUND, email, ratee, ratee === email ? 'yes' : 'no'];
      DIMENSIONS.forEach(function (d) { row.push(Number(r.dims[d.id])); });
      return row;
    });
    ratingsSheet.getRange(ratingsSheet.getLastRow() + 1, 1, rows.length, rows[0].length)
      .setValues(rows);

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** Returns an error string, or null if the payload is valid. */
function validateSubmission_(payload, email, me, roster) {
  if (!payload || !Array.isArray(payload.ratings)) return 'Malformed submission.';

  var expected = roster.all
    .filter(function (p) { return p.team === me.team; })
    .map(function (p) { return p.email; })
    .sort();

  var got = payload.ratings
    .map(function (r) { return String(r.ratee || '').trim().toLowerCase(); })
    .sort();

  if (expected.length !== got.length ||
      expected.some(function (e, i) { return e !== got[i]; })) {
    return 'Submission must rate yourself and every teammate exactly once.';
  }

  for (var i = 0; i < payload.ratings.length; i++) {
    var dims = payload.ratings[i].dims || {};
    for (var j = 0; j < DIMENSIONS.length; j++) {
      var v = dims[DIMENSIONS[j].id];
      if (typeof v !== 'number' || v !== Math.floor(v) ||
          v < CONFIG.SCALE_MIN || v > CONFIG.SCALE_MAX) {
        return 'Every dimension must be rated on the ' + CONFIG.SCALE_MIN +
               '–' + CONFIG.SCALE_MAX + ' scale.';
      }
    }
  }
  return null;
}

// ─────────────────────────── Identity & roster ───────────────────────────

function getVerifiedEmail_() {
  var email = '';
  try {
    email = Session.getActiveUser().getEmail() || '';
  } catch (err) {
    email = '';
  }
  email = email.trim().toLowerCase();
  if (!email) return null;
  if (email.split('@')[1] !== CONFIG.ALLOWED_DOMAIN) return null;
  return email;
}

/**
 * Reads the Roster sheet (Email | Name | Team).
 * Returns { all: [{email, name, team}], byEmail: {email: entry} }.
 */
function getRoster_() {
  var sheet = getOrCreateSheet_(SHEET_NAMES.ROSTER);
  var values = sheet.getDataRange().getValues();
  var all = [];
  var byEmail = {};
  for (var i = 1; i < values.length; i++) { // skip header
    var email = String(values[i][0] || '').trim().toLowerCase();
    var name = String(values[i][1] || '').trim();
    var team = String(values[i][2] || '').trim();
    if (!email || !team) continue;
    var entry = { email: email, name: name || email, team: team };
    all.push(entry);
    byEmail[email] = entry;
  }
  return { all: all, byEmail: byEmail };
}

function hasSubmitted_(email) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.SUBMISSIONS);
  var values = sheet.getDataRange().getValues();
  // Scan from row 0 (header never matches an email) so the guard still works
  // even if initSetup was skipped and the first submission landed in row 1.
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][1] || '').trim().toLowerCase() === email &&
        String(values[i][3] || '') === CONFIG.ROUND) {
      return true;
    }
  }
  return false;
}

// ─────────────────────────── Setup & menu ───────────────────────────

/** Run once after `clasp push` to create the data tabs, then fill in Roster. */
function initSetup() {
  var headers = {};
  headers[SHEET_NAMES.ROSTER] = ['Email', 'Name', 'Team'];
  headers[SHEET_NAMES.SUBMISSIONS] = ['Timestamp', 'RaterEmail', 'Team', 'Round', 'RatingsJSON', 'ConfidentialComment'];
  headers[SHEET_NAMES.RATINGS] = ['Timestamp', 'Round', 'RaterEmail', 'RateeEmail', 'IsSelf']
    .concat(DIMENSIONS.map(function (d) { return d.short; }));

  Object.keys(headers).forEach(function (name) {
    var sheet = getOrCreateSheet_(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers[name]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
    }
  });
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Peer Eval')
    .addItem('1. Set up data tabs', 'initSetup')
    .addItem('2. Run collation', 'runCollation')
    .addItem('3. Build report export (for Outlook)', 'exportReportsToSheet')
    .addItem('4. Preview emails (dry run, sends nothing)', 'sendReportEmailsDryRun')
    .addItem('5. Send report emails via Gmail', 'sendReportEmails')
    .addToUi();
}

// ─────────────────────────── Helpers ───────────────────────────

function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/** JSON-encode for safe inline inclusion inside a <script> block. */
function safeJson_(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function messagePage_(title, body) {
  var html =
    '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">' +
    '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#f1f5f9;font-family:Inter,system-ui,sans-serif;color:#0f172a}' +
    '.card{max-width:480px;margin:24px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;' +
    'padding:32px;box-shadow:0 4px 12px rgba(15,23,42,.08)}' +
    'h1{font-size:20px;margin:0 0 12px;color:#0d9488}p{margin:0;font-size:15px;line-height:1.6;color:#334155}' +
    '</style></head><body><div class="card"><h1>' + escapeHtml_(title) + '</h1><p>' +
    escapeHtml_(body) + '</p></div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('BE695 Peer Evaluation')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
