#!/usr/bin/env node
/**
 * Unit tests for the pure metric/report logic in Collation.gs and Reports.gs.
 * Run with:  node peer-eval/test/run-tests.js
 *
 * All data below is SYNTHETIC (fake students, fake teams). No real student
 * data exists in this repository, ever.
 *
 * Strategy: evaluate the .gs sources in a sandbox with stubbed Apps Script
 * globals; only the pure functions (collate, buildReportModels, renderers)
 * are exercised — nothing touches SpreadsheetApp/MailApp.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', 'src');
const sandbox = {
  console,
  // Stubs so top-level evaluation of the .gs files never throws. The pure
  // functions under test must not call any of these.
  SpreadsheetApp: undefined, HtmlService: undefined, ContentService: undefined,
  Session: undefined, LockService: undefined, MailApp: undefined, Logger: console
};
vm.createContext(sandbox);
for (const f of ['Code.gs', 'Collation.gs', 'Reports.gs']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), sandbox, { filename: f });
}

const { collate, buildReportModels, renderReportText, renderReportHtml, CONFIG, DIMENSIONS } = sandbox;

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); }
  else { failures++; console.error('  ✗ FAIL: ' + msg); }
}
function approx(a, b, msg) {
  assert(a != null && Math.abs(a - b) < 1e-9, msg + ` (got ${a}, want ${b})`);
}

const D = DIMENSIONS.map(d => d.id);
function dims(v) { // same value across all 5 dimensions
  const o = {}; D.forEach(id => o[id] = v); return o;
}
function rating(rater, ratee, v, isSelf) {
  return { rater, ratee, isSelf: !!isSelf, dims: typeof v === 'number' ? dims(v) : v };
}

// ── Synthetic roster: Team A (4 students), Team B (5 students) ──
const roster = [
  { email: 'a1@bu.edu', name: 'Alpha One', team: 'Team A' },
  { email: 'a2@bu.edu', name: 'Alpha Two', team: 'Team A' },
  { email: 'a3@bu.edu', name: 'Alpha Three', team: 'Team A' },
  { email: 'a4@bu.edu', name: 'Alpha Four', team: 'Team A' },
  { email: 'b1@bu.edu', name: 'Beta One', team: 'Team B' },
  { email: 'b2@bu.edu', name: 'Beta Two', team: 'Team B' },
  { email: 'b3@bu.edu', name: 'Beta Three', team: 'Team B' },
  { email: 'b4@bu.edu', name: 'Beta Four', team: 'Team B' },
  { email: 'b5@bu.edu', name: 'Beta Five', team: 'Team B' },
];

console.log('\n── Test 1: full participation, hand-computable means ──');
{
  // Team A: everyone gives everyone (incl. self) uniform scores.
  // a1 receives peer scores 4, 4, 5 → mean 13/3; rates self 5.
  const rows = [
    rating('a1', 'a1', 5, true), rating('a1', 'a2', 3), rating('a1', 'a3', 4), rating('a1', 'a4', 4),
    rating('a2', 'a2', 3, true), rating('a2', 'a1', 4), rating('a2', 'a3', 4), rating('a2', 'a4', 3),
    rating('a3', 'a3', 4, true), rating('a3', 'a1', 4), rating('a3', 'a2', 3), rating('a3', 'a4', 4),
    rating('a4', 'a4', 4, true), rating('a4', 'a1', 5), rating('a4', 'a2', 2), rating('a4', 'a3', 5),
  ].map(r => ({ ...r, rater: r.rater + '@bu.edu', ratee: r.ratee + '@bu.edu' }));

  const c = collate(rows, roster.filter(p => p.team === 'Team A'));
  const a1 = c.students['a1@bu.edu'];
  approx(a1.peer.overall, 13 / 3, 'a1 peer overall mean = 13/3');
  assert(a1.peer.nRaters === 3, 'a1 has 3 peer raters');
  approx(a1.self.overall, 5, 'a1 self overall = 5');
  approx(a1.gap.overall, 5 - 13 / 3, 'a1 self-awareness gap = self − peer mean');
  approx(a1.gap.byDim[D[0]], 5 - 13 / 3, 'a1 per-dimension gap matches');

  // Team mean = mean of all 12 peer ratings: a1:(4+4+5) a2:(3+3+2) a3:(4+4+5) a4:(4+3+4) = 45/12
  approx(c.teams['Team A'].overall, 45 / 12, 'Team A mean over all peer ratings = 45/12');
  assert(c.teams['Team A'].nSubmitted === 4, 'Team A: 4 submitted');

  // a2 peer mean = 8/3 ≈ 2.67; team = 3.75; gap 1.08 > 0.75 → outlier.
  const a2 = c.students['a2@bu.edu'];
  approx(a2.peer.overall, 8 / 3, 'a2 peer overall = 8/3');
  assert(a2.flags.some(f => f.startsWith('BELOW TEAM')), 'a2 flagged BELOW TEAM (gap ≈ 1.08 > 0.75)');
  assert(c.teams['Team A'].outliers.includes('a2@bu.edu'), 'a2 listed in team outliers');
  assert(!a1.flags.some(f => f.startsWith('BELOW TEAM')), 'a1 not flagged as outlier');
}

console.log('\n── Test 2: weakest-dimension surfacing ──');
{
  // Everyone scores 5 except dimension "quality" which gets 2.
  const low = dims(5); low.quality = 2;
  const rows = [
    rating('a1@bu.edu', 'a2@bu.edu', low), rating('a2@bu.edu', 'a1@bu.edu', low),
    rating('a1@bu.edu', 'a1@bu.edu', 5, true), rating('a2@bu.edu', 'a2@bu.edu', 5, true),
  ];
  const c = collate(rows, roster.filter(p => p.team === 'Team A'));
  assert(c.teams['Team A'].weakestDim === 'quality', 'team weakest dimension = quality');
  assert(c.overall.weakestDim === 'quality', 'course-wide weakest dimension = quality');
}

console.log('\n── Test 3: small-team edge cases ──');
{
  // Only b1 submits: rates self 4 and all four teammates 3.
  const rows = [
    rating('b1@bu.edu', 'b1@bu.edu', 4, true),
    rating('b1@bu.edu', 'b2@bu.edu', 3), rating('b1@bu.edu', 'b3@bu.edu', 3),
    rating('b1@bu.edu', 'b4@bu.edu', 3), rating('b1@bu.edu', 'b5@bu.edu', 3),
  ];
  const c = collate(rows, roster.filter(p => p.team === 'Team B'));
  const b1 = c.students['b1@bu.edu'];
  assert(b1.peer.overall === null, 'b1 received no peer ratings → peer mean null, no crash');
  assert(b1.gap === null, 'b1 gap null when no peer data');
  assert(b1.flags.includes('NO PEER RATINGS RECEIVED'), 'b1 flagged: no peer ratings');
  const b2 = c.students['b2@bu.edu'];
  assert(b2.peer.nRaters === 1, 'b2 has exactly 1 peer rater');
  assert(!b2.flags.some(f => f.startsWith('BELOW TEAM')),
    'no outlier flag on a single rater (below MIN_RATERS_FOR_OUTLIER)');
  assert(b2.flags.includes('DID NOT SUBMIT'), 'b2 flagged: did not submit');
  assert(c.teams['Team B'].nSubmitted === 1, 'Team B: 1 of 5 submitted');

  // Off-roster rows are ignored, empty ratings don't crash.
  const c2 = collate([rating('ghost@bu.edu', 'b1@bu.edu', 5)], roster.filter(p => p.team === 'Team B'));
  assert(c2.students['b1@bu.edu'].peer.overall === null, 'off-roster rater ignored');
  const c3 = collate([], roster.filter(p => p.team === 'Team B'));
  assert(c3.teams['Team B'].overall === null && c3.overall.weakestDim === null,
    'zero submissions → all-null rollups, no crash');
}

console.log('\n── Test 4: report deanonymization guard ──');
{
  // b2 gets rated by only 2 peers (below MIN_RATERS_FOR_REPORT=3) → suppressed.
  // b1 gets rated by 4 peers → full report.
  const rows = [
    rating('b1@bu.edu', 'b1@bu.edu', 4, true),
    rating('b2@bu.edu', 'b2@bu.edu', 5, true),
    rating('b2@bu.edu', 'b1@bu.edu', 3), rating('b3@bu.edu', 'b1@bu.edu', 4),
    rating('b4@bu.edu', 'b1@bu.edu', 4), rating('b5@bu.edu', 'b1@bu.edu', 5),
    rating('b1@bu.edu', 'b2@bu.edu', 2), rating('b3@bu.edu', 'b2@bu.edu', 3),
  ];
  const c = collate(rows, roster.filter(p => p.team === 'Team B'));
  const models = buildReportModels(c);
  const m1 = models.find(m => m.email === 'b1@bu.edu');
  const m2 = models.find(m => m.email === 'b2@bu.edu');

  assert(!m1.suppressed, 'b1 (4 raters) not suppressed');
  approx(m1.overall.peerMean, 4.0, 'b1 peer mean rounded to 1 dp = 4.0');
  assert(m2.suppressed, 'b2 (2 raters) suppressed below MIN_RATERS_FOR_REPORT');
  assert(m2.overall.peerMean === null && m2.dims.every(d => d.peerMean === null && d.teamMean === null),
    'suppressed report carries NO peer or team numbers');
  assert(m2.overall.self === 5, 'suppressed report still shows self ratings');

  // Rendered artifacts must not leak rater identities/counts or instructor flags.
  for (const render of [renderReportText, renderReportHtml]) {
    const out1 = render(m1), out2 = render(m2);
    assert(!/b[2-5]@bu\.edu/.test(out1) && !/Beta (Two|Three|Four|Five)/.test(out1),
      render.name + ': no rater identities in b1 report');
    assert(!/nRaters|raters|BELOW TEAM|DID NOT SUBMIT|flag/i.test(out1),
      render.name + ': no rater counts or instructor flags leak');
    assert(out2.indexOf('Too few of your teammates') !== -1,
      render.name + ': suppressed report explains why');
  }

  // Reports exist for every roster student, even non-submitters.
  assert(models.length === 5, 'one report model per roster student');
}

console.log('\n── Test 5: rounding hides exact fractions ──');
{
  // 3 raters give 4,4,5 → 4.3333… must surface as 4.3 (1 dp), not the raw fraction.
  const rows = [
    rating('a1@bu.edu', 'a1@bu.edu', 4, true),
    rating('a2@bu.edu', 'a1@bu.edu', 4), rating('a3@bu.edu', 'a1@bu.edu', 4),
    rating('a4@bu.edu', 'a1@bu.edu', 5),
  ];
  const c = collate(rows, roster.filter(p => p.team === 'Team A'));
  const m = buildReportModels(c).find(x => x.email === 'a1@bu.edu');
  approx(m.overall.peerMean, 4.3, 'peer mean pre-rounded to 1 dp in report model');
  assert(renderReportText(m).indexOf('4.3') !== -1 && renderReportText(m).indexOf('4.33') === -1,
    'rendered text shows 4.3, never 4.33…');
}

console.log('');
if (failures) {
  console.error(failures + ' test(s) FAILED');
  process.exit(1);
}
console.log('All tests passed.');
