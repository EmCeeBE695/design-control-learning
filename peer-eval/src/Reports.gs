/**
 * BE695 Peer Evaluation — Reports.gs
 * Individual student reports: built as data, rendered to text/HTML, then
 * delivered either by MailApp (Gmail, from the instructor's BU account) or
 * via a plain "Report Export" tab the instructor can mail-merge from Outlook.
 *
 * DEANONYMIZATION GUARD (teams of 4–5 — every choice below is deliberate):
 *  - A student sees only: their SELF ratings, the MEAN of their peers'
 *    ratings, and their TEAM's mean — never any per-rater value.
 *  - No min / max / range / distribution / standard deviation.
 *  - No rater count is shown, and peer numbers are suppressed entirely when
 *    fewer than CONFIG.MIN_RATERS_FOR_REPORT peers responded (a mean of 1–2
 *    raters is effectively an individual's rating).
 *  - Peer and team means are rounded to 1 decimal before they enter the
 *    report model, so exact fractions (e.g. x.25 ⇒ 4 raters) never leave.
 *  - Instructor-only signals (outlier flags, submission status, confidential
 *    comments) never appear in any report.
 */

// ─────────────────────────── Pure report builder ───────────────────────────

/**
 * @param {Object} collation output of collate()
 * @param {Object} opts { minRaters } (default CONFIG.MIN_RATERS_FOR_REPORT)
 * @return {Array} one model per roster student:
 *   { email, name, team, round, suppressed,
 *     dims: [{ label, self, peerMean, teamMean }],   // means pre-rounded, 1 dp
 *     overall: { self, peerMean, teamMean },
 *     noSelf }  // true if the student never submitted a self-assessment
 */
function buildReportModels(collation, opts) {
  opts = opts || {};
  var minRaters = opts.minRaters != null ? opts.minRaters : CONFIG.MIN_RATERS_FOR_REPORT;

  return Object.keys(collation.students).sort().map(function (email) {
    var s = collation.students[email];
    var t = collation.teams[s.team];
    var suppressed = s.peer.nRaters < minRaters;

    var dims = DIMENSIONS.map(function (d) {
      return {
        label: d.label,
        self: s.self ? s.self.byDim[d.id] : null,
        peerMean: suppressed ? null : round1_(s.peer.byDim[d.id]),
        teamMean: suppressed ? null : round1_(t.byDim[d.id])
      };
    });

    return {
      email: email,
      name: s.name,
      team: s.team,
      round: CONFIG.ROUND,
      suppressed: suppressed,
      noSelf: !s.self,
      dims: dims,
      overall: {
        self: s.self ? round1_(s.self.overall) : null,
        peerMean: suppressed ? null : round1_(s.peer.overall),
        teamMean: suppressed ? null : round1_(t.overall)
      }
    };
  });
}

// ─────────────────────────── Renderers ───────────────────────────

var REPORT_PREAMBLE =
  'How to read this: "Peers (mean)" is the average of the ratings your ' +
  'teammates gave you; "Team (mean)" is the average across your whole team. ' +
  'To protect confidentiality, individual teammates’ ratings are never ' +
  'shown — only averages. Scale: 1 (low) to 5 (high).';

var SUPPRESSED_NOTE =
  'Too few of your teammates completed the evaluation for peer averages to ' +
  'be reported confidentially, so only your self-assessment is shown. ' +
  'Peer feedback may be shared in a later round.';

function renderReportText(m) {
  var lines = [];
  lines.push('BE695 Peer Evaluation — ' + m.round);
  lines.push('Individual report for: ' + m.name + ' (' + m.team + ')');
  lines.push('');
  lines.push(REPORT_PREAMBLE);
  lines.push('');
  if (m.suppressed) lines.push(SUPPRESSED_NOTE + '\n');
  if (m.noSelf) lines.push('Note: no self-assessment was recorded for you this round.\n');

  var fmt = function (v) { return v == null ? '—' : v.toFixed(1); };
  var fmtSelf = function (v) { return v == null ? '—' : String(v); };

  lines.push(pad_('Dimension', 44) + pad_('Self', 8) + pad_('Peers (mean)', 14) + 'Team (mean)');
  m.dims.forEach(function (d) {
    lines.push(pad_(d.label, 44) + pad_(fmtSelf(d.self), 8) +
               pad_(fmt(d.peerMean), 14) + fmt(d.teamMean));
  });
  lines.push(pad_('OVERALL', 44) + pad_(fmt(m.overall.self), 8) +
             pad_(fmt(m.overall.peerMean), 14) + fmt(m.overall.teamMean));

  if (!m.suppressed && m.overall.self != null && m.overall.peerMean != null) {
    var gap = Math.round((m.overall.self - m.overall.peerMean) * 10) / 10;
    lines.push('');
    if (gap >= 0.5) {
      lines.push('Your self-assessment is higher than how your teammates rated you (by ' +
                 gap.toFixed(1) + ' points overall). It may be worth checking in with your team about expectations.');
    } else if (gap <= -0.5) {
      lines.push('Your teammates rated you higher than you rated yourself (by ' +
                 Math.abs(gap).toFixed(1) + ' points overall). Your contributions are seen more positively than you may realize.');
    } else {
      lines.push('Your self-assessment closely matches how your teammates rated you.');
    }
  }
  lines.push('');
  lines.push('Questions about this report? Contact the instructor directly.');
  return lines.join('\n');
}

function renderReportHtml(m) {
  var fmt = function (v) { return v == null ? '—' : v.toFixed(1); };
  var fmtSelf = function (v) { return v == null ? '—' : String(v); };
  var td = 'padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;';
  var num = td + 'text-align:center;font-variant-numeric:tabular-nums;';

  var rows = m.dims.map(function (d) {
    return '<tr><td style="' + td + '">' + escapeHtml_(d.label) + '</td>' +
      '<td style="' + num + '">' + fmtSelf(d.self) + '</td>' +
      '<td style="' + num + '">' + fmt(d.peerMean) + '</td>' +
      '<td style="' + num + '">' + fmt(d.teamMean) + '</td></tr>';
  }).join('');

  var overallRow = '<tr><td style="' + td + 'font-weight:700;">Overall</td>' +
    '<td style="' + num + 'font-weight:700;">' + fmt(m.overall.self) + '</td>' +
    '<td style="' + num + 'font-weight:700;">' + fmt(m.overall.peerMean) + '</td>' +
    '<td style="' + num + 'font-weight:700;">' + fmt(m.overall.teamMean) + '</td></tr>';

  var notes = '';
  if (m.suppressed) {
    notes += '<p style="margin:0 0 16px;padding:12px 16px;background:#fef9c3;border-radius:8px;' +
      'font-size:13px;color:#713f12;">' + escapeHtml_(SUPPRESSED_NOTE) + '</p>';
  }
  if (m.noSelf) {
    notes += '<p style="margin:0 0 16px;font-size:13px;color:#64748b;">' +
      'Note: no self-assessment was recorded for you this round.</p>';
  }

  var gapNote = '';
  if (!m.suppressed && m.overall.self != null && m.overall.peerMean != null) {
    var gap = Math.round((m.overall.self - m.overall.peerMean) * 10) / 10;
    var msg = gap >= 0.5 ?
        'Your self-assessment is higher than how your teammates rated you (by ' + gap.toFixed(1) +
        ' points overall). It may be worth checking in with your team about expectations.' :
      gap <= -0.5 ?
        'Your teammates rated you higher than you rated yourself (by ' + Math.abs(gap).toFixed(1) +
        ' points overall). Your contributions are seen more positively than you may realize.' :
        'Your self-assessment closely matches how your teammates rated you.';
    gapNote = '<p style="margin:16px 0 0;padding:12px 16px;background:#f0fdfa;border-radius:8px;' +
      'font-size:13px;color:#134e4a;">' + escapeHtml_(msg) + '</p>';
  }

  return '<div style="max-width:640px;margin:0 auto;font-family:Inter,Helvetica,Arial,sans-serif;' +
    'background:#f1f5f9;padding:24px;">' +
    '<div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:28px;">' +
    '<p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0d9488;">' +
    'BE695 Peer Evaluation — ' + escapeHtml_(m.round) + '</p>' +
    '<h1 style="margin:6px 0 4px;font-size:20px;color:#0f172a;">Individual report for ' +
    escapeHtml_(m.name) + '</h1>' +
    '<p style="margin:0 0 16px;font-size:13px;color:#64748b;">' + escapeHtml_(m.team) + '</p>' +
    '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#334155;">' +
    escapeHtml_(REPORT_PREAMBLE) + '</p>' + notes +
    '<table style="border-collapse:collapse;width:100%;">' +
    '<tr>' +
    '<th style="' + td + 'text-align:left;font-size:12px;color:#64748b;">Dimension</th>' +
    '<th style="' + num + 'font-size:12px;color:#64748b;">Self</th>' +
    '<th style="' + num + 'font-size:12px;color:#64748b;">Peers (mean)</th>' +
    '<th style="' + num + 'font-size:12px;color:#64748b;">Team (mean)</th></tr>' +
    rows + overallRow + '</table>' + gapNote +
    '<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">Questions about this report? ' +
    'Contact the instructor directly. Individual teammates’ ratings are never disclosed.</p>' +
    '</div></div>';
}

function pad_(s, n) {
  s = String(s);
  while (s.length < n) s += ' ';
  return s;
}

// ─────────────────────────── Delivery path 1: Report Export tab ───────────────────────────

/**
 * Menu entry. Writes one row per student — Email | Name | Team | Subject |
 * Body (plain text) — to the "Report Export" tab, ready for an Outlook
 * mail merge (or manual copy-paste). Sends nothing.
 */
function exportReportsToSheet() {
  var models = buildReportModels(runCollation());
  var sheet = getOrCreateSheet_(SHEET_NAMES.REPORT_EXPORT);
  sheet.clearContents();
  var rows = [['Email', 'Name', 'Team', 'Subject', 'Body']];
  models.forEach(function (m) {
    rows.push([m.email, m.name, m.team, CONFIG.EMAIL_SUBJECT, renderReportText(m)]);
  });
  sheet.getRange(1, 1, rows.length, 5).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  SpreadsheetApp.getActiveSpreadsheet().toast(
    (rows.length - 1) + ' reports written to "' + SHEET_NAMES.REPORT_EXPORT +
    '". Nothing was emailed.', 'Peer Eval', 8);
}

// ─────────────────────────── Delivery path 2: MailApp ───────────────────────────

/** Menu entry. Logs what WOULD be sent; sends nothing. */
function sendReportEmailsDryRun() {
  var summary = sendReportEmails_(true);
  SpreadsheetApp.getUi().alert('Dry run — nothing sent', summary, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu entry. Sends one report email per student via the instructor's BU Gmail. */
function sendReportEmails() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert('Send report emails?',
    'This will email every student on the roster their individual report ' +
    'from your BU account. Run the dry run first if you have not. Continue?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;
  var summary = sendReportEmails_(false);
  ui.alert('Send complete', summary, ui.ButtonSet.OK);
}

function sendReportEmails_(dryRun) {
  var models = buildReportModels(runCollation());
  var sent = 0, skipped = [];

  models.forEach(function (m) {
    // Hard guard: only ever mail the allowed domain.
    if (m.email.split('@')[1] !== CONFIG.ALLOWED_DOMAIN) {
      skipped.push(m.email + ' (not @' + CONFIG.ALLOWED_DOMAIN + ')');
      return;
    }
    if (!dryRun) {
      MailApp.sendEmail({
        to: m.email,
        subject: CONFIG.EMAIL_SUBJECT,
        body: renderReportText(m),
        htmlBody: renderReportHtml(m),
        name: CONFIG.EMAIL_SENDER_NAME
      });
    }
    sent++;
  });

  return (dryRun ? 'Would send ' : 'Sent ') + sent + ' report(s).' +
    (skipped.length ? '\nSkipped: ' + skipped.join(', ') : '') +
    (dryRun ? '\nRemaining daily email quota: ' + MailApp.getRemainingDailyQuota() : '');
}
