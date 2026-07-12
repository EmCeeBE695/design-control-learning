# BE695 Peer Evaluation Tool

A self-hosted replacement for Practera's Team360: a Google Apps Script web app
(form) bound to a Google Sheet (data), for peer + self evaluation in a course
of ~26 students in ~6 teams of 4–5.

**Privacy architecture (FERPA-adjacent by design):**

- All student ratings live in **one Google Sheet in the instructor's BU
  Google Workspace account**. Nothing is stored anywhere else; this repo
  contains only code, never data.
- Student identity is captured **server-side** from the verified Google
  session (`Session.getActiveUser().getEmail()`); students never type their
  identity, and non-`bu.edu` accounts are rejected.
- The web app is deployed **"Execute as: Me"** with access restricted to
  **"Anyone within Boston University"**, so the Sheet is never shared with
  students and ratings never leave the BU tenant.
- Student reports expose only self ratings, peer *means*, and team *means* —
  never per-rater data (see "Deanonymization guard" below).

## Files

```
peer-eval/
├── src/
│   ├── appsscript.json   Apps Script manifest (scopes, web app config)
│   ├── Code.gs           doGet/doPost, roster, submission handling, menu
│   ├── Collation.gs      metrics: gaps, rollups, weakest dims, outlier flags
│   ├── Reports.gs        report models, renderers, MailApp + export paths
│   └── Form.html         the student-facing evaluation form
├── test/run-tests.js     Node unit tests for the metric logic (synthetic data)
├── .clasp.json.example   copy to .clasp.json after `clasp create`
└── README.md             this file
```

Source of truth is this repo; deploy with [clasp](https://github.com/google/clasp).

## One-time setup

Everything below runs as **you**, on your machine, with your BU Google
account (Duo prompts happen at `clasp login` and at first script
authorization).

### 1. Install and log in to clasp

```bash
npm install -g @google/clasp
clasp login          # opens browser → sign in with your BU account + Duo
```

Then enable the Apps Script API for your account (one click):
<https://script.google.com/home/usersettings> → "Google Apps Script API" → On.

### 2. Create the bound Sheet + script

```bash
cd peer-eval
clasp create --type sheets --title "BE695 Peer Evaluation (Data)" --rootDir ./src
```

This creates a new Google Sheet **in your BU Drive** with a bound Apps Script
project, and writes `.clasp.json` locally (gitignored — it holds your script
ID). Add `"fileExtension": "gs"` and `"rootDir": "src"` if not already present
(see `.clasp.json.example`).

> If `clasp create` complains that files already exist, run
> `clasp push -f` afterwards instead — the goal is just: new bound project,
> local `src/` pushed to it.

### 3. Push the code

```bash
clasp push -f        # -f to overwrite the manifest with src/appsscript.json
clasp open           # opens the Apps Script editor (on clasp v3: clasp open-script)
```

### 4. Initialize the Sheet and fill the roster

1. Open the Sheet itself (from Drive, or the editor's "Overview" link).
2. Reload it — a **"Peer Eval"** menu appears. Run **"1. Set up data tabs"**.
   The first run triggers the Google authorization screen (this is where you
   approve the scopes; Duo may prompt).
3. Fill the **Roster** tab: one row per student — `Email` (their
   `@bu.edu` address, as Google knows it), `Name`, `Team` (any label, e.g.
   "Team 1"). *This is the only place real student data is ever entered, and
   you enter it yourself.*
4. **Sharing: leave the Sheet unshared** (private to you). Students interact
   only through the web app, which executes as you.

### 5. Deploy the web app

In the Apps Script editor:

1. **Deploy → New deployment → Web app**
2. Execute as: **Me**
3. Who has access: **Anyone within Boston University** (the domain option —
   this is what makes `Session.getActiveUser()` return each student's
   verified email and blocks non-BU accounts at Google's front door;
   the script re-checks the `bu.edu` domain as a second layer).
4. Copy the `.../exec` URL — that's the link you give students (Blackboard,
   email, etc.).

After future code changes: `clasp push -f`, then **Deploy → Manage
deployments → ✎ → Version: New version → Deploy**. (The `/exec` URL is
stable; pushes alone don't go live until you create a new version.)

## Test one round-trip (before students see it)

1. Add a row to **Roster** with your own BU email, name, and team `TEST`
   (a one-person team is fine — you'll just do the self-assessment).
2. Open the `/exec` URL in a browser signed in to your BU account. You should
   see the form with "Submitting as \<your email\> · TEST".
3. Submit. Verify one new row in **Submissions** and one row per ratee in
   **Ratings**.
4. Reload the `/exec` URL — you should get the "Already submitted" page
   (double-submission guard).
5. Sheet menu → **"2. Run collation"** → check the **Collation** and
   **Team Rollups** tabs.
6. Menu → **"3. Build report export"** → check the **Report Export** tab, and
   **"4. Preview emails (dry run)"** → confirms recipient count without
   sending.
7. Clean up: delete your test rows from Roster, Submissions, and Ratings.
   (Deleting the Submissions row is what re-enables the form for that email.)

## Running a round

1. Confirm `CONFIG.ROUND` in `src/Code.gs` (e.g. `'Round 1'`), push + new
   version if changed. Submissions are keyed per (email, round), so **for a
   second round just change `CONFIG.ROUND`** and redeploy — same URL, everyone
   can submit again, and collation only reads the current round.
2. Send students the `/exec` link.
3. Watch the **Submissions** tab fill up; **Team Rollups** shows
   submitted-per-team counts after a collation run.
4. After the deadline: menu → **Run collation**, review **Collation** (gaps,
   flags) and **Team Rollups** (weakest dimensions, outliers).

## Sending reports (two decoupled paths — pick after checking with BU IT)

Report **generation** is separate from **sending**; both paths recompute from
the latest data when run.

- **Path A — Gmail/MailApp** (menu items 4 & 5): sends each student their
  individual report from your BU address. Hard-coded to refuse any
  recipient outside `bu.edu`. Always run the **dry run** first (item 4 —
  sends nothing, reports count + remaining daily quota; the ~1,500/day
  Workspace quota is a non-issue for 26 students).
- **Path B — Outlook export** (menu item 3): writes a **Report Export** tab
  with `Email | Name | Team | Subject | Body` (plain text), ready for an
  Outlook mail merge or manual copy-paste. Nothing is emailed.

### Deanonymization guard (teams of 4–5)

Student reports show **only**: their own self-ratings, the **mean** of peer
ratings, and the **team mean** — each rounded to 1 decimal. They never
include per-rater values, min/max/range, distributions, rater counts, outlier
flags, submission status, or confidential comments. If fewer than
`CONFIG.MIN_RATERS_FOR_REPORT` (default 3) peers rated a student, all peer
and team numbers are suppressed for that student and the report says why.

## Configuration knobs (`src/Code.gs` → `CONFIG`)

| Key | Default | Meaning |
|---|---|---|
| `ROUND` | `'Round 1'` | Label + double-submission key; change per round |
| `OUTLIER_GAP` | `0.75` | Flag student if peer mean ≤ team mean − this |
| `MIN_RATERS_FOR_REPORT` | `3` | Below this, suppress peer numbers in the student's report |
| `MIN_RATERS_FOR_OUTLIER` | `2` | Below this, never raise an outlier flag |

## Running the logic tests locally

```bash
node peer-eval/test/run-tests.js
```

Pure-function tests of the collation and report logic with **synthetic**
data only (fake students/teams). No Google credentials needed.

## Troubleshooting

- **Form says "Sign-in required" for a BU student** — they're signed in to a
  personal Google account. Have them use an incognito window signed in only
  to BU, or switch accounts. (Multi-login is the #1 support issue with
  domain-restricted web apps.)
- **"Not on the roster"** — the email Google reports doesn't match the
  Roster row (aliases, typos). Roster emails must be the canonical
  `@bu.edu` address, lowercase-insensitive.
- **Menu doesn't appear** — reload the Sheet; if still missing, run any
  function once from the Apps Script editor to complete authorization.
- **Code changes not visible at the /exec URL** — you pushed but didn't
  create a new deployment version (see step 5).
