PawsHub Mobile App — Non-Functional Audit
Summary
Total screens audited: 33 (5 owner tabs, 5 vet tabs, 8 health screens, 2 pet screens, 1 appointment screen, 1 reminders screen, 5 profile screens, login, signup, onboarding, root layout, 5 UI components)
Screens with issues: 32 / 33
Critical broken flows:
Home quick actions for Vaccines/Vitals break completely — navigated without petId, health screens show an infinite loading spinner (the if (!petId) return guard fires before setLoading(false), so loading state never resolves)
Vet Patients screen is fully hardcoded — navigation uses p.name.toLowerCase() as the route param instead of p.id, so tapping any patient navigates to /pets/buddy (not a real UUID route)
Owner has no screen to view their own appointments — backend has GET /appointments/owner but no frontend screen exists for it; owners can book but never check their booking status
+ (Add) buttons on Vaccines, Vitals, Meds, Records screens all have no onPress — add screens exist as files but are completely unreachable from the UI
No way to create a reminder — GET /reminders and PATCH /reminders/:id/toggle work, but the Add Reminder form has no entry point; the reminders screen has no FAB/button
Screens that are fully static (0 API calls):
(vet-tabs)/community.tsx
(vet-tabs)/patients.tsx
profile/pets.tsx
profile/vets.tsx
profile/posts.tsx
profile/security.tsx
profile/settings.tsx
components/ui/NotificationBanner.tsx
Screen-by-Screen Audit
Login — mobile-expo/app/login.tsx
Status: MOSTLY WORKING

Hardcoded Data
None
Non-functional Buttons / CTAs
 No "Forgot Password" button or link — the POST /auth/reset-password endpoint exists on the backend but nothing in the UI calls it
Missing Navigation
 No link back to onboarding
Missing API Calls
 POST /auth/reset-password is never called
Auth / Context Issues
 After successful login, navigation redirect is handled by _layout.tsx AppShell — if useEffect in AppShell fires before the user state is set, the user may briefly see a redirect to /login again (race condition possible depending on render cycle timing)
Missing States (loading / error / empty)
 No inline field-level validation errors — only an Alert.alert after submit
Form Issues
 No email format validation
 No minimum password length check
 Password field has no "show/hide" toggle
Notes
Core login flow works end-to-end via AuthContext.login() → POST /api/auth/login → stores token in AsyncStorage ✓
Signup — mobile-expo/app/signup.tsx
Status: MOSTLY WORKING

Hardcoded Data
 Role options are only "owner" and "veterinarian" — "shelter" role exists in backend but there's no way to register as one
Non-functional Buttons / CTAs
None — the form submits correctly
Missing API Calls
 No email format validation
Auth / Context Issues
 Vet registration does not ask for clinic_name, specialty, license_number — these are required for the vet to look professional and appear correctly in the Discover screen
 After vet registers, isVerified is false — there's no UI feedback telling the vet they must wait for admin approval
Form Issues
 No password confirmation field
 No minimum password length check
 No email format validation
 Vet-specific fields (clinic name, specialty, license number) are entirely absent
Notes
Role-based tab routing after signup works correctly via _layout.tsx ✓
Onboarding — mobile-expo/app/onboarding.tsx
Status: FULLY WORKING

Hardcoded Data
 Slide content is static, but this is intentional for an onboarding screen
Notes
completeOnboarding() correctly persists to AsyncStorage ✓
"Skip" button works ✓
Navigates to /login after completion ✓
Uses local assets for images — acceptable for onboarding ✓
Home Screen — mobile-expo/app/(tabs)/index.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 "Nearby Vets" section is fully hardcoded: <VetCard name="PawCare Clinic" distance="0.8 km" rating={4.8} /> and <VetCard name="Happy Tails Hospital" distance="1.2 km" rating={4.6} /> — these are static props, not from API
 "Community Spotlight" block is fully hardcoded: shows "Luna found her forever home!" with a hardcoded local asset image and static author/timestamp text
 item.healthScore || '90' — the healthScore field is calculated as a dummy value on the backend (95 if Healthy, 75 otherwise), not a real score
Non-functional Buttons / CTAs
 VetCard "Call" button (inside VetCard.tsx) has no onPress handler
 "Community Spotlight" card navigates to /(tabs)/community — works, but content is not the actual highlighted post
 "See all" for Nearby Vets navigates to /(tabs)/discover — this works, but it's a generic redirect not filtered by vets
Missing Navigation
 Quick Action "Log Vaccine" → router.push("/health/vaccines") — no petId in the URL. vaccines.tsx does if (!petId) return before setLoading(false), resulting in an infinite loading spinner
 Quick Action "Vitals" → router.push("/health/vitals") — same issue as above, infinite loading spinner
Missing API Calls
 Nearby Vets section should call GET /appointments/vets to show real vets, not two hardcoded cards
 Community Spotlight should use a call to GET /community/feed to show the most popular or latest post
Missing States (loading / error / empty)
 Error state for failed fetch — if the API fails, the screen just shows empty sections with no error message or retry prompt
Notes
Pet cards slider: fetchData() correctly calls GET /pets and GET /reminders in parallel ✓
RefreshControl works ✓
Empty state for no pets works ✓
Reminder cards navigate to /reminders correctly ✓
Pets Tab — mobile-expo/app/(tabs)/pets.tsx
Status: MOSTLY WORKING

Hardcoded Data
 pet.reminderCount will always be undefined — the GET /pets backend response does not include a reminderCount field, so pet.reminderCount > 0 is always false; the reminder badge never appears
Non-functional Buttons / CTAs
None
Missing API Calls
 Reminder count badge: backend would need to either include this in the pets response or require a separate call per pet
Missing States (loading / error / empty)
 Error state — a failed fetch only logs to console, no user-visible error or retry button
Notes
Fetch, loading state, empty state, navigation to /pets/${pet.id}, navigation to /pets/add all work ✓
RefreshControl works ✓
Discover Tab — mobile-expo/app/(tabs)/discover.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "View all" for Nearby Vets is a <Text> element with no onPress — dead element
 "Contact" button in vet detail modal → <Pressable style={...}><Text>Contact</Text></Pressable> — no onPress handler
 "Adopt [name]" button in pet detail modal → no onPress handler — tapping does nothing
 "Visit Website" button in shelter detail modal → no onPress handler
Missing API Calls
 GET /auth/users/shelter — this endpoint is not protected by protect middleware on the backend, which means any unauthenticated request can access user data including emails. Security concern.
 "Book Now" from vet modal correctly navigates to /appointments/book?vetId=...&vetName=... ✓
Auth / Context Issues
 discoverPets controller (GET /pets/discover) is protected (protect middleware) but getUsersByRole (the shelters endpoint) is not — inconsistent access control
Missing States (loading / error / empty)
 No error state if any of the three parallel fetches fail — all silently fail and show empty sections
Notes
Fetches vets from GET /appointments/vets ✓
Fetches pets from GET /pets/discover ✓
Fetches shelters from GET /auth/users/shelter ✓
Search bar filters loaded data client-side ✓
Category filter buttons work ✓
Community Tab — mobile-expo/app/(tabs)/community.tsx
Status: MOSTLY WORKING

Hardcoded Data
 postCategories and categories arrays are hardcoded constants — acceptable, but should match backend-allowed categories
Non-functional Buttons / CTAs
 "See All" for Upcoming Events → <Pressable><Text>See All</Text></Pressable> — no onPress handler
 "Comment" button on every post → <Pressable style={...}><MessageCircle /></Pressable> — no onPress, no comment input sheet, no navigation to post detail
 "Share" button on every post → <Pressable><Share2 /></Pressable> — no onPress
 "Bookmark" button on every post → <Pressable style={{ marginLeft: 'auto' }}><Bookmark /></Pressable> — no onPress
Missing API Calls
 POST /community/posts/:id/comment — backend exists, no frontend UI to submit comments
 No individual post detail screen — tapping a post card does nothing
Auth / Context Issues
 isPostLiked calls postLikes.some(l => l.userId === user?.id) — if user is null this throws; should guard with user?.id
Notes
Feed fetches from GET /community/feed ✓
Events fetch from GET /community/events ✓
New post modal → POST /community/posts works ✓
Like/unlike via POST /community/posts/:id/like with optimistic update works ✓
hasPendingPost notification banner works, but uses stale selectedCategory value after the modal closes — the banner says "your [category] post" but selectedCategory could have been changed
Profile Tab — mobile-expo/app/(tabs)/profile.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 "Saved Vets" count hardcoded to "5" — should come from the user's saved vets list (no backend endpoint for this feature exists)
 "My Posts" count hardcoded to "8" — should come from GET /community/feed filtered by user
 user?.petCount ?? 3 — the fallback 3 is hardcoded. petCount is not returned by POST /auth/login or POST /auth/register; it only appears if /auth/me returns it (the User model must include it)
 user?.memberSince ?? "2022" — memberSince is not returned by the login/register endpoints; always shows "2022" on first login
Non-functional Buttons / CTAs
None at menu level — all items navigate correctly
Auth / Context Issues
 const avatar = user?.avatar ?? require("../../assets/pet-dog.jpg") — if user.avatar is a string URL (from data.avatar_url), Image source={url_string} would need { uri: user.avatar } syntax. Using a raw string as source prop won't render the remote image. Should be source={user?.avatar ? { uri: user.avatar } : require(...)}
Notes
Dark mode toggle calls toggleTheme() correctly ✓
Logout calls AuthContext.logout() which clears AsyncStorage ✓ (no server-side session invalidation, but token is short-lived at 30 days)
All menu items navigate to their respective profile sub-screens ✓
Vet Dashboard — mobile-expo/app/(vet-tabs)/dashboard.tsx
Status: MOSTLY WORKING

Hardcoded Data
 Greeting text always shows "Good morning 👋" regardless of time of day
 user?.clinic_name || "PetCare Clinic" and user?.specialty || "Veterinarian" — these are valid fallbacks, but because login doesn't return clinic_name/specialty, vets will see hardcoded defaults on their very first session (until /auth/me is called and AsyncStorage is updated)
Non-functional Buttons / CTAs
 "View all" for Today's Schedule → <Text style={...}>View all</Text> — no onPress handler, no navigation
 Each appointment card has no onPress — tapping the card does nothing; should navigate to appointment detail or allow inline action
Missing API Calls
None missing — stats and appointments are both fetched
Notes
Stats from GET /appointments/vet/stats ✓
Today's appointments from GET /appointments/vet ✓
Filters for today using a.date === todayStr which assumes date is stored as YYYY-MM-DD string ✓
Vet Appointments — mobile-expo/app/(vet-tabs)/appointments.tsx
Status: MOSTLY WORKING

Hardcoded Data
 statusVariant and statusIcon functions reference 'done' as a status, but the backend only allows ['pending', 'confirmed', 'cancelled', 'completed']. The string 'done' is never returned by the API. The past filter also checks a.status === 'done' — these appointments would never appear in the "Past" tab under the correct condition.
Non-functional Buttons / CTAs
 Tapping an appointment card has no onPress — should open appointment notes, pet health history, or allow adding notes
Missing States
 No error state if fetch fails
Notes
Confirm/Decline/Complete buttons all call PATCH /appointments/:id/status correctly ✓
Tab switching between Upcoming/Past works ✓
Vet Profile — mobile-expo/app/(vet-tabs)/profile.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 Patient count hardcoded to 24 — should come from API stats
 user?.yearsExp || "5" with "+ M" suffix — line 47 renders {user?.yearsExp || "5"}+ M which displays as "5+ M" — garbled text, should be "5+ yrs"
 user?.rating || "4.8" — rating is not returned by the login endpoint; will show hardcoded "4.8" on first session
Non-functional Buttons / CTAs
 "Appointment History" → <Pressable> with no onPress — does nothing
 "All Patients" → <Pressable> with no onPress — does nothing
 "My Reviews" → <Pressable> with no onPress — does nothing
 "Working Hours" → <Pressable> with no onPress — does nothing
 "Verification Status" → <Pressable> with no onPress — does nothing
Notes
All 5 menu items in vetMenuItems are decorative-only — no actions configured anywhere
Vet Community — mobile-expo/app/(vet-tabs)/community.tsx
Status: FULLY STATIC

Hardcoded Data
 posts array is hardcoded with local asset images, static names, timestamps, like/comment counts
 Category filter works but only filters the hardcoded array
Non-functional Buttons / CTAs
 "Like" button on every post → <Pressable style={...}><Heart /></Pressable> — no onPress
 "Comment" button on every post → <Pressable style={...}><MessageCircle /></Pressable> — no onPress
 "Share" button → <Pressable><Share2 /></Pressable> — no onPress
 "Pin" button (vet-exclusive) → <Pressable style={...}><Pin /><Text>Pin</Text></Pressable> — no onPress
Missing API Calls
 Does not call GET /community/feed at all — there's a full API for this and the owner's community screen uses it correctly; this screen should do the same
Notes
This screen is a completely different (and worse) implementation than the owner community screen. It should reuse the same API calls with an extra "Pin" action for vets.
Vet Patients — mobile-expo/app/(vet-tabs)/patients.tsx
Status: FULLY STATIC

Hardcoded Data
 Entire patients array is hardcoded with fake names, owners, breeds, dates, visit counts, and local asset images
 Future dates in data: "Mar 15, 2026", "Apr 15, 2026", etc.
Non-functional Buttons / CTAs
 None that are explicitly broken — the press handler exists but routes incorrectly
Missing Navigation
 router.push(/pets/${p.name.toLowerCase()}) — uses lowercase name as ID (e.g. /pets/buddy, /pets/luna). Pet IDs are UUIDs. This will 404 for every patient.
Missing API Calls
 No fetch call at all — should call GET /appointments/vet to find all unique pets treated, then display them. No direct "vet's patients" endpoint exists; must derive from appointments.
Auth / Context Issues
 getPetById controller enforces ownerId: req.user.id — a vet cannot view a pet's health records at all. Even if navigation were fixed, the API would return 404 for vet requests on patient pets.
Notes
This is perhaps the most broken screen. It must be completely rewritten to use real data.
Health / Vaccines — mobile-expo/app/health/vaccines.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "+" (Add Vaccine) button in header → <Pressable style={...}><Plus /></Pressable> — no onPress. Screen health/add-vaccine.tsx exists and is fully functional but is unreachable from this screen.
 "Download Certificate" button on each vaccine → <Pressable style={...}><Download /><Text>Download Certificate</Text></Pressable> — no onPress, no PDF generation logic
Missing Navigation
 When navigated from Home Quick Action (/health/vaccines without ?petId=): if (!petId) return exits the fetch without calling setLoading(false) → infinite loading spinner
Notes
When petId IS provided (from pet detail screen), fetch works correctly ✓
Refresh control works ✓
Health / Vitals — mobile-expo/app/health/vitals.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "+" button in header → <Pressable style={...}><Plus /></Pressable> — no onPress. Screen health/add-vital.tsx exists but is unreachable.
Missing Navigation
 Same petId issue as vaccines: Home Quick Action "Vitals" navigates to /health/vitals without ?petId= → infinite loading spinner
Notes
When petId is provided, fetch and display work ✓
History logs limited to vitals.slice(0, 10) — hardcoded limit, no pagination ✓ (acceptable for now)
No chart/trend visualization despite the data structure supporting it
Health / Medications — mobile-expo/app/health/meds.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 FAB "+" button → onPress={() => {/* TODO: Add medication form */}} — explicit empty TODO, health/add-med.tsx exists and works but is unreachable
 "Log Dose" button on each medication card → <Pressable style={...}><Text>Log Dose</Text></Pressable> — no onPress, no backend endpoint for dose logging
Hardcoded Data
 Empty state text: "No weight medication found" — copy error, should be "No medication records found"
Notes
Fetch from GET /health/meds/:petId works when petId is provided ✓
Navigating from pet detail screen with petId works ✓
Health / Medical Records — mobile-expo/app/health/records.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 FAB "+" button → onPress={() => {/* TODO: Add record form */}} — explicit empty TODO, health/add-record.tsx exists and works but is unreachable
Notes
Fetch from GET /health/records/:petId works when petId is provided ✓
Timeline-style rendering looks correct ✓
Health / Add Vaccine — mobile-expo/app/health/add-vaccine.tsx
Status: MOSTLY WORKING (but unreachable)

Form Issues
 Date fields (dateAdministered, nextDueDate) use plain TextInput with placeholder "YYYY-MM-DD" — no date picker component. Users must type dates manually in the exact format.
 If petId is undefined (e.g., navigated directly without param), the POST URL becomes /health/vaccines/undefined — no guard before submitting
Notes
Validation checks for vaccine name ✓
Calls POST /health/vaccines/:petId correctly ✓
router.back() after save ✓
Health / Add Vital — mobile-expo/app/health/add-vital.tsx
Status: MOSTLY WORKING (but unreachable)

Form Issues
 type field is a free-text TextInput — no picker; inconsistent type strings (e.g., "Weight" vs "weight") will break the getIcon/getColor logic in vitals.tsx since it does .toLowerCase() checks
 Date fields use plain TextInput, no date picker
 If petId is undefined, POST URL becomes /health/vitals/undefined
Notes
Validation for all three fields ✓
Calls POST /health/vitals/:petId correctly ✓
Health / Add Medication — mobile-expo/app/health/add-med.tsx
Status: MOSTLY WORKING (but unreachable)

Form Issues
 No endDate field — the backend Medication model likely has it but the form doesn't collect it
 No date picker for startDate — hardcoded to new Date().toISOString() at submit time
 If petId is undefined, POST URL becomes /health/meds/undefined
Notes
Validation for name, dosage, frequency ✓
Calls POST /health/meds/:petId correctly ✓
Health / Add Record — mobile-expo/app/health/add-record.tsx
Status: MOSTLY WORKING (but unreachable)

Form Issues
 No date picker for date — hardcoded to new Date().toISOString() at submit time
 If petId is undefined, POST URL becomes /health/records/undefined
Notes
Validation for title and clinic name ✓
Calls POST /health/records/:petId correctly ✓
Pet Detail — mobile-expo/app/pets/[id].tsx
Status:

I now have everything I need. Let me write the complete audit report.

PawsHub Mobile App — Non-Functional Audit
Summary
Total screens audited: 32 (5 tab + 5 vet-tab + 8 health + 2 pet + 1 appointment + 1 reminders + 5 profile + login + signup + onboarding + 5 UI components + 1 root layout)
Screens with issues: 29 of 32
Screens fully static (0 real API calls): (vet-tabs)/community.tsx, (vet-tabs)/patients.tsx, profile/pets.tsx, profile/vets.tsx, profile/posts.tsx, profile/security.tsx, profile/settings.tsx
Critical blocking flows (top 5):

Owners cannot view their own appointments — GET /appointments/owner exists in the backend but no screen calls it; no owner-facing appointment list screen exists
Health screen quick actions from Home are broken — "Log Vaccine" and "Vitals" navigate to /health/vaccines and /health/vitals without a petId param, causing the screens to silently bail and show a permanent loading spinner
Vet Patients screen is fully hardcoded — pushes /pets/buddy (name, not UUID) which will 404 against the real API
No way to create a reminder — the Reminders screen has no "Add" button; POST /reminders exists in the backend but is never called from the frontend
API base URL defaults to http://localhost:5000/api — will fail on any physical device or Android emulator without a proper .env override
Screen-by-Screen Audit
Root Layout — app/_layout.tsx
Status: MOSTLY WORKING

Hardcoded Data
 GlobalHeader Bell badge is always shown (red dot hardcoded) — no unread count from backend
Non-functional Buttons / CTAs
 Bell icon in GlobalHeader: <Pressable> wraps the bell with no onPress — tapping does nothing
Missing Navigation
 Several screens declared in <Stack> are missing entries: appointments/book, health/add-vaccine, health/add-vital, health/add-med, health/add-record, all profile/* screens. Expo Router auto-discovers them but they will use default Stack options (no custom animations or headers).
Missing API Calls
 Bell icon should fetch unread notification count on mount
Auth / Context Issues
 Role-based guard checks segments[0] === '(tabs)' but segment values in Expo Router v6 may differ depending on the platform — should be tested
Notes
NotificationBanner mounts inside AppShell and fires a hardcoded toast after 2 seconds on every session as long as the user is logged in (see NotificationBanner.tsx audit below)
global.css is imported, confirming NativeWind v4 is active — StatusChip and ReminderCard className syntax is valid
Home Screen — app/(tabs)/index.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 "Community Spotlight" section is entirely hardcoded: static image (pet-cat.jpg), author "PawsRescue", text "Luna found her forever home!" — no API call
 "Nearby Vets" section renders two hardcoded <VetCard> instances: "PawCare Clinic" and "Happy Tails Hospital" — never fetched from backend
 item.healthScore || '90' — the fallback 90 is a hardcoded default; backend returns a dummy value of 95 or 75 (not a real score)
 Greeting always reads "Good morning 👋" — no time-of-day logic
Non-functional Buttons / CTAs
 "View all" button for Nearby Vets navigates to /(tabs)/discover but the label implies a filtered vets view — minor UX confusion
Missing Navigation
 Quick Action "Log Vaccine" → router.push("/health/vaccines") — no petId query param. The vaccines screen does if (!petId) return and sets loading = false only inside fetchVaccines, which is never called — so the spinner shows forever
 Quick Action "Vitals" → router.push("/health/vitals") — same problem, screen silently stalls
Missing API Calls
 Nearby Vets section should call GET /appointments/vets and render real vet data
 Community Spotlight should call GET /community/feed for the top post
Missing States (loading / error / empty)
 No error state shown when the API call for pets or reminders fails (only console.error)
 Reminders section is entirely hidden when reminders.length === 0 — user gets no indication to add reminders
Notes
item.nextVisit does come from the backend (enriched in getMyPets) ✓
Pets fetched correctly, pull-to-refresh works ✓
Pets Tab — app/(tabs)/pets.tsx
Status: MOSTLY WORKING

Hardcoded Data
 pet.reminderCount is accessed but GET /pets never returns this field — always undefined, the badge never renders. Backend would need a joined count or a separate endpoint.
Missing API Calls
None critical
Missing States (loading / error / empty)
 No error state — only console.error on fetch failure; user sees empty list with no feedback
Notes
Fetch from GET /pets, loading state, pull-to-refresh, empty state, navigation to /pets/:id all work correctly ✓
Discover Tab — app/(tabs)/discover.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "View all" text for Nearby Vets section: <Text style=...>View all</Text> — no <Pressable> wrapper, not tappable at all
 In Vet detail modal: "Contact" button → <Pressable style={...}> has no onPress handler
 In Pet detail modal: "Adopt [name]" button → <Pressable style={...}> has no onPress handler
 In Shelter detail modal: "Visit Website" button → <Pressable style={...}> has no onPress handler
Missing API Calls
 Shelters fetched via GET /auth/users/shelter — but getUsersByRole is an unprotected endpoint. This works, but shelter accounts must actually register with role: "shelter" which is not an option in the signup screen (only owner / veterinarian)
Missing States (loading / error / empty)
 No error state on fetch failure
Notes
Vet listing fetched from GET /appointments/vets ✓
Adoption/foster pets fetched from GET /pets/discover ✓
vet.rating is in the backend response (password excluded, all other fields included) ✓
Community Tab — app/(tabs)/community.tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 "See All" for Upcoming Events: <Pressable><Text ...>See All</Text></Pressable> — no onPress handler
 Comment button on each post: <Pressable style={...}><MessageCircle .../></Pressable> — no onPress; tapping opens nothing, sends nothing
 Share button: <Pressable><Share2 .../></Pressable> — no onPress
 Bookmark button: <Pressable style={{ marginLeft: 'auto' }}><Bookmark .../></Pressable> — no onPress
Missing API Calls
 POST /community/posts/:id/comment — backend exists, no UI to submit comments
 No comment display thread per post (comments are fetched as part of the feed but never shown in the UI)
Missing States (loading / error / empty)
 No error state on feed fetch failure
Form Issues
 After posting, feed is not re-fetched — the new post won't appear until next manual refresh (acceptable since it goes to moderation, but no feedback other than the pending banner)
 hasPendingPost banner shows selectedCategory state which may be stale after modal closes
Profile Tab — app/(tabs)/profile.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 "Saved Vets" count hardcoded as "5" — no API call, no real saved-vets feature
 "My Posts" count hardcoded as "8" — no API call
 user?.petCount ?? 3 — the fallback value 3 is hardcoded; petCount is not returned by POST /auth/login or POST /auth/register; it IS in /auth/me response but only if the User model has that field
 user?.memberSince ?? "2022" — memberSince is not in any backend response
Auth / Context Issues
 user?.avatar ?? require("../../assets/pet-dog.jpg") — user.avatar stores the URL string from data.avatar_url. If the avatar URL is null or undefined, the local fallback is used. If it's a valid URL string, it works as an Image source. This logic is correct but the local image fallback will always be used for new users with no avatar.
Notes
All navigation links (My Pets, Saved Vets, My Posts, Notifications, Privacy & Security, App Settings) navigate to correct routes ✓
Sign Out calls logout() correctly ✓
Vet Dashboard — app/(vet-tabs)/dashboard.tsx
Status: MOSTLY WORKING

Hardcoded Data
 Greeting "Good morning 👋" is always static — no time-of-day check
 user?.clinic_name || "PetCare Clinic" — fallback is hardcoded
Non-functional Buttons / CTAs
 "View all" for Today's Schedule: <Text style=...>View all</Text> — no onPress, not tappable
 Each appointment card: <Pressable key={appt.id} style={...}> — no onPress — tapping does nothing
Missing States (loading / error / empty)
 No error state on fetch failure
Notes
GET /appointments/vet/stats and GET /appointments/vet both called ✓
Today's filter a.date === todayStr works for YYYY-MM-DD date format ✓
Vet Appointments — app/(vet-tabs)/appointments.tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 Appointment card: <Pressable key={appt.id} style={...}> — no onPress — tapping a card does nothing; should open appointment detail
Missing Navigation
 No navigation to appointment detail — no such screen exists
Notes
Status filtering uses both 'done' and 'completed' (line 66-67) but the backend only accepts 'completed' as a terminal status. Any appointment with status === 'done' would appear in "Upcoming" tab incorrectly. Backend updateAppointmentStatus allows ['pending', 'confirmed', 'cancelled', 'completed'] — not 'done'.
Confirm/Decline/Complete all call PATCH /appointments/:id/status ✓
Pull-to-refresh works ✓
Vet Profile — app/(vet-tabs)/profile.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 Patients count hardcoded as 24 (line 51) — never fetched from API
 user?.yearsExp || "5" renders as "5+ M" (line 47) — the + M text is a bug; copy should be "5+ yrs" (or just "5")
 user?.rating || "4.8" — fallback hardcoded
Non-functional Buttons / CTAs
 "Appointment History" menu item: <Pressable> has no onPress — tapping does nothing
 "All Patients" menu item: <Pressable> has no onPress — tapping does nothing
 "My Reviews" menu item: <Pressable> has no onPress — tapping does nothing
 "Working Hours" menu item: <Pressable> has no onPress — tapping does nothing
 "Verification Status" menu item: <Pressable> has no onPress — tapping does nothing
Missing Navigation
 All 5 menu items lead nowhere — 5 destination screens do not exist
Vet Community — app/(vet-tabs)/community.tsx
Status: FULLY STATIC

Hardcoded Data
 const posts = [...] — 3 hardcoded posts with inline data, local image assets, static like/comment counts, static usernames
 Pinned state for "Buddy" post is hardcoded pinned: true
Non-functional Buttons / CTAs
 Like button: <Pressable style={...}><Heart .../> — no onPress
 Comment button: <Pressable style={...}><MessageCircle .../> — no onPress
 Share button: <Pressable><Share2 .../> — no onPress
 Pin button: <Pressable style={...}><Pin .../><Text>Pin</Text></Pressable> — no onPress
Missing API Calls
 No fetch from GET /community/feed — entire feed is static
 No pin/unpin API endpoint exists on the backend
Missing States (loading / error / empty)
 No loading state, no error state, no empty state
Notes
This is a complete reimplementation of the owner Community screen but with no API calls at all. Should be replaced with the same API-wired pattern as (tabs)/community.tsx, with an added Pin action. The backend has no pin/unpin endpoint — that needs to be added.
Vet Patients — app/(vet-tabs)/patients.tsx
Status: FULLY STATIC

Hardcoded Data
 const patients = [...] — 5 hardcoded patients with inline names, owners, species, breeds, visit dates (hardcoded to specific 2026 dates), visit counts, and local image assets
 Search filters the hardcoded array only
Non-functional Buttons / CTAs
 (No explicit broken buttons, but entire screen is fake data)
Missing Navigation
 router.push(/pets/${p.name.toLowerCase()}) pushes /pets/buddy, /pets/luna etc. — these will 404 against the real API since pet IDs are UUIDs, not names
Missing API Calls
 No fetch of real patient list — no GET /appointments/vet with distinct petId list, no patient-specific endpoint
Notes
This entire screen must be rewritten to call the backend. A vet's patients can be derived from their appointments (distinct petIds from GET /appointments/vet), but the backend getPetById controller enforces ownerId === req.user.id — vets can't call GET /pets/:id for their patients' pets. A new vet-scoped pet view endpoint is needed.
Vaccines Screen — app/health/vaccines.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "+" button in header: <Pressable style={...}><Plus .../></Pressable> — no onPress — should navigate to /health/add-vaccine?petId=${petId}
 "Download Certificate" button: <Pressable style={...}> — no onPress — no certificate download logic
Missing Navigation
 When navigated from HomeScreen quick action (no petId): if (!petId) return bails silently but setLoading is never called to false inside the early return. The screen shows a spinner forever.
Notes
add-vaccine.tsx exists and is wired to POST /health/vaccines/:petId ✓ — just needs to be linked from the + button here
Vitals Screen — app/health/vitals.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "+" button in header: <Pressable style={...}><Plus .../></Pressable> — no onPress — should navigate to /health/add-vital?petId=${petId}
Missing Navigation
 Same petId-less navigation issue as vaccines when launched from HomeScreen quick action
Notes
History shows up to 10 entries (vitals.slice(0, 10)) with no pagination
No chart/graph visualization — just a list (the screen promises trend graphs by the icon label TrendingUp but none are rendered)
Medications Screen — app/health/meds.tsx
Status: PARTIALLY WIRED

Hardcoded Data
 Empty state label: "No weight medication found" — copy error, should be "No medication records found"
Non-functional Buttons / CTAs
 FAB "+" button: onPress={() => {/* TODO: Add medication form */}} — explicitly marked as TODO, does nothing
 "Log Dose" button on each medication card: <Pressable style={...}><Text>Log Dose</Text></Pressable> — no onPress — no log dose functionality
Missing Navigation
 FAB should navigate to /health/add-med?petId=${petId} (the file exists)
Medical Records Screen — app/health/records.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 FAB "+" button: onPress={() => {/* TODO: Add record form */}} — explicitly marked as TODO, does nothing
Missing Navigation
 FAB should navigate to /health/add-record?petId=${petId} (the file exists)
Notes
The Pet Detail quick action "Visits" and "Records" both route to /health/records?petId=${id} — they point to the same screen. This is a duplicate navigation entry, likely "Visits" should go to /appointments/book or a future appointments history screen.
Add Vaccine Screen — app/health/add-vaccine.tsx
Status: MOSTLY WORKING

Form Issues
 "Date Administered" and "Next Due Date" are plain TextInput fields with placeholder YYYY-MM-DD — no date picker; user must type the date in a specific format with no validation
 If navigated without petId (e.g., from HomeScreen), api.post(/health/vaccines/${undefined}) produces endpoint /health/vaccines/undefined — will fail with a 404 not a user-friendly error
Add Vital Screen — app/health/add-vital.tsx
Status: MOSTLY WORKING

Form Issues
 type field is free text (e.g., "Weight", "Heart Rate") — no validation or picker; inconsistent type strings will corrupt the type-based icon/color logic in vitals.tsx
 No petId guard — same issue as add-vaccine if navigated without petId
Add Medication Screen — app/health/add-med.tsx
Status: MOSTLY WORKING

Form Issues
 No end date field — backend supports endDate in the medication model but the form doesn't capture it
 No petId guard
Add Medical Record Screen — app/health/add-record.tsx
Status: MOSTLY WORKING

Form Issues
 Date of record is always new Date().toISOString() (today) — user cannot specify a date for a past visit
 No petId guard
Pet Detail Screen — app/pets/[id].tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 Quick Action "Visits" routes to /health/records?petId=${id} — same destination as "Records", both link to records.tsx. Visits should link to an appointments history screen.
Missing API Calls
 Vet users cannot access this screen for a patient's pet — getPetById enforces ownerId === req.user.id — no vet pet view exists
Notes
Edit button navigates to /pets/add?id=${id} (edit mode) ✓
Adoption/foster toggles call PATCH /pets/:id/listing ✓
pet.Vaccines, pet.Medications, pet.Appointments are real includes from the backend ✓
Add Pet Screen — app/pets/add.tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 "Add Photo" button: <Pressable> has no onPress — no camera or image picker integration; camera icon is purely decorative
 Avatar upload entirely absent — avatar_url is never sent in the form payload
Form Issues
 age field sends a free-text string label (e.g., "3 yrs") as the age field; backend also accepts birth_date. The two fields are redundant but both accepted.
 No image picker integration means pets can never have avatars unless added via API directly
Book Appointment Screen — app/appointments/book.tsx
Status: MOSTLY WORKING

Hardcoded Data
 Date and time use plain text inputs with no date/time picker
Missing Navigation
 If accessed directly (not from the Discover vet modal), vetId and vetName are undefined. The form will POST with vetId: undefined and the backend will return 404 "Veterinarian not found".
Form Issues
 No validation that date format is YYYY-MM-DD — free text will be accepted and may fail silently in the DB
 No validation that time format is correct
 After successful booking, navigates back but no confirmation screen exists; the user sees no appointment history
Reminders Screen — app/reminders/index.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 No "Add Reminder" button or FAB — POST /reminders exists on the backend but is never called from any frontend screen
Missing Navigation
 No way to edit a reminder — PUT /reminders/:id exists but no edit UI
 No way to delete a reminder — DELETE /reminders/:id exists but no delete UI (no swipe-to-delete, no long-press, no trash icon)
Notes
Fetch, toggle (mark done/undone) all work ✓
Overdue detection logic is correct ✓
Profile — My Pets — app/profile/pets.tsx
Status: FULLY STATIC

Hardcoded Data
 const pets = [...] — 3 hardcoded pets: "Buddy" (Golden Retriever), "Luna" (Tabby Cat), "Snowball" (Holland Lop) with local image assets
 pets.length displayed as count at bottom is always 3
Missing API Calls
 No fetch from GET /pets — this is a duplicate of (tabs)/pets.tsx but without API wiring
Notes
This screen is redundant with (tabs)/pets.tsx which is already wired. Should reuse the same component or just navigate to the tab.
Profile — Saved Vets — app/profile/vets.tsx
Status: FULLY STATIC

Hardcoded Data
 const savedVets = [...] — 3 hardcoded vet objects with inline addresses, phone numbers, review counts, ratings, local images
Non-functional Buttons / CTAs
 "Call Clinic" button: <Pressable style={...}> — no onPress — no phone dial action
 "Consult" button: <Pressable style={...}> — no onPress
Missing API Calls
 No backend endpoint for "saved/bookmarked vets" — GET /auth/users/veterinarian would give all vets, but there's no user-specific saved-vet list. Feature is entirely fabricated.
Profile — My Posts — app/profile/posts.tsx
Status: FULLY STATIC

Hardcoded Data
 const myPosts = [...] — 3 hardcoded posts with inline content, static like/comment counts, local image assets
 Post statuses ("Approved", "Pending Verification") are hardcoded
Non-functional Buttons / CTAs
 <Pressable style={{ marginLeft: 'auto' }}><MoreVertical .../></Pressable> — no onPress — should open edit/delete post menu
Missing API Calls
 No fetch from the backend — GET /community/feed only returns approved posts. Backend has no GET /community/posts?userId=me endpoint for a user's own posts (pending + approved). Endpoint needs to be added.
Profile — Privacy & Security — app/profile/security.tsx
Status: FULLY STATIC

Non-functional Buttons / CTAs
 "Change Password" action: action: () => {} — empty function, nothing happens
 "Two-Factor Auth" toggle: only changes local React state, no API call
 "Face ID / Fingerprint" toggle: only changes local React state, no API call (expo-secure-store is in package.json but unused here)
 "Profile Visibility" action: action: () => {} — empty function
 "Show My Location" toggle: only changes local React state, no API call
Missing API Calls
 No calls to PUT /auth/profile for any setting change
 No POST /auth/reset-password linked from the "Change Password" item
Profile — App Settings — app/profile/settings.tsx
Status: FULLY STATIC

Hardcoded Data
 "Storage Used" hardcoded as "128 MB"
 "App Version" hardcoded as "v2.4.0"
Non-functional Buttons / CTAs
 "Language" action: action: () => {} — empty, no language picker
 "Notification Settings" action: action: () => {} — empty
 "Push Notifications" toggle: only local state, no API call
 "Email Alerts" toggle: only local state, no API call
 "Clear Cache" action: action: () => {} — empty, no cache clear
 "Terms of Service" action: action: () => {} — empty, no link
Login Screen — app/login.tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 No "Forgot Password?" link — POST /auth/reset-password exists on the backend (placeholder implementation that simulates success) but no UI surface
Form Issues
 No email format validation
 No minimum password length check
Signup Screen — app/signup.tsx
Status: MOSTLY WORKING

Non-functional Buttons / CTAs
 No "shelter" role option — shelters cannot register via the app (only owner/vet options shown)
Form Issues
 No password confirmation field
 No email format validation
 No minimum password length
 Veterinarian sign-up doesn't ask for clinic_name or specialty — these fields will be null on first login
Onboarding Screen — app/onboarding.tsx
Status: FULLY WORKING (static content is intentional here)

Notes
No API calls needed — this is onboarding content ✓
completeOnboarding() saves to AsyncStorage ✓
Skip and paginated navigation work ✓
UI Components Audit
components/ui/StatusChip.tsx
Status: WORKS (NativeWind confirmed in package.json v4 + global.css imported)

Notes
Uses NativeWind className syntax — confirmed valid with NativeWind v4 ✓
No interactive behavior (purely display) ✓
components/ui/ReminderCard.tsx
Status: ORPHANED / POTENTIALLY BROKEN

Notes
Uses NativeWind className syntax — should work with NativeWind v4
This component is never imported or used anywhere in the codebase — it is an orphan component
The ReminderCard is replaced inline by custom reminder rendering in both index.tsx (home) and reminders/index.tsx
components/ui/VetCard.tsx
Status: PARTIALLY WIRED

Non-functional Buttons / CTAs
 "Call" button: <Pressable style={...}><Text>Call</Text></Pressable> — no onPress — no phone dial action. Used on HomeScreen with hardcoded data.
Notes
Only used in HomeScreen with hardcoded vet names — the button label "Call" implies Linking.openURL('tel:...') but no phone number is passed as a prop
components/ui/EventCard.tsx
Status: WORKS (display only)

Notes
onPress prop accepted and passed through, but in community.tsx the events are rendered with {...event} spread — onPress is not in the event object, so it defaults to undefined (no handler)
components/ui/NotificationBanner.tsx
Status: BROKEN (hardcoded, always fires)

Hardcoded Data
 Title hardcoded: "New Community Event!"
 Message hardcoded: "Puppy Social Mixer" is happening on April 15. Tap to see details."
 Auto-fires on a 2-second timeout every time the app loads while logged in (via useEffect in the component mounted in _layout.tsx)
Non-functional Buttons / CTAs
 Tapping the notification does nothing — no onPress on the banner body
Notes
This should be connected to a real push notification or in-app notification API
Currently provides a misleading UX — fires even when there is no event
Backend Coverage Map
Endpoint	Method	Screen(s) Calling It	Screen(s) That Should Also Call It
/auth/register	POST	signup.tsx ✓	—
/auth/login	POST	login.tsx ✓	—
/auth/me	GET	AuthContext.tsx on startup ✓	—
/auth/profile	PUT	AuthContext.updateProfile() (never called from UI)	profile/security.tsx (Change Password), profile/settings.tsx
/auth/reset-password	POST	Nobody	login.tsx (Forgot Password link)
/auth/users/:role	GET	discover.tsx → /auth/users/shelter ✓	—
/pets	GET	(tabs)/pets.tsx ✓, appointments/book.tsx ✓, (tabs)/index.tsx ✓	profile/pets.tsx (currently static)
/pets	POST	pets/add.tsx ✓	—
/pets/:id	GET	pets/[id].tsx ✓, pets/add.tsx (edit mode) ✓	(vet-tabs)/patients.tsx (needs vet-scoped version)
/pets/:id	PUT	pets/add.tsx (edit) ✓	—
/pets/:id	DELETE	pets/add.tsx ✓	—
/pets/:id/listing	PATCH	pets/[id].tsx ✓	—
/pets/discover	GET	discover.tsx ✓	—
/health/vaccines/:petId	GET	health/vaccines.tsx ✓	—
/health/vaccines/:petId	POST	health/add-vaccine.tsx ✓	—
/health/vitals/:petId	GET	health/vitals.tsx ✓	—
/health/vitals/:petId	POST	health/add-vital.tsx ✓	—
/health/meds/:petId	GET	health/meds.tsx ✓	—
/health/meds/:petId	POST	health/add-med.tsx ✓	—
/health/records/:petId	GET	health/records.tsx ✓	—
/health/records/:petId	POST	health/add-record.tsx ✓	—
/appointments/vets	GET	discover.tsx ✓	(tabs)/index.tsx (Nearby Vets hardcoded)
/appointments	POST	appointments/book.tsx ✓	—
/appointments/owner	GET	Nobody	Missing owner appointments screen
/appointments/vet	GET	(vet-tabs)/dashboard.tsx ✓, (vet-tabs)/appointments.tsx ✓	(vet-tabs)/patients.tsx (to derive patient list)
/appointments/vet/stats	GET	(vet-tabs)/dashboard.tsx ✓	—
/appointments/:id/status	PATCH	(vet-tabs)/appointments.tsx ✓	—
/community/feed	GET	(tabs)/community.tsx ✓	(vet-tabs)/community.tsx (static), profile/posts.tsx (needs filter)
/community/posts	POST	(tabs)/community.tsx ✓	—
/community/posts/:id	GET	Nobody	—
/community/posts/:id/like	POST	(tabs)/community.tsx ✓	(vet-tabs)/community.tsx
/community/posts/:id/comment	POST	Nobody	(tabs)/community.tsx (Comment button), (vet-tabs)/community.tsx
/community/comments/:id	DELETE	Nobody	Comments UI (not yet built)
/community/events	GET	(tabs)/community.tsx ✓	—
/reminders	GET	reminders/index.tsx ✓, (tabs)/index.tsx ✓	—
/reminders	POST	Nobody	reminders/index.tsx (Add Reminder FAB)
/reminders/:id	PUT	Nobody	reminders/index.tsx (Edit Reminder)
/reminders/:id	DELETE	Nobody	reminders/index.tsx (Delete Reminder)
/reminders/:id/toggle	PATCH	reminders/index.tsx ✓	—
Missing Screens (Not Yet Created)
Screen	Required By	Notes
Owner Appointment History	Profile tab menu, post-booking UX	Calls GET /appointments/owner — endpoint exists, screen does not
Add Reminder	reminders/index.tsx FAB	Calls POST /reminders — endpoint exists, screen does not
Post / Comment Thread	Community feed comment button	Calls GET /community/posts/:id + POST /community/posts/:id/comment
Vet Profile (public view for owners)	discover.tsx Book Now CTA flow	Currently owners see a modal, not a full profile page
Vet Appointment History	Vet profile menu → "Appointment History"	Reuse of (vet-tabs)/appointments.tsx data with date filter
Vet Reviews	Vet profile menu → "My Reviews"	No backend review model exists yet
Working Hours	Vet profile menu → "Working Hours"	No backend field for this yet
Verification Status	Vet profile menu → "Verification Status"	Could show user.isVerified state + pending message
Notification Settings	App Settings → "Notification Settings"	Calls push notification permission APIs
Forgot Password	login.tsx	Calls POST /auth/reset-password — endpoint exists
Priority Fix Order
Phase 1 — Blocking: App Can't Be Used Without These
Fix API base URL — services/api.ts defaults to http://localhost:5000/api; add .env.local with the real LAN IP (EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api) and document it
Fix Home quick actions — Pass petId when navigating to /health/vaccines and /health/vitals, or prompt the user to select a pet first if they have multiple
Fix Vaccines/Vitals + buttons — Wire onPress to navigate to add-vaccine/add-vital with the current petId
Fix Meds/Records FAB + buttons — Remove the /* TODO */ and navigate to add-med/add-record with petId
Build owner appointments screen — A pet owner has no way to view, cancel, or track their bookings. Create app/appointments/index.tsx that calls GET /appointments/owner
Build Add Reminder screen — The POST /reminders endpoint is ready; create app/reminders/add.tsx and add a FAB to reminders/index.tsx
Rewrite Vet Patients screen — Remove hardcoded data; derive patient list from GET /appointments/vet; fix navigation to use real pet UUIDs
Fix 'done' vs 'completed' status mismatch in (vet-tabs)/appointments.tsx lines 66-67
Phase 2 — Core Features
Wire community comment button — Add comment input modal and call POST /community/posts/:id/comment
Wire Profile: My Pets — Replace profile/pets.tsx static data with GET /pets call (or redirect to the (tabs)/pets tab)
Wire Profile: My Posts — Add GET /community/posts?userId=me backend endpoint and wire profile/posts.tsx
Wire Profile: Security — Connect "Change Password" to PUT /auth/profile with password field; make toggles call the appropriate backend when a settings API exists
Rewrite Vet Community screen — Use same API-wired pattern as owner community; add a pin/unpin API endpoint
Discover: fix dead buttons — Wire "Contact" (vet modal), "Adopt [pet]" (pet modal), "Visit Website" (shelter modal) to real actions
Discover: "View all" vets — Make the text a <Pressable> that filters to Vets tab
Fix VetCard "Call" button — Pass phone number as a prop, use Linking.openURL('tel:...')
Add reminder delete + edit — Wire swipe-to-delete and edit flow in reminders/index.tsx
Remove hardcoded Nearby Vets from (tabs)/index.tsx HomeScreen — fetch from /appointments/vets
Remove hardcoded Community Spotlight from HomeScreen — fetch from /community/feed first item
Phase 3 — Secondary / Polish
Date pickers — Replace all TextInput date fields in add-vaccine, add-vital, add-record, appointments/book with a proper date picker component
Image upload — Wire "Add Photo" in pets/add.tsx using expo-image-picker + upload to storage
Saved Vets feature — Add a UserSavedVet backend model + endpoints + wire profile/vets.tsx
"Log Dose" button in health/meds.tsx — Define what action this performs (mark med as taken for today?) and implement
"Download Certificate" in health/vaccines.tsx — Generate/fetch a PDF certificate
Vet profile menu items — Build destination screens for Appointment History, Working Hours, Verification Status, My Reviews
Forgot Password screen — Call POST /auth/reset-password (currently a placeholder — needs real email integration)
NotificationBanner — Connect to a real notification/event push system; remove the hardcoded auto-fire timer
petCount, memberSince, rating, yearsExp — Return these fields from POST /auth/login and POST /auth/register response so the Profile screen shows real values on first login
Vital type standardization — Make add-vital.tsx use a picker with fixed types (Weight, Heart Rate, Temperature, Blood Pressure) instead of free text to prevent broken icon/color lookups
Shelter registration — Add "Shelter" role option to signup.tsx