/**
 * BE695 Peer Evaluation — Collation.gs
 * Metric computation: self-awareness gaps, per-student / per-team rollups,
 * weakest-dimension surfacing, and outlier flags.
 *
 * The math lives in pure functions (no Apps Script services) so it can be
 * unit-tested outside Apps Script — see peer-eval/test/run-tests.js.
 * Sheet I/O wrappers are at the bottom.
 *
 * Everything on the Collation / Team Rollups tabs is INSTRUCTOR-ONLY.
 * Student-facing granularity decisions live in Reports.gs.
 */

// ─────────────────────────── Pure metric functions ───────────────────────────

/**
 * @param {Array} ratingRows [{rater, ratee, isSelf, dims: {dimId: number}}]
 * @param {Array} rosterRows [{email, name, team}]
 * @param {Object} opts { outlierGap, minRatersForOutlier } (defaults from CONFIG)
 * @return {Object} {
 *   students: { email: {
 *     name, team,
 *     self:  {byDim, overall} | null,          // this student's self-assessment
 *     peer:  {byDim, overall, nRaters},        // ratings RECEIVED from peers
 *     gap:   {byDim, overall} | null,          // self − peer mean (self-awareness gap)
 *     flags: [string]
 *   }},
 *   teams: { team: { byDim, overall, weakestDim, nMembers, nSubmitted, outliers: [email] } },
 *   overall: { byDim, weakestDim }
 * }
 */
function collate(ratingRows, rosterRows, opts) {
  opts = opts || {};
  var outlierGap = opts.outlierGap != null ? opts.outlierGap : CONFIG.OUTLIER_GAP;
  var minRatersForOutlier = opts.minRatersForOutlier != null ?
    opts.minRatersForOutlier : CONFIG.MIN_RATERS_FOR_OUTLIER;
  var dimIds = DIMENSIONS.map(function (d) { return d.id; });

  var students = {};
  rosterRows.forEach(function (p) {
    students[p.email] = {
      name: p.name, team: p.team,
      self: null,
      peer: { byDim: {}, overall: null, nRaters: 0 },
      gap: null,
      flags: []
    };
  });

  // Bucket ratings. Ignore rows whose rater or ratee is off-roster.
  var peerReceived = {};   // ratee -> [dims]
  var peerRatersOf = {};   // ratee -> {rater: true}
  var submitted = {};      // rater -> true (submitted anything)
  var teamPeerScores = {}; // team -> dimId -> [scores]

  ratingRows.forEach(function (r) {
    if (!students[r.ratee] || !students[r.rater]) return;
    submitted[r.rater] = true;
    if (r.isSelf) {
      students[r.ratee].self = {
        byDim: pickDims_(r.dims, dimIds),
        overall: meanOfDims_(r.dims, dimIds)
      };
    } else {
      (peerReceived[r.ratee] = peerReceived[r.ratee] || []).push(r.dims);
      (peerRatersOf[r.ratee] = peerRatersOf[r.ratee] || {})[r.rater] = true;
      var team = students[r.ratee].team;
      var bucket = teamPeerScores[team] = teamPeerScores[team] || {};
      dimIds.forEach(function (id) {
        (bucket[id] = bucket[id] || []).push(r.dims[id]);
      });
    }
  });

  // Per-student peer means and self-awareness gap.
  Object.keys(students).forEach(function (email) {
    var s = students[email];
    var received = peerReceived[email] || [];
    s.peer.nRaters = Object.keys(peerRatersOf[email] || {}).length;

    if (received.length > 0) {
      var allScores = [];
      dimIds.forEach(function (id) {
        var scores = received.map(function (d) { return d[id]; });
        s.peer.byDim[id] = mean_(scores);
        allScores = allScores.concat(scores);
      });
      s.peer.overall = mean_(allScores);
    } else {
      dimIds.forEach(function (id) { s.peer.byDim[id] = null; });
      s.flags.push('NO PEER RATINGS RECEIVED');
    }

    if (!submitted[email]) s.flags.push('DID NOT SUBMIT');

    if (s.self && s.peer.overall != null) {
      var gapByDim = {};
      dimIds.forEach(function (id) {
        gapByDim[id] = s.self.byDim[id] - s.peer.byDim[id];
      });
      s.gap = { byDim: gapByDim, overall: s.self.overall - s.peer.overall };
    }
  });

  // Team rollups (peer ratings only — self-assessments excluded from team means).
  var teams = {};
  Object.keys(students).forEach(function (email) {
    var s = students[email];
    if (!teams[s.team]) {
      teams[s.team] = { byDim: {}, overall: null, weakestDim: null,
                        nMembers: 0, nSubmitted: 0, outliers: [] };
    }
    teams[s.team].nMembers++;
    if (submitted[email]) teams[s.team].nSubmitted++;
  });

  Object.keys(teams).forEach(function (team) {
    var t = teams[team];
    var bucket = teamPeerScores[team] || {};
    var allScores = [];
    dimIds.forEach(function (id) {
      var scores = bucket[id] || [];
      t.byDim[id] = scores.length ? mean_(scores) : null;
      allScores = allScores.concat(scores);
    });
    t.overall = allScores.length ? mean_(allScores) : null;
    t.weakestDim = weakestDim_(t.byDim, dimIds);
  });

  // Outlier flags: peer overall well below team overall.
  Object.keys(students).forEach(function (email) {
    var s = students[email];
    var t = teams[s.team];
    if (s.peer.overall != null && t.overall != null &&
        s.peer.nRaters >= minRatersForOutlier &&
        s.peer.overall <= t.overall - outlierGap) {
      s.flags.push('BELOW TEAM (gap ' + (t.overall - s.peer.overall).toFixed(2) + ')');
      t.outliers.push(email);
    }
  });

  // Course-wide weakest dimension (all peer ratings pooled).
  var overallByDim = {};
  dimIds.forEach(function (id) {
    var scores = [];
    Object.keys(teamPeerScores).forEach(function (team) {
      scores = scores.concat(teamPeerScores[team][id] || []);
    });
    overallByDim[id] = scores.length ? mean_(scores) : null;
  });

  return {
    students: students,
    teams: teams,
    overall: { byDim: overallByDim, weakestDim: weakestDim_(overallByDim, dimIds) }
  };
}

function mean_(arr) {
  if (!arr.length) return null;
  var sum = 0;
  for (var i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}

function pickDims_(dims, dimIds) {
  var out = {};
  dimIds.forEach(function (id) { out[id] = dims[id]; });
  return out;
}

function meanOfDims_(dims, dimIds) {
  return mean_(dimIds.map(function (id) { return dims[id]; }));
}

/** Lowest-mean dimension id, or null if no dimension has data. */
function weakestDim_(byDim, dimIds) {
  var worst = null;
  dimIds.forEach(function (id) {
    if (byDim[id] == null) return;
    if (worst === null || byDim[id] < byDim[worst]) worst = id;
  });
  return worst;
}

function round1_(v) {
  return v == null ? null : Math.round(v * 10) / 10;
}

function dimLabel_(id) {
  for (var i = 0; i < DIMENSIONS.length; i++) {
    if (DIMENSIONS[i].id === id) return DIMENSIONS[i].label;
  }
  return id;
}

// ─────────────────────────── Sheet I/O ───────────────────────────

/** Reads the Ratings tab into the pure-function row format (current round only). */
function readRatingRows_() {
  var sheet = getOrCreateSheet_(SHEET_NAMES.RATINGS);
  var values = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1] || '') !== CONFIG.ROUND) continue;
    var dims = {};
    DIMENSIONS.forEach(function (d, j) { dims[d.id] = Number(values[i][5 + j]); });
    rows.push({
      rater: String(values[i][2] || '').trim().toLowerCase(),
      ratee: String(values[i][3] || '').trim().toLowerCase(),
      isSelf: String(values[i][4]) === 'yes',
      dims: dims
    });
  }
  return rows;
}

/** Menu entry: recompute everything and write the Collation + Team Rollups tabs. */
function runCollation() {
  var roster = getRoster_();
  var result = collate(readRatingRows_(), roster.all);
  writeCollationSheets_(result);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Collation complete for ' + CONFIG.ROUND + '.', 'Peer Eval', 6);
  return result;
}

function writeCollationSheets_(result) {
  var dimIds = DIMENSIONS.map(function (d) { return d.id; });
  var dimShorts = DIMENSIONS.map(function (d) { return d.short; });

  // ── Collation (per-student) ──
  var sheet = getOrCreateSheet_(SHEET_NAMES.COLLATION);
  sheet.clearContents();
  var header = ['Email', 'Name', 'Team', 'PeerRaters']
    .concat(dimShorts.map(function (s) { return 'Peer ' + s; }))
    .concat(['Peer Overall'])
    .concat(dimShorts.map(function (s) { return 'Self ' + s; }))
    .concat(['Self Overall', 'Self-Awareness Gap (self − peer)', 'Flags']);
  var rows = [header];

  Object.keys(result.students).sort(function (a, b) {
    var sa = result.students[a], sb = result.students[b];
    return sa.team === sb.team ? sa.name.localeCompare(sb.name)
                               : sa.team.localeCompare(sb.team);
  }).forEach(function (email) {
    var s = result.students[email];
    var row = [email, s.name, s.team, s.peer.nRaters];
    dimIds.forEach(function (id) { row.push(round1_(s.peer.byDim[id])); });
    row.push(round1_(s.peer.overall));
    dimIds.forEach(function (id) { row.push(s.self ? s.self.byDim[id] : null); });
    row.push(s.self ? round1_(s.self.overall) : null);
    row.push(s.gap ? round1_(s.gap.overall) : null);
    row.push(s.flags.join('; '));
    rows.push(row);
  });
  sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');

  // ── Team Rollups ──
  var teamSheet = getOrCreateSheet_(SHEET_NAMES.TEAM_ROLLUPS);
  teamSheet.clearContents();
  var teamHeader = ['Team', 'Members', 'Submitted']
    .concat(dimShorts).concat(['Overall', 'Weakest Dimension', 'Flagged Below Team']);
  var teamRows = [teamHeader];
  Object.keys(result.teams).sort().forEach(function (team) {
    var t = result.teams[team];
    var row = [team, t.nMembers, t.nSubmitted];
    dimIds.forEach(function (id) { row.push(round1_(t.byDim[id])); });
    row.push(round1_(t.overall));
    row.push(t.weakestDim ? dimLabel_(t.weakestDim) : '—');
    row.push(t.outliers.map(function (e) { return result.students[e].name; }).join('; '));
    teamRows.push(row);
  });
  var courseRow = ['ALL TEAMS', '', ''];
  dimIds.forEach(function (id) { courseRow.push(round1_(result.overall.byDim[id])); });
  courseRow.push('');
  courseRow.push(result.overall.weakestDim ? dimLabel_(result.overall.weakestDim) : '—');
  courseRow.push('');
  teamRows.push(courseRow);
  teamSheet.getRange(1, 1, teamRows.length, teamHeader.length).setValues(teamRows);
  teamSheet.setFrozenRows(1);
  teamSheet.getRange(1, 1, 1, teamHeader.length).setFontWeight('bold');
}
