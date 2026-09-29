## 2.0.17
- Browser harness: extension-list button matches light/dark palette immediately; saved dark theme restored on reload; settings opens normally.

# Validation · 2.0.16
Mock browser: with all four tracks unchecked, automatic mode submits all four built-in IDs and plays an unchecked ballade; turning automatic mode off restores empty manual pool and stops playback.

# Validation · 2.0.15
Chromium mock tests passed: English natural-language default contains no machine response syntax; removed connection notice absent; edited text persists and reaches preferences message; internal JSON protocol is separate; runtime data preserved; reset restores English default; immediate switch and silence-until-end retained. Core tests passed. No live model credentials used.

# Validation · 2.0.14
Mock Chromium/native audio tests passed: custom selection prompt survives reload and reaches request system content; reset restores exact built-in prompt; changed mood interrupts a playing track at 30 seconds and starts selected track near zero; silence still waits until track end. No live provider credentials used.

# Validation · 2.0.13
Chromium mock request inspection passed: latest three combined user/character messages include current message and preserve roles; system/older messages excluded; configured prompts/prefill absent; no PromptManager import; user-message event schedules selection; generation waits for completion; automatic OFF makes no calls. Core tests passed. Live Google authentication remains untested.

# Validation · 2.0.12
Mock Chromium request inspection passed: structured Chat History collection (including system/user/assistant children) excluded before flattening; main prompts, user-role examples and prefill retained; only recent 3 bot outputs included once; older bot and user history absent; original prompt tree untouched; no request when structured snapshot unavailable. Core tests passed. Source integration checked against SillyTavern release PromptManager.setChatCompletion/getMessages; live SillyTavern/provider run not available.

# Validation · 2.0.11
Mock browser tests passed: after manual pause, later scene selection plays the chosen track; reselecting the same track restarts below 3 seconds instead of the paused 40-second position. Other mood/silence behavior and doubled title speed regression checks passed.

# Validation · 2.0.10
Chromium mock tests passed: manual pause resumes to selected music after a later music decision; silence decisions leave paused audio paused; same mood and silence/end behavior retained; measured title animation duration exactly half of 2.0.9.

# Validation · 2.0.9
Native Chromium media ending tests with mocked AI passed: auto-mode same-track restart without API call; silence request leaves current playback uninterrupted then waits after track end; repeated silence stays paused; later music resumes same or different eligible track; explicit manual pause remains paused. Six core tests passed. Live Gemini authentication is not tested.

# Validation · 2.0.8
Integrated Chromium mock tests passed: inherited prompt messages retain order and roles; prefill precedes auxiliary user selection; no added system or forced JSON format; no request until a prompt snapshot exists; saved Studio and Vertex Full/Express routing; OFF cancels and prevents calls; exact English playlist; mobile arrow state/size/opacity; no hover background; faster scrolling duration. Real provider authentication has not been tested with user credentials.

# Validation · 2.0.6
Browser tests with mocked SillyTavern context and intercepted backend responses passed: exact English playlist labels; no API-key field; Google AI Studio / Vertex AI request routing; CSRF headers; Vertex Full/Express saved parameters; unchanged chat settings; automatic OFF cancels stale responses and sends no requests. Six core tests passed. Backend payload checked against official SillyTavern release sources. Live saved credentials/server were not available, so live provider authentication remains untested. Older entries below describe historical versions, not the current authentication path.

# Validation · 2.0.5
Chromium: mobile volume 1 and hidden slider, desktop volume restoration, exact full English titles and extension label, < > icons, 70% option opacity, adjacent minus/plus controls, host gradient/shadow override all passed.

# Validation · 2.0.4
Computed styles verified in Chromium: AI and playback icons use sans-serif; title uses SalonSerif. AI background states verified again.

# Validation · 2.0.3
Verified in Chromium: AI OFF is transparent including hover; AI ON retains background without hover; toggle status text is empty; settings checkbox stays synchronized.

# Validation · 2.0.2
Browser checks passed: long titles remain single-line and animate; short titles stay fixed; narrow viewport recalculates overflow; reduced-motion disables animation.

# Validation · 2.0.1
Additional browser checks passed: activation hides player and stops audio; settings remain accessible for reactivation; size expands 2 → 1 → 0; decoration removed; play border radius 0; serif icon font. Existing playback/AI regression checks passed again.

# Validation · 2.0.0
Verified in headless Chromium with a mocked SillyTavern context and intercepted Gemini REST responses. No live API key, actual Gemini billing request, or installed SillyTavern instance was available.

Passed:
- Native browser decoding of supplied MP3 audio; initial waltz source.
- Exactly four tracks in initial order; pointer and keyboard reorder.
- Full/compact/tiny controls and restoration.
- Repeat-one retains track; random toggle state; pure shuffle excludes current when alternatives exist.
- Track exclusion and all-excluded pause; mood reset defaults.
- Automatic mode OFF makes zero Gemini calls, even with API key entered and chat events firing.
- Automatic mode ON uses separate REST request; no chat-model generation calls.
- Excluded tracks are absent from selection input; invalid selections rejected.
- Unchanged mood response does not replace source or reset playback position.
- Turning OFF while request is in flight discards its late result; subsequent messages cause no calls.
- Seek position; 320px viewport; light and dark previews; exact-card hide/pause.
- Six node core tests; no uncaught browser errors.
- All four bundled MP3s and all cover copies are byte-identical to supplied originals.

Run pure logic checks: `node --test tests/core.test.mjs`.
Real Gemini availability, user API credentials, browser autoplay rules, and individual SillyTavern custom themes require verification in the user's installation.
