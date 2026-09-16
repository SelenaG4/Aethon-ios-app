# Aethon iOS app: instructions for Claude

## What this project is

A React Native (bare workflow) iOS app for Aethon. The specification is
`docs/BUILD_GUIDE.txt`, a text copy of "Aethon Build Guide v1.0".

This app contains the **carer app** and the **resident app**. Family and
management users use a separate Next.js web app in `~/Developer/aethon-web`.
You may read that folder for reference but must never modify it.

## Scope

Implement these increments, in this order, one at a time:

- 4.1, 4.2, 4.3, 4.4
- 5.1, 5.2, 5.3, 5.4
- 6.1, 6.2, 6.3
- 7.1, 7.2, 7.3
- 10.1, 10.2, 10.3, 10.4, 10.5
- 11.1, 11.2

Do not implement: chapter 2, 3.4 (SQL), 3.5 (sign-in, comes later), 3.6,
chapters 8 and 9 (web app), 11.3, 11.4, appendices A and B.
Ignore the part of prompt 3.2 that creates `src/lib/supabase.ts`.

## Workflow for every increment

1. Read the increment in `docs/BUILD_GUIDE.txt`, including its "Done when" list.
2. Implement it with the adaptations below. Where an adaptation differs from
   the guide, the adaptation wins. Nothing may break the rules in
   "Rules that must not be relaxed".
3. Run `npx tsc --noEmit` and `npx eslint .` and fix every error.
4. If you added a native dependency, run `cd ios && pod install && cd ..`,
   then tell me to rebuild in Xcode (Command + Shift + K, then Command + R).
5. Report: the files you changed, how to check each "Done when" item on the
   iPhone, and any place you deviated from the guide and why.
6. Stop and wait for me to confirm it works on the device before starting
   the next increment. Do not commit; suggest a commit message instead.

## Adaptations

### No backend yet

- Do not use Supabase, `@supabase/supabase-js`, Firebase
  (`@react-native-firebase/*`), push tokens, or any network call.
- All reads and writes go through `src/lib/data.ts` (mock data persisted in
  AsyncStorage). Replace every `supabase.from(...)` in the guide's prompts with
  functions in `data.ts`, adding new ones as needed.
- Replace realtime subscriptions with a small subscribe/notify event emitter in
  `data.ts`, plus a refetch when a screen gains focus.
- There is no signed-in user. Use the fixed sample carer "Test Carer", and for
  the resident app use the first mock resident.
- Keep the temporary role chooser (Carer, Resident, and the small
  "Family or management" link to the web portal).

### Data names follow the web app

- The guide's `clients` table is `residents`; `client_id` is `resident_id`;
  `name` is `first_name` + `last_name`; `room_or_address` is `room_number`.
  `src/lib/mockData.ts` is the source of truth for current names.
- `visit_notes`: store the full note text in `transcript` (plus the guide's
  `raw_transcript`, `transcription_status`, `reviewed_at`, and so on).
  Store only a comma-separated list of ticked task labels in
  `tasks_completed`, because the web family portal displays that field.
  Never put transcript text in `tasks_completed`.
- Physician escalation (7.1 and 7.2): create a row in `escalations`
  `{ resident_id, reason, is_resolved: false, severity: 'physician', visit_note_id }`
  and set `physician_flagged` and `flag_reason` on the note. Recording an
  outcome sets `flag_outcome` and `flag_outcome_at` on the escalation. Any
  outcome other than "Raised, no response yet" also sets `is_resolved: true`
  and `resolved_at`.
- Assistance request (10.5): write to `assistance_requests` as the guide says,
  and also create an `escalations` row with `severity: 'assistance'` and
  `reason: 'Resident asked for help'`, so the web management portal sees it.
- Every table or field that the web app does not have yet must be recorded in
  `docs/SCHEMA_ADDITIONS.md` (table, field, type, purpose, increment), so it
  can be agreed with the web team.

### Design: match the web management portal

- Use the tokens in `src/constants/theme.ts` (COLORS, GRADIENT, TYPE, FONT,
  RADIUS, SPACE, SHADOW), `AppText` for all text, and the existing components
  (Card, StatCard, StatusPill, ActionTile, GradientAvatar, Badge,
  ScreenHeader, SectionTitle). Icons come from `lucide-react-native` only;
  no emoji or text glyphs as icons.
- The guide's colour names map to the same names in `theme.ts`. Where the
  guide gives hex values (for example the handover HTML in 7.3), use the
  matching `theme.ts` values instead.
- Carer app: bottom tabs Clients, To check, Handover, Profile.
  The client list (4.1) is the Clients tab. Profile, voice note, note review,
  escalation, baseline and the care stage modal open as stack screens.
  Use the management style for headers (white, ScreenHeader, COLORS.surfaceAlt
  background) instead of the guide's coloured header.
  "Start shift" / "End shift" (7.3) goes in the Clients tab header.
- Carer screens: no text below 15pt, no tap target below 52pt.
- Resident app: no tab bar, no menu, no drawer (10.3). No resident-facing text
  below 22pt, no control below 80pt, no swipe or long-press, and nothing
  disappears on a timer except the confirmations the guide specifies.
  Same colours, font and icons as the carer app.
- For the care stage labels (4.4), keep the guide's labels for now; they will
  be checked with carers later.

### Library substitutions

- Audio recording: `react-native-nitro-sound` (not
  `react-native-audio-recorder-player`). Record 16 kHz mono WAV, which
  whisper.rn accepts. Check the library's README for its current API.
- Clipboard: `@react-native-clipboard/clipboard`.
- Transcription: `whisper.rn` with `models/ggml-base-q5_1.bin`. Add `bin` to
  `assetExts` in `metro.config.js`. Put `TRANSCRIPTION_LANGUAGE` and
  `VOCABULARY` in `src/constants/config.ts`, defaulting to the guide's `'de'`
  and vocabulary; ask me before changing them. Keep the audio deletion in the
  `finally` block.
- Notifications: Notifee local notifications only. Skip
  `messaging().getToken()` and anything Firebase.
- Assistance delivery (10.5): there is no push delivery yet, so `delivered` is
  always false. Show the guide's honest "could not reach" message. Never tell
  the person help is coming.
- PDF export (7.3): `react-native-html-to-pdf` and `react-native-share`. If
  either fails to build with this React Native version, stop and tell me
  instead of swapping libraries silently.
- Emergency number: `EMERGENCY_NUMBER` in `src/constants/config.ts`, default
  `'144'` as in the guide. Use it in every required sentence that mentions it.

## Rules that must not be relaxed

- Display, do not evaluate (guide 1.4): no scores, thresholds, automatic
  alerts or recommendations. Mapping recorded pain and mood values to band
  colours is the only exception (11.2).
- The medication count is shown plainly and never evaluated (4.2).
- Notes are never confirmed automatically (5.3).
- Follow-up prompts are worded "Ask about ..." (6.3).
- The required sentences listed in 11.2 appear exactly where specified.
- Report honestly: an escalation is "recorded", not "sent" (7.1); a failed
  assistance request shows the failure message (10.5).
- Audio never leaves the device and is deleted after transcription (5.2).

## Never

- Modify anything in `~/Developer/aethon-web`.
- Edit files under `ios/Pods` or `node_modules`.
- Add a second `post_install` block to `ios/Podfile`.
- Remove the deployment-target loop in the existing `post_install` block.
- Commit secrets or the speech model file.
