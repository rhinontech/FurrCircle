# FurrCircle Mobile App — Non-Functional Audit
> Generated: 2026-04-04 | Auditor: Claude Sonnet 4.6

## Summary

- **Total screens audited:** 32
- **Screens with issues:** 29 of 32
- **Screens fully static (0 real API calls):** `(vet-tabs)/community.tsx`, `(vet-tabs)/patients.tsx`, `profile/pets.tsx`, `profile/vets.tsx`, `profile/posts.tsx`, `profile/security.tsx`, `profile/settings.tsx`

**Critical blocking flows (top 5):**
1. **Owners cannot view their own appointments** — `GET /appointments/owner` exists in the backend but no screen calls it; no owner-facing appointment list screen exists
2. **Health screen quick actions from Home are broken** — "Log Vaccine" and "Vitals" navigate to `/health/vaccines` and `/health/vitals` without a `petId` param, causing the screens to silently bail and show a permanent loading spinner
3. **Vet Patients screen is fully hardcoded** — pushes `/pets/buddy` (name, not UUID) which will 404 against the real API
4. **No way to create a reminder** — the Reminders screen has no "Add" button; `POST /reminders` exists in the backend but is never called from the frontend
5. **API base URL defaults to `http://localhost:5000/api`** — will fail on any physical device or Android emulator without a proper `.env` override

---

## Screen-by-Screen Audit

---

### Root Layout — `app/_layout.tsx`
**Status:** MOSTLY WORKING

#### Hardcoded Data
- [ ] `GlobalHeader` Bell badge is always shown (red dot hardcoded) — no unread count from backend

#### Non-functional Buttons / CTAs
- [ ] Bell icon in `GlobalHeader`: `<Pressable>` wraps the bell with no `onPress` — tapping does nothing

#### Missing Navigation
- [ ] `appointments/book`, `health/add-*`, all `profile/*` screens not in `<Stack>` declarations — will use default options

#### Missing API Calls
- [ ] Bell icon should fetch unread notification count on mount

#### Notes
- `NotificationBanner` mounts globally and fires a hardcoded toast 2 seconds after every login (see NotificationBanner audit below)
- NativeWind v4 confirmed active via `package.json` + `global.css` import — `StatusChip`/`ReminderCard` className syntax is valid

---

### Login — `app/login.tsx`
**Status:** MOSTLY WORKING

#### Non-functional Buttons / CTAs
- [ ] No "Forgot Password?" link — `POST /auth/reset-password` exists on backend but no UI surface

#### Form Issues
- [ ] No email format validation
- [ ] No minimum password length check
- [ ] No "show/hide" password toggle

#### Notes
- Core login flow works end-to-end ✓

---

### Signup — `app/signup.tsx`
**Status:** MOSTLY WORKING

#### Hardcoded Data
- [ ] Role options only "owner" and "veterinarian" — "shelter" role exists in backend but cannot be registered via app

#### Form Issues
- [ ] No password confirmation field
- [ ] No email format validation
- [ ] No minimum password length
- [ ] Vet sign-up missing `clinic_name`, `specialty`, `license_number` fields — will be null on first login

#### Auth / Context Issues
- [ ] After vet registers, `isVerified: false` — no UI feedback telling vet they must wait for admin approval

---

### Onboarding — `app/onboarding.tsx`
**Status:** FULLY WORKING ✓

---

### Home Screen — `app/(tabs)/index.tsx`
**Status:** PARTIALLY WIRED

#### Hardcoded Data
- [ ] "Nearby Vets" section is hardcoded: `VetCard name="PawCare Clinic"` and `VetCard name="Happy Tails Hospital"` — not from API
- [ ] "Community Spotlight" block is hardcoded: static image, author, text — not from API
- [ ] `item.healthScore || '90'` — backend returns dummy 95/75, not a real score
- [ ] Greeting always "Good morning 👋" — no time-of-day logic

#### Missing Navigation
- [ ] Quick Action "Log Vaccine" → `router.push("/health/vaccines")` — no `petId`. Screen does `if (!petId) return` before `setLoading(false)` → **infinite loading spinner**
- [ ] Quick Action "Vitals" → `router.push("/health/vitals")` — same petId problem

#### Missing API Calls
- [ ] Nearby Vets section should call `GET /appointments/vets`
- [ ] Community Spotlight should call `GET /community/feed` for latest post

#### Missing States
- [ ] No error state on fetch failure

---

### Pets Tab — `app/(tabs)/pets.tsx`
**Status:** MOSTLY WORKING

#### Hardcoded Data
- [ ] `pet.reminderCount` accessed but never returned by `GET /pets` — reminder badge never shows

#### Missing States
- [ ] No error state on fetch failure

---

### Discover Tab — `app/(tabs)/discover.tsx`
**Status:** PARTIALLY WIRED

#### Non-functional Buttons / CTAs
- [ ] "View all" for Nearby Vets: `<Text>` element with no `<Pressable>` — not tappable at all
- [ ] "Contact" button in vet detail modal: no `onPress`
- [ ] "Adopt [name]" button in pet detail modal: no `onPress`
- [ ] "Visit Website" button in shelter detail modal: no `onPress`

#### Notes
- `GET /auth/users/shelter` is an unprotected endpoint (no `protect` middleware on backend) — security concern
- Shelter role cannot be registered via signup screen

---

### Community Tab — `app/(tabs)/community.tsx`
**Status:** MOSTLY WORKING

#### Non-functional Buttons / CTAs
- [ ] "See All" for Events: `<Pressable>` with no `onPress`
- [ ] Comment button on every post: no `onPress` — no comment input, no API call
- [ ] Share button on every post: no `onPress`
- [ ] Bookmark button on every post: no `onPress`

#### Missing API Calls
- [ ] `POST /community/posts/:id/comment` — backend exists, no UI
- [ ] No post detail / comment thread screen

#### Auth / Context Issues
- [ ] `isPostLiked` calls `postLikes.some(l => l.userId === user?.id)` — will throw if `user` is null; needs null guard

---

### Profile Tab — `app/(tabs)/profile.tsx`
**Status:** PARTIALLY WIRED

#### Hardcoded Data
- [ ] "Saved Vets" count hardcoded `"5"` — no saved-vets feature exists on backend
- [ ] "My Posts" count hardcoded `"8"` — no API call
- [ ] `user?.petCount ?? 3` — fallback `3` is hardcoded; `petCount` not in login response
- [ ] `user?.memberSince ?? "2022"` — not in any backend response

#### Auth / Context Issues
- [ ] `user?.avatar` is a URL string but used directly as `Image source` — should be `{ uri: user.avatar }` syntax

---

### Vet Dashboard — `app/(vet-tabs)/dashboard.tsx`
**Status:** MOSTLY WORKING

#### Hardcoded Data
- [ ] Greeting always "Good morning 👋"
- [ ] `user?.clinic_name || "PetCare Clinic"` fallback is hardcoded (clinic_name not in login response)

#### Non-functional Buttons / CTAs
- [ ] "View all" for Today's Schedule: `<Text>` with no `onPress`
- [ ] Each appointment card: no `onPress`

---

### Vet Appointments — `app/(vet-tabs)/appointments.tsx`
**Status:** MOSTLY WORKING

#### Notes
- [ ] Status filter uses `'done'` on lines 66-67 but backend only allows `'completed'` — appointments with status `'done'` would show in wrong tab. Fix: replace all `'done'` references with `'completed'`
- [ ] Appointment card: no `onPress`

---

### Vet Profile — `app/(vet-tabs)/profile.tsx`
**Status:** PARTIALLY WIRED

#### Hardcoded Data
- [ ] Patients count hardcoded `24`
- [ ] `user?.yearsExp || "5"` renders as `"5+ M"` — copy bug, should be `"5+ yrs"`
- [ ] `user?.rating || "4.8"` — `rating` not in login response

#### Non-functional Buttons / CTAs
- [ ] "Appointment History": no `onPress`
- [ ] "All Patients": no `onPress`
- [ ] "My Reviews": no `onPress`
- [ ] "Working Hours": no `onPress`
- [ ] "Verification Status": no `onPress`
- All 5 destination screens do not exist

---

### Vet Community — `app/(vet-tabs)/community.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] `const posts = [...]` — 3 hardcoded posts with local images, static likes/comments

#### Non-functional Buttons / CTAs
- [ ] Like button: no `onPress`
- [ ] Comment button: no `onPress`
- [ ] Share button: no `onPress`
- [ ] Pin button: no `onPress` (also no pin API endpoint on backend)

#### Missing API Calls
- [ ] No call to `GET /community/feed` at all

---

### Vet Patients — `app/(vet-tabs)/patients.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] `const patients = [...]` — 5 hardcoded patients with fake dates, visits, local images

#### Missing Navigation
- [ ] `router.push(`/pets/${p.name.toLowerCase()}`)` → `/pets/buddy` — uses name not UUID, will 404

#### Missing API Calls
- [ ] No API call at all — should derive from `GET /appointments/vet`

#### Notes
- Backend `getPetById` enforces `ownerId === req.user.id` — vets cannot access patient pet details. A new vet-scoped endpoint is needed.

---

### Vaccines Screen — `app/health/vaccines.tsx`
**Status:** PARTIALLY WIRED

#### Non-functional Buttons / CTAs
- [ ] "+" button in header: no `onPress` — should navigate to `/health/add-vaccine?petId=${petId}`
- [ ] "Download Certificate" button: no `onPress`

#### Missing Navigation
- [ ] When launched from Home quick action without `petId`: `if (!petId) return` bails before `setLoading(false)` → **infinite loading spinner**

---

### Vitals Screen — `app/health/vitals.tsx`
**Status:** PARTIALLY WIRED

#### Non-functional Buttons / CTAs
- [ ] "+" button in header: no `onPress` — should navigate to `/health/add-vital?petId=${petId}`

#### Missing Navigation
- [ ] Same petId-less infinite spinner issue as vaccines

---

### Medications Screen — `app/health/meds.tsx`
**Status:** PARTIALLY WIRED

#### Hardcoded Data
- [ ] Empty state text: `"No weight medication found"` — copy error

#### Non-functional Buttons / CTAs
- [ ] FAB "+": `onPress={() => {/* TODO */}}` — explicit TODO, should navigate to `/health/add-med?petId=${petId}`
- [ ] "Log Dose" button on each card: no `onPress`

---

### Medical Records Screen — `app/health/records.tsx`
**Status:** PARTIALLY WIRED

#### Non-functional Buttons / CTAs
- [ ] FAB "+": `onPress={() => {/* TODO */}}` — should navigate to `/health/add-record?petId=${petId}`

#### Notes
- Pet detail "Visits" and "Records" quick actions both route to `records.tsx` — likely unintentional duplicate

---

### Add Vaccine — `app/health/add-vaccine.tsx`
**Status:** MOSTLY WORKING (unreachable via UI)

#### Form Issues
- [ ] Date fields are plain TextInput (YYYY-MM-DD) — no date picker
- [ ] No guard if `petId` is undefined — posts to `/health/vaccines/undefined`

---

### Add Vital — `app/health/add-vital.tsx`
**Status:** MOSTLY WORKING (unreachable via UI)

#### Form Issues
- [ ] `type` is free text — inconsistent strings break icon/color logic in vitals.tsx; should use a picker
- [ ] No `petId` guard

---

### Add Medication — `app/health/add-med.tsx`
**Status:** MOSTLY WORKING (unreachable via UI)

#### Form Issues
- [ ] No `endDate` field
- [ ] `startDate` hardcoded to `new Date().toISOString()` — user can't specify past date
- [ ] No `petId` guard

---

### Add Medical Record — `app/health/add-record.tsx`
**Status:** MOSTLY WORKING (unreachable via UI)

#### Form Issues
- [ ] `date` hardcoded to `new Date().toISOString()` — user can't specify past visit date
- [ ] No `petId` guard

---

### Pet Detail — `app/pets/[id].tsx`
**Status:** MOSTLY WORKING

#### Notes
- [ ] "Visits" and "Records" quick actions both route to `/health/records?petId=${id}` — duplicate
- [ ] Vets cannot call `GET /pets/:id` for a patient's pet (enforces `ownerId === req.user.id`)

---

### Add/Edit Pet — `app/pets/add.tsx`
**Status:** MOSTLY WORKING

#### Non-functional Buttons / CTAs
- [ ] "Add Photo" button: no `onPress` — no image picker, no avatar upload

#### Notes
- Create/update/delete all call correct API endpoints ✓

---

### Book Appointment — `app/appointments/book.tsx`
**Status:** MOSTLY WORKING

#### Form Issues
- [ ] Date and time are plain TextInput — no date/time picker
- [ ] If accessed without `vetId` param, POST will fail with backend 404
- [ ] No date format validation

---

### Reminders Screen — `app/reminders/index.tsx`
**Status:** PARTIALLY WIRED

#### Non-functional Buttons / CTAs
- [ ] No "Add Reminder" FAB or button — `POST /reminders` backend endpoint unused
- [ ] No delete button — `DELETE /reminders/:id` backend endpoint unused
- [ ] No edit button — `PUT /reminders/:id` backend endpoint unused

---

### Profile — My Pets — `app/profile/pets.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] `const pets = [{ id:'buddy', name:'Buddy'... }]` — 3 hardcoded pets with local images

#### Notes
- Redundant with `(tabs)/pets.tsx` which is already wired to API; should reuse it

---

### Profile — Saved Vets — `app/profile/vets.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] `const savedVets = [...]` — 3 hardcoded vets

#### Non-functional Buttons / CTAs
- [ ] "Call Clinic": no `onPress`
- [ ] "Consult": no `onPress`

#### Notes
- No backend model for saved/bookmarked vets — feature entirely fabricated

---

### Profile — My Posts — `app/profile/posts.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] `const myPosts = [...]` — 3 hardcoded posts

#### Non-functional Buttons / CTAs
- [ ] `<MoreVertical>` button: no `onPress`

#### Notes
- No backend endpoint for user's own posts — needs `GET /community/posts?userId=me`

---

### Profile — Privacy & Security — `app/profile/security.tsx`
**Status:** FULLY STATIC

#### Non-functional Buttons / CTAs
- [ ] "Change Password": `action: () => {}` — empty function
- [ ] "Two-Factor Auth" toggle: local state only, no API call
- [ ] "Face ID / Fingerprint" toggle: local state only, no API call
- [ ] "Profile Visibility": `action: () => {}` — empty
- [ ] "Show My Location" toggle: local state only

---

### Profile — App Settings — `app/profile/settings.tsx`
**Status:** FULLY STATIC

#### Hardcoded Data
- [ ] "Storage Used": `"128 MB"` hardcoded
- [ ] "App Version": `"v2.4.0"` hardcoded

#### Non-functional Buttons / CTAs
- [ ] Every single action in the settings list: `action: () => {}` — all empty

---

## UI Components

### `components/ui/StatusChip.tsx`
**Status:** WORKS — NativeWind v4 confirmed

### `components/ui/ReminderCard.tsx`
**Status:** ORPHANED — never imported anywhere in the codebase; can be deleted or wired up

### `components/ui/VetCard.tsx`
**Status:** PARTIALLY WIRED
- [ ] "Call" button: no `onPress`, no phone number prop — should use `Linking.openURL('tel:...')`

### `components/ui/EventCard.tsx`
**Status:** WORKS — `onPress` prop accepted but callers don't pass it

### `components/ui/NotificationBanner.tsx`
**Status:** BROKEN — hardcoded content, fires every session
- [ ] Title/message are static ("Puppy Social Mixer" April 15)
- [ ] `setTimeout` fires 2 seconds after every login
- [ ] Tapping banner does nothing (no `onPress`)

---

## Backend Coverage Map

| Endpoint | Method | Called By | Should Also Be Called By |
|---|---|---|---|
| `/auth/register` | POST | `signup.tsx` ✓ | — |
| `/auth/login` | POST | `login.tsx` ✓ | — |
| `/auth/me` | GET | `AuthContext` startup ✓ | — |
| `/auth/profile` | PUT | `AuthContext.updateProfile()` (never triggered from UI) | `profile/security.tsx` |
| `/auth/reset-password` | POST | **Nobody** | `login.tsx` |
| `/auth/users/:role` | GET | `discover.tsx` ✓ | — |
| `/pets` | GET | `(tabs)/pets.tsx` ✓, `appointments/book.tsx` ✓, `index.tsx` ✓ | `profile/pets.tsx` |
| `/pets` | POST | `pets/add.tsx` ✓ | — |
| `/pets/:id` | GET | `pets/[id].tsx` ✓ | — |
| `/pets/:id` | PUT | `pets/add.tsx` ✓ | — |
| `/pets/:id` | DELETE | `pets/add.tsx` ✓ | — |
| `/pets/:id/listing` | PATCH | `pets/[id].tsx` ✓ | — |
| `/pets/discover` | GET | `discover.tsx` ✓ | — |
| `/health/vaccines/:petId` | GET | `health/vaccines.tsx` ✓ | — |
| `/health/vaccines/:petId` | POST | `health/add-vaccine.tsx` ✓ | — |
| `/health/vitals/:petId` | GET | `health/vitals.tsx` ✓ | — |
| `/health/vitals/:petId` | POST | `health/add-vital.tsx` ✓ | — |
| `/health/meds/:petId` | GET | `health/meds.tsx` ✓ | — |
| `/health/meds/:petId` | POST | `health/add-med.tsx` ✓ | — |
| `/health/records/:petId` | GET | `health/records.tsx` ✓ | — |
| `/health/records/:petId` | POST | `health/add-record.tsx` ✓ | — |
| `/appointments/vets` | GET | `discover.tsx` ✓ | `(tabs)/index.tsx` Nearby Vets section |
| `/appointments` | POST | `appointments/book.tsx` ✓ | — |
| `/appointments/owner` | GET | **Nobody** | Missing owner appointments screen |
| `/appointments/vet` | GET | `(vet-tabs)/dashboard.tsx` ✓, `(vet-tabs)/appointments.tsx` ✓ | `(vet-tabs)/patients.tsx` |
| `/appointments/vet/stats` | GET | `(vet-tabs)/dashboard.tsx` ✓ | — |
| `/appointments/:id/status` | PATCH | `(vet-tabs)/appointments.tsx` ✓ | — |
| `/community/feed` | GET | `(tabs)/community.tsx` ✓ | `(vet-tabs)/community.tsx`, `profile/posts.tsx` |
| `/community/posts` | POST | `(tabs)/community.tsx` ✓ | — |
| `/community/posts/:id` | GET | **Nobody** | Post detail screen |
| `/community/posts/:id/like` | POST | `(tabs)/community.tsx` ✓ | `(vet-tabs)/community.tsx` |
| `/community/posts/:id/comment` | POST | **Nobody** | Community comment input |
| `/community/comments/:id` | DELETE | **Nobody** | Comment management UI |
| `/community/events` | GET | `(tabs)/community.tsx` ✓ | — |
| `/reminders` | GET | `reminders/index.tsx` ✓, `index.tsx` ✓ | — |
| `/reminders` | POST | **Nobody** | Add Reminder screen |
| `/reminders/:id` | PUT | **Nobody** | Edit Reminder UI |
| `/reminders/:id` | DELETE | **Nobody** | Reminders screen |
| `/reminders/:id/toggle` | PATCH | `reminders/index.tsx` ✓ | — |

---

## Missing Screens (Not Yet Created)

| Screen | Required By | Notes |
|---|---|---|
| Owner Appointment History | Profile tab, post-booking UX | `GET /appointments/owner` exists, no screen |
| Add Reminder | `reminders/index.tsx` FAB | `POST /reminders` exists, no screen |
| Post / Comment Thread | Community comment button | `GET /community/posts/:id` + `POST .../comment` |
| Vet Profile public view | Discover → vet detail → full page | Currently modal only |
| Vet Appointment History | Vet profile menu | Filter `(vet-tabs)/appointments.tsx` data |
| Vet Reviews | Vet profile → "My Reviews" | No backend review model yet |
| Working Hours | Vet profile → "Working Hours" | No backend field yet |
| Verification Status | Vet profile → "Verification Status" | Show `user.isVerified` + pending message |
| Forgot Password | `login.tsx` | `POST /auth/reset-password` exists (placeholder) |

---

## Priority Fix Order

### Phase 1 — Blocking (app cannot be used without these)

1. **Fix API base URL** — add `.env.local` with `EXPO_PUBLIC_API_URL=http://<LAN_IP>:5000/api`
2. **Fix Home quick actions** — pass `petId` to `/health/vaccines` and `/health/vitals` routes (or add a pet-select prompt)
3. **Fix Vaccines/Vitals/Meds/Records `+` buttons** — wire `onPress` to the `add-*` screens with `petId`
4. **Remove TODO comments from Meds/Records FABs** — navigate to `add-med` / `add-record`
5. **Build owner appointments screen** — `app/appointments/index.tsx` calling `GET /appointments/owner`
6. **Build Add Reminder screen** — `app/reminders/add.tsx` + FAB on reminders index
7. **Rewrite Vet Patients screen** — remove hardcoded data, derive patients from `GET /appointments/vet`, fix navigation to use UUID
8. **Fix `'done'` → `'completed'` in vet appointments status filter** (lines 66-67)

### Phase 2 — Core features

9. Wire community comment button → `POST /community/posts/:id/comment`
10. Wire `profile/pets.tsx` to `GET /pets` (or redirect to pets tab)
11. Add `GET /community/posts?userId=me` backend endpoint + wire `profile/posts.tsx`
12. Wire "Change Password" in security screen → `PUT /auth/profile`
13. Rewrite `(vet-tabs)/community.tsx` to use API + add pin endpoint on backend
14. Wire Discover dead buttons: Contact, Adopt, Visit Website
15. Make Discover "View all" vets a real `<Pressable>`
16. Fix `VetCard` "Call" button — pass phone prop, use `Linking.openURL('tel:...')`
17. Add reminder delete + edit in `reminders/index.tsx`
18. Replace hardcoded Nearby Vets on HomeScreen with `GET /appointments/vets`
19. Replace hardcoded Community Spotlight on HomeScreen with real feed item
20. Return `clinic_name`, `specialty`, `memberSince`, `petCount`, `rating`, `yearsExp` from login/register response

### Phase 3 — Polish

21. Replace all date `TextInput` fields with a real date picker component
22. Wire "Add Photo" in `pets/add.tsx` using `expo-image-picker`
23. Build Saved Vets backend model + endpoints + wire `profile/vets.tsx`
24. Implement "Log Dose" action in meds screen
25. Implement "Download Certificate" for vaccines
26. Build all 5 missing vet profile menu destination screens
27. Build Forgot Password screen → `POST /auth/reset-password` (needs real email integration)
28. Replace `NotificationBanner` hardcoded content with real notification system
29. Standardize vital types to a picker (Weight, Heart Rate, Temperature, Blood Pressure)
30. Add "shelter" role option to signup screen
31. Fix `user.avatar` rendering: use `source={{ uri: user.avatar }}` not raw string
32. Add error states to all fetch-bearing screens (currently silent on API failure)
