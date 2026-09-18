# Schema additions beyond the web app

Fields and tables the carer/resident app reads or writes that
`~/Developer/aethon-web` does not have yet. To be agreed with the web team
before the real Supabase backend is wired up. See `src/lib/mockData.ts` for
current shapes.

| Table | Field | Type | Purpose | Introduced |
|---|---|---|---|---|
| residents | date_of_birth | date (ISO string) | compute displayed age in the client profile | 4.2 |
| residents | allergies | text[] | allergy chips in the client profile | 4.2 |
| residents | physician_name | text | physician section of the client profile | 4.2 |
| residents | physician_email | text | physician section of the client profile | 4.2 |
| residents | emergency_contacts | jsonb array `{ name, relationship, phone, priority }` | contacts section of the client profile | 4.2 |
| residents | care_stage_observed_at | timestamptz | when a carer noticed the current care stage; shown alongside `care_stage_estimated_since` since the two can differ | 4.4 |
| residents | care_stage_estimated_since | timestamptz | carer's estimate of when the current care stage actually began; drives the "Since [month year]" line on the client profile | 4.4 |
| residents | baseline_age | integer, nullable | independence baseline, captured once at enrolment | 4.3 |
| residents | baseline_lives_alone | boolean, nullable | independence baseline | 4.3 |
| residents | baseline_condition_count | integer, nullable | independence baseline | 4.3 |
| residents | baseline_mobility_aid | text enum (`none`, `stick`, `frame`, `wheelchair`), nullable | independence baseline | 4.3 |
| residents | baseline_support_note | text, nullable | independence baseline | 4.3 |
| residents | baseline_recorded_at | timestamptz, nullable | independence baseline; null until a carer records it, never edited afterwards | 4.3 |
| medications | active | boolean | distinguishes a current prescription from a discontinued one; the profile's medication count and list only include active entries | 4.2 |
| medication_acknowledgements | *(whole table)* `{ id, medication_id, resident_id, acknowledged_by, status, acknowledged_at }` | — | audit trail of each time a medication's status was recorded, since the web app only keeps the latest status on the medication row itself | 10.4 |
| visit_notes | carer_name | text | attributes a note to a carer, since there is no sign-in yet | 5.x |
| visit_notes | raw_transcript | text, nullable | the guide's field: unedited on-device transcription output | 5.1 |
| visit_notes | transcription_status | text enum (`pending`, `complete`, `failed`) | drives the Notes tab / client list state while transcription runs in the background | 5.1 |
| visit_notes | transcript | text, nullable | full note text shown to carers/family; starts equal to `raw_transcript`, may be edited during note review (5.3); never derived from `tasks_completed` per CLAUDE.md | 5.x |
| visit_notes | reviewed_at | timestamptz, nullable | note review workflow | 5.3 |
| visit_notes | was_edited | boolean, nullable | whether the carer changed the transcript during review (`edit_distance > 0`); null until reviewed | 5.3 |
| visit_notes | raw_length | integer, nullable | length of `raw_transcript` at the time of review, for context alongside `edit_distance`; null until reviewed | 5.3 |
| visit_notes | edit_distance | integer, nullable | Levenshtein distance between `raw_transcript` and the confirmed text; null until reviewed | 5.3 |
| visit_notes | ask_about_hearing | boolean | optional "worth asking about next visit" reminder; never shown in the family portal | 6.3 |
| visit_notes | ask_about_vision | boolean | optional "worth asking about next visit" reminder; never shown in the family portal | 6.3 |
| visit_notes | ask_about_continence | boolean | optional "worth asking about next visit" reminder; never shown in the family portal | 6.3 |
| visit_notes | physician_flagged | boolean | set together with `flag_reason` when a carer raises the note with the physician | 7.1 |
| visit_notes | flag_reason | text, nullable | the reason entered on EscalationScreen | 7.1 |
| health_logs | *(whole table)* `{ id, resident_id, logged_by, mood, sleep, pain, weight_kg, notes, created_at }` | — | short structured observation (mood 1–5, sleep 1–5, pain 0–10, weight_kg, notes), all optional | 6.1 |
| care_stage_history | *(whole table)* `{ id, resident_id, from_stage, to_stage, observed_at, estimated_since, changed_by, note }` | — | every care stage transition, not just the current one, shown on the client profile's History tab; `from_stage` is null for the row recording a resident's arrival at the service | 4.4 |
| escalations | visit_note_id | text (FK) | the visit note that was flagged when this escalation was raised | 7.1 |
| escalations | flag_outcome | text, nullable | one of the four outcome labels the carer picks on the Notes tab's outcome bar; null while awaiting outcome | 7.2 |
| escalations | flag_outcome_at | timestamptz, nullable | set together with `flag_outcome` | 7.2 |
| shifts | *(whole table)* `{ id, carer_name, started_at, ended_at }` | — | the boundary a handover (7.3) is built from; the current shift's id is also kept in AsyncStorage | 7.3 |
| residents | wants_medication_reminders | boolean | set on the resident onboarding "remind me" step; consumed by medication reminders (10.4) | 10.1 |
| residents | independence_goals | jsonb array `{ text, family_visible }` | recorded verbatim during onboarding step 5; shown on the resident home (10.3), carer profile ("In her own words"), and family portal, filtered by `family_visible` for the last | 10.2 |
| escalations | visit_note_id | text (FK), nullable | made nullable in 10.5 — an assistance-severity escalation isn't tied to any visit note | 10.5 |

Note: most of the above shapes were added to `src/lib/mockData.ts` in an
earlier increment (commit "Add design tokens and sample data layer") before
this file existed. This file was created during 4.2 to catch up on that
bookkeeping; entries are marked with the increment that actually consumes
them on screen, which may be later than when the mock data was first added.

Note on `residents.care_stage`: this field predates this file (see above),
but its stored values changed in 4.4 from placeholder strings (`Independent`,
`Home care`, `Facility`) to the four raw codes the guide specifies
(`independent`, `family_supported`, `professionally_supported`,
`residential`). The displayed labels are the guide's own plain-English
labels for now — CLAUDE.md says these are to be confirmed with carers later,
so the four raw codes may still be worth double-checking against the web
app's actual `clients.care_stage` enum before the real backend is wired up.

Note on `visit_notes.visit_type`: made nullable in 5.4. A voice-captured note
starts with `visit_type: null` and is only set if a carer picks one of the
four options (Medication / Personal care / Social visit / Health check)
in the optional "Add detail" section during note review — nothing here is
mandatory, so a confirmed note can still have a null `visit_type`.

Note on `visit_notes.tasks_completed`: the guide's 5.4 prompt persists tasks
as a JSON object of five booleans in a `tasks` field. Per CLAUDE.md, this app
instead stores a comma-separated list of the ticked task labels straight
into the existing `tasks_completed` text field (which the web family portal
already displays), and never creates a separate `tasks` field.

Note on `health_logs`: this table predates this file's discipline (see the
note above) — the original shape had `heart_rate_bpm`/`blood_pressure`,
neither of which appears anywhere in docs/BUILD_GUIDE.txt. Replaced in 6.1
with the guide's actual 6.1 fields (mood, sleep, pain, weight_kg) since the
vitals fields were an unused placeholder guessed before this increment
existed.

Note on `escalations.severity`: also predates this file's discipline — the
original values (`low`/`medium`/`high`) appear nowhere in the guide either.
Replaced in 7.1 with the two values CLAUDE.md actually specifies for this
field: `physician` (7.1) and `assistance` (10.5, not yet built).

Note on resident onboarding (10.1): the guide's step 2 prefills the name
field from `user_profiles` and step 3 calls `messaging().getToken()` to save
a `push_token` to `user_profiles`. This app has no `user_profiles` table
(CLAUDE.md: residents are named via `residents.first_name`) and no Firebase,
so step 2 reads/writes `residents.first_name` directly and step 3 only
records consent (`residents.wants_medication_reminders`) after
`notifee.requestPermission()`, with no token of any kind stored.

Note on independence goals (10.2): the guide's "SHOW THEM BACK in three
places" lists the resident home, the carer profile tab, and the family
portal. The resident home card is built in 10.3 (which already lists a
"GOALS CARD" in its own prompt), so this increment only adds the carer
profile card. The family portal in this repo (`FamilyPortalScreen.tsx`) is
just a link-out stub to the separate Next.js web app per CLAUDE.md's scope
("chapters 8 and 9 (web app)" are excluded, and that app must never be
modified from here) — the `family_visible`-filtered card belongs there, not
in this app.

Note on 10.1's resident-app text sizes: while building 10.2, found that
10.1's `smallPrint` style (the emergency disclaimer on the Contacts step)
was left at the guide's literal 16pt, and `nameInput`'s height was left at
the guide's literal 76, both below CLAUDE.md's resident-app minimums (22pt
text, 80pt controls). Both were guide values that should have been bumped
at the time, same as the "Not now" button and Skip control were. Fixed in
this pass: `smallPrint` now uses `TYPE.residentMin` (22), `nameInput` now
uses `TOUCH.resident` (80).

Note on `messages` (10.3): this table predates this file's discipline (see
the notes above on `health_logs`/`escalations.severity`) — the seeded shape
had `content` instead of `body`, no `sender_name`, no `image_url`, no
`acknowledged_at`, and allowed a `staff` sender role that nothing in scope
ever produces. Rebuilt to match the guide's actual `messages` table (8.3,
web-app scope, but the shape itself isn't a schema addition — it's the same
table the web app already has, just with `client_id` renamed to
`resident_id` per CLAUDE.md). `sender_role` is now typed as the literal
`'family'`, since this app has no in-app composer (messaging composition is
chapter 8, excluded) and the guide's own messaging feature is family-to-
resident only.

Note on 10.3's resident-app text sizes: same pattern as the 10.1 fixes above
— the guide's own literal values for this screen include several below
CLAUDE.md's 22pt/80pt resident minimums (medication dose 20pt, the
"days in a row" streak pill 18pt, the medication reference footer 15pt,
message body 20pt, the empty-messages line 20pt, and the five mood faces at
76×76). All built at the compliant sizes (`TYPE.residentMin` / 24 / 26 where
the guide is already ≥22, `TOUCH.resident` for the mood faces) instead of
the guide's literal ones.

Note on `medication_acknowledgements.acknowledged_by` (10.4): this table
predates this file's discipline (see the notes above) and was seeded as
`carer_name`, which stopped being accurate once 10.4 added the resident's
own "I took it" / "I skipped it" screen — a resident acknowledging their own
dose isn't a carer. Renamed to `acknowledged_by`, matching the naming
already used on `health_logs.logged_by` for the same reason.

Note on `medications.status` gaining `'skipped'` (10.4): the guide's own SQL
for `medication_acks.status` is `check (status in ('taken','skipped'))`.
This app's pre-existing `MedicationStatus` type only had `'due'`/`'taken'`/
`'missed'`; added `'skipped'` for the resident's own "I skipped it" so it's
recorded honestly rather than collapsed into `'missed'` (which implies no
one acted, not a deliberate choice).

Note on 10.4's notifications (`src/lib/notifications.ts`): the guide's
`setupNotifications` also calls `messaging().getToken()` and saves a push
token to `user_profiles`. Per CLAUDE.md (no Firebase, no backend, local
notifications only), this app's version only creates the Notifee channels
and requests permission — no token of any kind is fetched or stored. The
guide also loops over a `times` array per medication; this app already has
one row per (medication, scheduled_time) pair, so each medication needs
only a single trigger notification.

Note on `AcknowledgeScreen`'s route param (10.4): the guide passes the whole
`medication` object as a route param. This app instead passes only
`{ medicationId }` and re-fetches via `getMedication()`, matching how every
other stack screen in this codebase navigates by id and refetches on
mount/focus rather than trusting a possibly-stale object handed through
navigation params.

Note on assistance requests (10.5): per CLAUDE.md, every request also
creates an `escalations` row (`severity: 'assistance'`, `reason: 'Resident
asked for help'`) so the web management portal sees it, alongside the
`assistance_requests` row the guide itself specifies. That escalation has no
visit note, hence `visit_note_id` becoming nullable (see the table above).

While wiring that row through, found that `getEscalationsAwaitingOutcomeCount`/
`getEscalationsAwaitingOutcome` (used by the carer app's To-check tab for
physician escalations, 7.1/7.2) filtered on `flag_outcome === null` alone,
with no severity check. An assistance escalation always has `flag_outcome:
null` (there's no "outcome" concept for it), so without a fix every
assistance request would have inflated the physician "awaiting outcome"
badge and produced a dead-end row (tapping it opens a notes tab with no
outcome bar to act on, since there's no visit note behind it). Fixed by
scoping both functions to `severity === 'physician'`.

Note on the guide's 3-minute auto-escalation (10.5): `requestAssistance` in
the guide checks whether the first push was acknowledged after 3 minutes and,
if not, contacts the second-priority contact automatically. Per CLAUDE.md
there is no push delivery in this app yet, so `delivered` is always false —
nothing can ever be "acknowledged," which would make the guide's timer fire
unconditionally every single time rather than actually reacting to a real
delivery failure. Not implemented; the resident is told immediately, and
honestly, that the app could not reach the contact and should telephone them
or call the emergency number, per CLAUDE.md's "report delivery honestly"
rule. See `src/lib/assistance.ts`.

Note on the medication streak pill and the threshold audit (11.2): the
resident home's "[n] days in a row" pill only renders once `streak >= 3`,
which is exactly the kind of numeric threshold 11.2's own audit instruction
says to search for and remove, and CLAUDE.md's "Rules that must not be
relaxed" names pain/mood band colouring as the *only* exception to "no
scores, thresholds, automatic alerts or recommendations." The guide's own
10.3 prompt asks for this exact threshold-gated pill, though, so this was a
genuine conflict between the guide and an absolute rule rather than an
oversight. Asked the user directly rather than deciding unilaterally; they
confirmed keeping it as built. Reasoning kept for the record: it's a neutral
adherence/habit counter (common streak-counter UX, no colour or warning
framing) rather than a clinical evaluation of the resident's condition, so
it reads as outside the rule's intent even though it matches its literal
wording.
