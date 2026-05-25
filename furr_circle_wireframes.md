# Furr Circle — Premium UI/UX Wireframes v2

> **Design Philosophy:** Premium, emotional, trustworthy. Instagram depth × Airbnb warmth × Apple polish.
> **Platform:** iOS + Android (React Native / Expo)
> **Color System:** Blue-900 → Blue-50 scale (Tailwind / NativeWind)
> **Tagline:** *"Where Pets Become Social."*

---

## Design System

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BLUE SCALE (primary brand)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  blue-950   #172554   Splash bg / deep overlay
  blue-900   #1e3a8a   Primary brand (light mode)
  blue-800   #1e40af   Hero gradients
  blue-700   #1d4ed8   Nav active / pressed states
  blue-600   #2563eb   Verified badges / links
  blue-500   #3b82f6   Primary brand (dark mode)
  blue-400   #60a5fa   Icon accents / subtle UI
  blue-300   #93c5fd   Disabled / placeholder
  blue-200   #bfdbfe   Borders / dividers
  blue-100   #dbeafe   Card fills / tag pills
  blue-50    #eff6ff   Page surface / backgrounds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEUTRAL SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  slate-950  #020617   Dark bg
  slate-900  #0f172a   Dark card bg
  slate-800  #1e293b   Dark border / muted
  slate-400  #94a3b8   Muted text
  slate-200  #e2e8f0   Light border
  slate-100  #f1f5f9   Subtle bg
  white      #ffffff   Card surface

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FUNCTIONAL COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Danger     #dc2626   Emergency / urgent / delete
  Success    #16a34a   Vaccinated / verified / match
  Warning    #d97706   Overdue reminders
  Pink       #ec4899   Like / heart interactions
  Purple     #8b5cf6   Creator badges / premium

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Display    Poppins 800   32–40px   Hero headlines
  Heading    Poppins 700   20–28px   Screen titles
  Title      Inter   700   16–18px   Card headers
  Body       Inter   400   14–15px   Content
  Caption    Inter   500   11–13px   Labels / meta
  Micro      Inter   600   10–11px   Badges / chips

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SPACING & RADIUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Spacing    4 / 8 / 12 / 16 / 20 / 24 / 32 / 40px
  Radius     8 / 12 / 16 / 20 / 24 / full
  Shadow     blue-tinted  rgba(37,99,235,0.12)
```

---

## Navigation Architecture

```
┌─────────────────────────────────────────────────────────┐
│  BOTTOM TAB BAR  (5 tabs, blur background)              │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  🏠      │  🔍      │  💞      │  💬      │  👤         │
│  Home    │ Discover │  Match   │Community │  Profile    │
│          │          │ ↑raised  │          │             │
└──────────┴──────────┴──────────┴──────────┴─────────────┘

  Care is NOT a tab — accessed via:
  • Home → quick action tiles
  • Profile → Care & Health section
  • Direct /care route with back nav

  Reels are NOT a tab — accessed via:
  • Home → Reels row → fullscreen reel player
  • Discover → Reels section
```

---

## Full Screen Inventory

```
ONBOARDING
  01  Splash Screen
  02  Onboarding Slide 1 — Create Identity
  03  Onboarding Slide 2 — Match & Discover
  04  Onboarding Slide 3 — Care & Community
  05  Sign Up / Login
  06  OTP Verification
  07  Owner Profile Setup
  08  Pet Profile Setup
  09  Interest Tags

HOME (EXISTING — DO NOT CHANGE)
  10  Home Feed

DISCOVER
  11  Discover Hub
  12  Reels Fullscreen Player
  13  Search Results
  14  Adoption Card Detail

MATCH
  15  Match Hub (Adoption mode)
  16  Match — Playdate mode
  17  Match — Breed mode
  18  Match — Owner mode
  19  It's a Match! Overlay

COMMUNITY
  20  Community Feed
  21  Community Thread / Discussion
  22  Post Creation
  23  Breed Community Page

CARE
  24  Care Hub
  25  Vet Profile
  26  Book Appointment
  27  AI Symptom Checker
  28  Pet Passport / Health Records

PROFILE
  29  Pet Profile (Public)
  30  Owner Profile (My Profile)
  31  Personality Card / Pet Identity
  32  Settings

UTILITY
  33  Notifications
  34  Chat / Inbox
  35  Chat Thread
  36  Lost & Found
```

---

## ONBOARDING

### Screen 01 — Splash Screen

```
┌────────────────────────────────┐
│                                │
│  ████████████████████████████  │  bg: blue-950 (#172554)
│  █                          █  │
│  █                          █  │
│  █                          █  │
│  █                          █  │
│  █         ╭──────╮         █  │
│  █         │  🐾  │         █  │
│  █         ╰──────╯         █  │
│  █                          █  │
│  █      FURR  CIRCLE        █  │  Poppins 800, white
│  █   Where Pets Become      █  │  Inter 400, blue-300
│  █         Social           █  │
│  █                          █  │
│  █    ──────────────────    █  │  animated loading bar
│  █                          █  │  blue-600 progress
│  ████████████████████████████  │
│                                │
└────────────────────────────────┘
```

---

### Screens 02–04 — Onboarding Slides

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│  ●  ○  ○              Skip     │   │  ○  ●  ○              Skip     │
│                                │   │                                │
│  ┌────────────────────────┐    │   │  ┌────────────────────────┐    │
│  │                        │    │   │  │                        │    │
│  │  [Illustration:        │    │   │  │  [Illustration:        │    │
│  │   pet profile cards    │    │   │  │   swipe cards /        │    │
│  │   floating with        │    │   │  │   two pets             │    │
│  │   hearts + badges]     │    │   │  │   facing each other]   │    │
│  │                        │    │   │  │                        │    │
│  └────────────────────────┘    │   │  └────────────────────────┘    │
│                                │   │                                │
│  Your Pet's Digital            │   │  Match. Play.                  │
│  Identity                      │   │  Connect.                      │
│                                │   │                                │
│  Build a rich profile —        │   │  Find playdates, adoption      │
│  photos, breed, personality,   │   │  matches, and playmates        │
│  health badges & zodiac.       │   │  for your pet nearby.          │
│                                │   │                                │
│  ┌──────────────────────────┐  │   │  ┌──────────────────────────┐  │
│  │        Next  →           │  │   │  │        Next  →           │  │
│  └──────────────────────────┘  │   │  └──────────────────────────┘  │
└────────────────────────────────┘   └────────────────────────────────┘
 Slide 1: Create Identity             Slide 2: Match & Discover

┌────────────────────────────────┐
│  ○  ○  ●              Skip     │
│                                │
│  ┌────────────────────────┐    │
│  │  [Illustration:        │    │
│  │   vet + community +    │    │
│  │   stories feed]        │    │
│  └────────────────────────┘    │
│                                │
│  Adopt. Care.                  │
│  Belong.                       │
│                                │
│  Verified vets, rescue         │
│  stories, and a community      │
│  that gets pet parents.        │
│                                │
│  ┌──────────────────────────┐  │
│  │   Get Started  🐾        │  │  bg: blue-700
│  └──────────────────────────┘  │
│   Already have an account?     │
│   ─────── Log In ───────       │
└────────────────────────────────┘
 Slide 3: Care & Community
```

---

### Screen 05 — Sign Up / Login

```
┌────────────────────────────────┐
│  ←                             │
│                                │
│  🐾  Furr Circle               │  logo + wordmark
│                                │
│  Welcome!                      │  Poppins 700, 28px
│  Create your account           │  Inter 400, slate-400
│                                │
│  ┌──────────────────────────┐  │
│  │  🇮🇳 +91  │  Phone Number│  │  border: blue-200
│  └──────────────────────────┘  │  focus: blue-500 border
│                                │
│  ┌──────────────────────────┐  │
│  │  Continue with OTP       │  │  bg: blue-700, white text
│  └──────────────────────────┘  │
│                                │
│  ─────────── or ───────────    │
│                                │
│  ┌──────────────────────────┐  │
│  │  G  Continue with Google │  │  border: slate-200
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Continue with Apple   │  │  border: slate-200
│  └──────────────────────────┘  │
│                                │
│  By continuing you agree to    │
│  our Terms of Service and      │
│  Privacy Policy                │
└────────────────────────────────┘
```

---

### Screen 06 — OTP Verification

```
┌────────────────────────────────┐
│  ←                             │
│                                │
│  Verify your number            │  Poppins 700, 28px
│                                │
│  We sent a 6-digit code to     │
│  +91 98765 XXXXX               │  blue-600 for number
│                                │
│  ┌────┐  ┌────┐  ┌────┐        │
│  │    │  │    │  │    │        │  3+3 split OTP boxes
│  └────┘  └────┘  └────┘        │  active box: blue-600 border
│              ·                 │  separator dot
│  ┌────┐  ┌────┐  ┌────┐        │
│  │    │  │    │  │    │        │
│  └────┘  └────┘  └────┘        │
│                                │
│  Resend code in  0:42          │  blue-600 timer
│                                │
│  ┌──────────────────────────┐  │
│  │     Verify  ✓            │  │  bg: blue-700
│  └──────────────────────────┘  │
│                                │
│  Wrong number? Change          │  blue-600 link
└────────────────────────────────┘
```

---

### Screens 07–09 — Profile Setup (3-step flow)

```
STEP 1 — Owner Info
┌────────────────────────────────┐
│  Step 1 of 3                   │
│  ████████░░░░░░░  33%          │  blue-600 progress
│                                │
│        ╭───────────╮           │
│        │  + Photo  │           │  circular upload
│        │  Upload   │           │  blue-100 bg, blue-600 border
│        ╰───────────╯           │
│                                │
│  ┌──────────────────────────┐  │
│  │  Full Name               │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  City / Location  📍     │  │
│  └──────────────────────────┘  │
│                                │
│  I am a...                     │
│  ┌───────────┐  ┌───────────┐  │
│  │  🐾        │  │  🏥       │  │  selected: blue-700 bg
│  │  Pet Owner │  │  Vet /    │  │  white text + blue border
│  │            │  │  Shelter  │  │
│  └───────────┘  └───────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Continue →            │  │  bg: blue-700
│  └──────────────────────────┘  │
└────────────────────────────────┘

STEP 2 — Pet Setup
┌────────────────────────────────┐
│  Step 2 of 3                   │
│  ████████████████░  66%        │
│                                │
│        ╭───────────╮           │
│        │  + Photo  │           │
│        │  of Pet   │           │
│        ╰───────────╯           │
│                                │
│  ┌──────────────────────────┐  │
│  │  Pet's Name              │  │
│  └──────────────────────────┘  │
│                                │
│  Species                       │
│  ┌───────┐  ┌───────┐  ┌────┐  │
│  │  🐶   │  │  🐱   │  │ +  │  │
│  │  Dog  │  │  Cat  │  │More│  │
│  └───────┘  └───────┘  └────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Breed (optional)        │  │
│  └──────────────────────────┘  │
│                                │
│  Age    ○ Puppy  ○ Adult        │
│         ○ Senior               │
│  Gender  ○ Male  ○ Female       │
│                                │
│  ┌──────────────────────────┐  │
│  │    Continue →            │  │
│  └──────────────────────────┘  │
│  Skip — I'll add pets later    │  slate-400 link
└────────────────────────────────┘

STEP 3 — Interest Tags
┌────────────────────────────────┐
│  Step 3 of 3                   │
│  ████████████████████  100%    │
│                                │
│  What are you here for?        │
│  (select all that apply)       │
│                                │
│  ┌─────────────┐ ┌───────────┐ │
│  │ 🐾 Social   │ │ 💞 Match  │ │  selected: blue-700 bg
│  │    Feed     │ │ Playdates │ │  unselected: white + border
│  └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌───────────┐ │
│  │ 🏠 Adopt    │ │ 🏥 Find   │ │
│  │    a Pet    │ │   Vets    │ │
│  └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌───────────┐ │
│  │ 💬 Community│ │ 📸 Share  │ │
│  │             │ │  Content  │ │
│  └─────────────┘ └───────────┘ │
│                                │
│  Favourite breeds / topics     │
│  ┌──────┐ ┌──────┐ ┌────────┐  │
│  │ Labs │ │Persian│ │Indie🐕│  │
│  │  ✓  │ │       │ │       │  │
│  └──────┘ └──────┘ └────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Enter Furr Circle  🐾   │  │  bg: blue-700
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## HOME (SCREEN 10 — EXISTING, DO NOT CHANGE)

> The existing home screen is kept exactly as-is.
> It contains: greeting, pet card slider (blue-900 gradient),
> upcoming reminders, quick actions, nearby vets, community spotlight.

---

## DISCOVER

### Screen 11 — Discover Hub

```
┌────────────────────────────────┐
│  Discover               🔔  💬 │  header: white/dark bg
│                                │
│  ┌──────────────────────────┐  │
│  │  🔍  Search pets, vets,  │  │  bg: blue-50
│  │      breeds, people...   │  │  border: blue-200
│  └──────────────────────────┘  │
│                                │
│  ─── Explore ──────────────    │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  🐶  │ │  🐱  │ │  🏠  │   │  icon grid
│  │ Dogs │ │ Cats │ │Adopt │   │  bg: blue-50
│  └──────┘ └──────┘ └──────┘   │  icon: blue-600
│  ┌──────┐ ┌──────┐ ┌──────┐   │  label: slate-700
│  │  🏥  │ │  🌍  │ │ 🐾   │   │
│  │ Vets │ │Local │ │Breeds│   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── Reels for You ─────────   │
│                                │
│  ┌────────┐ ┌────────┐         │
│  │[Video  │ │[Video  │         │  horizontal scroll
│  │ thumb] │ │ thumb] │         │  rounded-16
│  │ ▶      │ │ ▶      │         │  16:9 ratio
│  │ 4.2k ❤│ │ 2.8k ❤│         │
│  └────────┘ └────────┘         │
│                                │
│  ─── Pets Near You ─────────   │
│                                │
│  ┌────────┐  ┌────────┐        │
│  │[photo] │  │[photo] │        │  2-col grid
│  │ Bruno  │  │  Lily  │        │  card: white + shadow
│  │Lab · 2y│  │Tabby·1y│        │  badge: blue-100
│  │ 📍3km  │  │ 📍1km  │        │
│  └────────┘  └────────┘        │
│                                │
│  ─── Breed Communities ──────  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🐕  Golden Retriever Club │  │
│  │      12.4k members    →  │  │  chevron right
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🐈  Persian Cat Lovers    │  │
│  │      8.9k members     →  │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🐕  Indie Dogs India      │  │
│  │      21k members      →  │  │
│  └──────────────────────────┘  │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ║ Home ║ Disc ║Match ║ Comm ║Pr║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 12 — Reels Fullscreen Player

```
┌────────────────────────────────┐
│  ←  Reels                      │  translucent overlay
│                                │
│ ┌──────────────────────────┐   │
│ │                          │   │
│ │                          │   │
│ │   [ Full screen          │   │
│ │     pet video reel       │   │
│ │     vertical scroll ]    │   │
│ │                          │   │
│ │                          │   │
│ │                          │   │
│ │                          │   │
│ └──────────────────────────┘   │
│                                │
│  ┌──────────┐                  │
│  │ 🐶 [avi] │  @maxthegolden   │  bottom info overlay
│  │          │  Mumbai · Lab    │  gradient: black → transparent
│  └──────────┘                  │
│  "Park day with my hooman 🐾   │
│   #goldenlife #labrador"       │
│                        💬 286  │  right action column
│                        ❤️ 4.2k │
│                        ↗ Share │
│                        ⊕ Profile│
│                                │
│  ♪  Trending Sound · Use it   │  music pill bottom
└────────────────────────────────┘
```

---

### Screen 13 — Search Results

```
┌────────────────────────────────┐
│  ←  "labrador"                 │
│                                │
│  ┌──────────────────────────┐  │
│  │  🔍  labrador            │  │
│  └──────────────────────────┘  │
│                                │
│  Pets │ Vets │ People │ Posts  │  filter tabs
│  ────  │      │        │       │  blue-700 active underline
│                                │
│  ┌──────────────────────────┐  │
│  │ [photo]  Bruno            │  │
│  │          Labrador · 2y    │  │
│  │          Bangalore · 3km  │  │
│  │          🏠 For Adoption  │  │  success-green badge
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [photo]  Max              │  │
│  │          Golden Lab · 1y  │  │
│  │          Mumbai           │  │
│  │          🎾 Playdate open │  │  blue badge
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 14 — Adoption Card Detail

```
┌────────────────────────────────┐
│  ←                    ↗ Share  │
│                                │
│  ┌──────────────────────────┐  │
│  │                          │  │  full-width photo
│  │   [ Bruno's Photo ]      │  │  aspect: 4:3
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  Bruno                    Male │  Poppins 700, 24px
│  Labrador · 2 years            │
│  📍 Koramangala, Bangalore      │
│                                │
│  ┌──────┐ ┌──────────┐ ┌──────┐│
│  │ 💉   │ │ 🏠        │ │ 😊   ││  badge row
│  │Vacc. │ │ Trained  │ │Kids  ││  bg: blue-100
│  └──────┘ └──────────┘ └──────┘│
│                                │
│  About Bruno                   │
│  Rescued from MG Road.         │
│  Loves fetch, cuddles, and     │
│  long walks. Great with kids   │
│  and other dogs.               │
│                                │
│  Shelter: Happy Paws Rescue  ✓ │  verified badge
│  ⭐ 4.9 · 234 adoptions        │
│                                │
│  ┌──────────────────────────┐  │
│  │  💙  Apply to Adopt      │  │  bg: blue-700
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  💬  Message Shelter     │  │  bg: blue-50, blue-700 text
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## MATCH

### Screen 15 — Match Hub (Adoption Mode)

```
┌────────────────────────────────┐
│  Match                   💬    │  header
│                                │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 🏠   │  🐾  │  💙  │  👤  │ │  mode tabs
│  │Adopt │Friend│Breed │Owner │ │  active: blue-700 bg + white
│  │  ●   │      │      │      │ │  inactive: blue-50 bg
│  └──────┴──────┴──────┴──────┘ │
│                                │
│         ╭─────────────╮        │  card stack, 3 deep
│         │             │        │  top card fully visible
│         │  [ Bruno's  │  ✓ Ver │  shadow: blue-tinted
│         │    Photo ]  │        │  radius: 24dp
│         │             │        │
│         │             │        │
│         │             │        │
│         ╰─────────────╯        │
│                                │
│    Bruno                  2 yrs│  Poppins 700
│    Labrador · Male             │  Inter 400
│    📍 Bangalore · 3.2 km       │
│                                │
│    🏠 House-trained             │  tag pills: blue-100 bg
│    💉 Vaccinated               │  blue-700 text
│    😊 Loves kids               │
│                                │
│    "Rescued from MG Road.      │  2 lines max
│     Needs a warm home 🐾"      │
│                                │
│         ✗           ❤️         │  action buttons
│       Pass         Adopt       │  pass: white + red border
│                                │  adopt: blue-700 solid
│   ┌──────────────────────────┐ │
│   │  ⓘ  More about Bruno    │ │  ghost button, blue-600
│   └──────────────────────────┘ │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 16 — Match (Playdate Mode)

```
┌────────────────────────────────┐
│  Match                   💬    │
│                                │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 🏠   │  🐾  │  💙  │  👤  │ │
│  │Adopt │Friend│Breed │Owner │ │
│  │      │  ●   │      │      │ │
│  └──────┴──────┴──────┴──────┘ │
│                                │
│         ╭─────────────╮        │
│         │   [Luna's   │        │
│         │   Photo]    │        │
│         │    🐱       │        │
│         ╰─────────────╯        │
│                                │
│    Luna               1.5 yrs  │
│    Persian · Female            │
│    📍 Mumbai · 1.8 km          │
│                                │
│    Compatibility               │
│    ████████████░░  82%         │  progress bar: blue-600 fill
│                                │
│    Loves: Nap zones,           │
│    window watching, treats     │
│                                │
│    🐾  Personality match with Max│  blue-50 bg pill
│                                │
│         ✗           💙         │
│        Skip        Playdate    │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 17 — Match (Breed Mode)

```
┌────────────────────────────────┐
│  Match                   💬    │
│                                │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 🏠   │  🐾  │  💙  │  👤  │ │
│  │Adopt │Friend│Breed │Owner │ │
│  │      │      │  ●   │      │ │
│  └──────┴──────┴──────┴──────┘ │
│                                │
│  ┌──────────────────────────┐  │
│  │ ⓘ  Ethical breeding only │  │  info banner: blue-50
│  │    Verified profiles      │  │  border: blue-200
│  └──────────────────────────┘  │
│                                │
│         ╭─────────────╮        │
│         │  [Bella's   │  ✓ Ver │
│         │   Photo]    │        │
│         │    🐶       │        │
│         ╰─────────────╯        │
│                                │
│    Bella               3 yrs   │
│    Golden Retriever · Female   │
│    📍 Delhi · 12 km            │
│                                │
│    Health Score  ████████ 97%  │
│    DNA Tested   ✓              │  verified green
│    Vet Certified ✓             │
│                                │
│         ✗           💙         │
│        Skip       Connect      │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 18 — Match (Owner Mode)

```
┌────────────────────────────────┐
│  Match                   💬    │
│                                │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 🏠   │  🐾  │  💙  │  👤  │ │
│  │Adopt │Friend│Breed │Owner │ │
│  │      │      │      │  ●   │ │
│  └──────┴──────┴──────┴──────┘ │
│                                │
│         ╭─────────────╮        │
│         │  [Priya's   │        │
│         │   Photo]    │        │
│         ╰─────────────╯        │
│                                │
│    Priya Sharma                │
│    @priyapets · Mumbai         │
│    📍 2.4 km away              │
│                                │
│    Pets:  🐶 Max  🐱 Luna       │
│                                │
│    "Golden retriever mom.      │
│     Rescue advocate 🐾"        │
│                                │
│    ┌──────┐ ┌──────┐ ┌──────┐  │
│    │Posts │ │Follwrs│ │ 🐾  │  │
│    │  240 │ │ 1.2k │ │  2  │  │
│    └──────┘ └──────┘ └──────┘  │
│                                │
│         ✗           💙         │
│        Skip        Connect     │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 19 — It's a Match! Overlay

```
┌────────────────────────────────┐
│                                │
│  bg: blue-950 @ 90% opacity    │
│       + subtle confetti        │
│                                │
│         ✨  ✨  ✨              │
│                                │
│       It's a Match!            │  Poppins 800, 32px, white
│                                │
│   ┌──────────┐  ┌──────────┐   │
│   │ [Max🐶] │  │[Luna🐱]  │   │  two pet photos
│   │  circle  │  │  circle  │   │  border: blue-400
│   │  border  │  │  border  │   │  pulse animation
│   └──────────┘  └──────────┘   │
│                                │
│   Max and Luna would           │
│   make great playmates! 🐾     │  Inter 400, blue-200
│                                │
│   ┌──────────────────────────┐ │
│   │  💬  Send a Message      │ │  bg: blue-600
│   └──────────────────────────┘ │
│                                │
│   ┌──────────────────────────┐ │
│   │  📅  Plan a Playdate     │ │  bg: blue-50, blue-700 text
│   └──────────────────────────┘ │
│                                │
│          Keep Swiping          │  slate-300, underline
│                                │
└────────────────────────────────┘
```

---

## COMMUNITY

### Screen 20 — Community Feed

```
┌────────────────────────────────┐
│  Community              ✏️  🔍 │
│                                │
│  ┌──────────────────────────┐  │
│  │ [Stories Bar]            │  │
│  │ ◉  ◉  ◉  ◉  ◉  ◉  + Add │  │  avatar circles
│  └──────────────────────────┘  │  user story / add story
│                                │
│  For You │ Trending │ Nearby   │  tab pills
│  ───────  │          │          │  blue-700 active underline
│                                │
│  ┌──────────────────────────┐  │
│  │ 🐶 Max  @maxthegolden    │  │
│  │    Bangalore · 2h · 🌐   │  │
│  │                          │  │
│  │  ┌────────────────────┐  │  │
│  │  │                    │  │  │  photo card
│  │  │  [ Pet Photo ]     │  │  │  radius: 12
│  │  │                    │  │  │
│  │  └────────────────────┘  │  │
│  │                          │  │
│  │  Finally got my first    │  │
│  │  haircut! 🐾 #goldenlife │  │
│  │                          │  │
│  │  ❤️ 342  💬 28  ↗ 12    │  │  action row
│  │  ─────────────────────── │  │
│  │  Write a comment...      │  │  inline comment CTA
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🐱 Luna  @luna_persian   │  │
│  │    Mumbai · 5h           │  │
│  │  ┌────────────────────┐  │  │
│  │  │   [ Reel  ▶ ]      │  │  │  reel thumbnail + play icon
│  │  └────────────────────┘  │  │
│  │  ❤️ 1.2k  💬 94  ↗ 67   │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🏥 Dr. Anand Sharma      │  │  sponsored/vet tip card
│  │    Verified Vet · Sponsor │  │  blue-50 bg, blue-200 border
│  │  "Summer heat tips for    │  │
│  │   your dog"  → Read      │  │
│  └──────────────────────────┘  │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 21 — Community Thread / Discussion

```
┌────────────────────────────────┐
│  ←  Health & Nutrition         │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🐶  @goldenmom_priya     │  │
│  │     Chennai · 3h ago     │  │
│  │                          │  │
│  │ My dog stopped eating    │  │
│  │ suddenly. Is this        │  │
│  │ serious? He's 2 yrs old, │  │
│  │ Labrador.                │  │
│  │                          │  │
│  │  ⬆ 48    💬 34 replies   │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │  top answer card
│  │  ✓ Vet Verified Answer   │  │  border-left: blue-600, 4px
│  │                          │  │  bg: blue-50
│  │  🏥 Dr. Anand Sharma     │  │
│  │     Verified Vet  ✓      │  │  blue badge
│  │                          │  │
│  │  Could be stress, heat,  │  │
│  │  or upset stomach.       │  │
│  │  If >24hrs without food, │  │
│  │  visit a vet. Watch for  │  │
│  │  lethargy or vomiting.   │  │
│  │                          │  │
│  │  ⬆ 112   💬  Reply       │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │  disclaimer banner
│  │  ⚠️  Community advice is  │  │  bg: amber-50
│  │  not a substitute for    │  │  border: amber-200
│  │  professional vet care.  │  │
│  └──────────────────────────┘  │
│                                │
│  More replies (30) ▾           │  expand replies
│                                │
│  ┌──────────────────────────┐  │
│  │  Reply...       📷   ↗   │  │  reply input
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 22 — Post Creation

```
┌────────────────────────────────┐
│  ×  New Post              Post │
│                                │
│  ┌───────┐  Priya Sharma       │
│  │ [pic] │  @priyapets         │
│  └───────┘  Audience: Everyone ▼│
│                                │
│  Tag a pet:                    │
│  ┌──────┐ ┌──────┐             │
│  │ Max  │ │ Luna │             │
│  │  ✓  │ │      │             │
│  └──────┘ └──────┘             │
│                                │
│  ┌──────────────────────────┐  │
│  │  What's Max up to? ...   │  │  multiline input
│  │                          │  │  min 4 lines
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  + Add Photos or Video   │  │  image/video picker
│  └──────────────────────────┘  │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  📷  │ │  🎬  │ │  📍  │   │  media action row
│  │ Photo│ │ Reel │ │ Loc  │   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  # Topic Tag                   │
│  ┌──────────────────────────┐  │
│  │ # Health, Training...    │  │
│  └──────────────────────────┘  │
│                                │
│  Is this a rescue story?       │
│  ┌──────────────────────────┐  │
│  │ 🐾 Use rescue template   │  │  blue-50 bg, blue-600 text
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │           Post           │  │  bg: blue-700
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 23 — Breed Community Page

```
┌────────────────────────────────┐
│  ←  Golden Retriever Club      │
│                                │
│  ┌──────────────────────────┐  │
│  │  [ Community Banner ]    │  │  wide banner photo
│  │  Golden Retriever Club   │  │  gradient overlay bottom
│  │  🐕  12.4k members       │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────┐ ┌──────┐ ┌────────┐  │
│  │ Join │ │ Share│ │  Bell  │  │  action row
│  │  +   │ │  ↗   │ │  🔔    │  │
│  └──────┘ └──────┘ └────────┘  │
│                                │
│  About                         │
│  A community for Golden        │
│  Retriever parents worldwide.  │
│                                │
│  Posts │ Members │ Events      │  tab switcher
│  ─────  │         │            │
│                                │
│  🔥 Trending Posts             │
│  ┌──────────────────────────┐  │
│  │ @labmom "My golden's     │  │
│  │ first swim! 🏊" ❤️ 2.3k  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ @goldenclub "Are carrots │  │
│  │ safe daily?" 💬 89       │  │
│  └──────────────────────────┘  │
│                                │
│   ✏️  Post in this community   │  FAB-style CTA
└────────────────────────────────┘
```

---

## CARE

### Screen 24 — Care Hub

```
┌────────────────────────────────┐
│  Care                    🔔 📍 │  header
│                                │
│  ┌──────────────────────────┐  │
│  │ 🚨  Emergency? Find the  │  │  emergency banner
│  │     nearest open clinic  │  │  bg: danger red gradient
│  │     →                    │  │  white text, radius 16
│  └──────────────────────────┘  │
│                                │
│  ─── Quick Access ───────────  │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  🏥  │ │  📹  │ │  🔔  │   │  3-tile row
│  │ Find │ │Online│ │Remind│   │  bg: blue-50 (light)
│  │  Vet │ │Conslt│ │  ers │   │  icon: blue-600
│  └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  🤖  │ │  📋  │ │  📍  │   │
│  │  AI  │ │ Pet  │ │ Lost │   │
│  │Check │ │Passp.│ │Found │   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── Max's Care Schedule ────  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🔴  Rabies vaccine        │  │  overdue: red-50 bg
│  │     Overdue · Book now → │  │  red border
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🔵  Deworming             │  │  upcoming: blue-50 bg
│  │     Due Jun 15 · 7 days  │  │  blue-200 border
│  └──────────────────────────┘  │
│                                │
│  ─── Verified Vets Nearby ───  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🏥  PetCare Clinic        │  │
│  │     ⭐ 4.8 · 0.9 km      │  │
│  │     Open Now             │  │  success-green dot
│  │     ┌──────────────────┐ │  │
│  │     │  Book            │ │  │  blue-50 + blue-700 text
│  │     └──────────────────┘ │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  🤖  FurrAI Symptom Check│  │  AI banner
│  │  "Describe symptoms →"   │  │  blue gradient bg
│  └──────────────────────────┘  │
└────────────────────────────────┘

  Note: Care is accessible via:
  → Home quick actions  (Find Vet, Log Vaccine, Log Vital)
  → Profile → Care & Health section
  → Direct deep link /care
```

---

### Screen 25 — Vet Profile

```
┌────────────────────────────────┐
│  ←  Vet Profile         ↗Share │
│                                │
│  ┌──────────────────────────┐  │
│  │  [ Clinic Banner Photo ] │  │  full-width banner
│  └──────────────────────────┘  │
│                                │
│  ┌──────┐                      │
│  │[Dr   │  PetCare Clinic      │  photo + info float
│  │ Pic  │  Dr. Anand Sharma    │
│  │  ✓   │  ⭐ 4.8  (312)       │  verified blue badge
│  └──────┘  BVSc · 12 yrs exp  │
│                                │
│  📍 Koramangala · 0.9 km       │
│  🕐 9am – 8pm (Mon–Sat)        │
│  🟢 Open Now                   │  green status dot
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │  CTA row
│  │ Book │ │ Call │ │ Chat │   │  Book: blue-700
│  │ Appt │ │  📞  │ │  💬  │   │  Call/Chat: blue-50
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  Specialisations               │
│  ┌──────┐ ┌──────┐ ┌──────┐   │  tag pills
│  │ Dogs │ │ Cats │ │Surgry│   │  blue-100 bg, blue-700 text
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  Reviews  (312)                │
│  ┌──────────────────────────┐  │
│  │ ⭐⭐⭐⭐⭐  "Excellent care │  │
│  │  for my lab"             │  │
│  │  @labmom_kavya  · 2d     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ⭐⭐⭐⭐⭐  "Very patient  │  │
│  │  with anxious cats"      │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Book Appointment      │  │  bg: blue-700, sticky bottom
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 26 — Book Appointment

```
┌────────────────────────────────┐
│  ←  Book Appointment           │
│                                │
│  PetCare Clinic — Dr. Sharma   │
│                                │
│  Which pet?                    │
│  ┌──────┐ ┌──────┐             │
│  │ Max  │ │ Luna │             │
│  │  🐶  │ │  🐱  │             │
│  │  ✓  │ │      │             │
│  └──────┘ └──────┘             │
│                                │
│  Select Date                   │
│  ┌──────────────────────────┐  │
│  │  June 2026               │  │
│  │  Mo Tu We Th Fr Sa Su    │  │  calendar grid
│  │  1  2  3  4  5  6  7     │  │  selected: blue-700 circle
│  │  8  9  10 11 ●  13 14    │  │
│  └──────────────────────────┘  │
│                                │
│  Select Time                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │9am │ │10am│ │11am│ │2pm │   │  time chips
│  │    │ │  ● │ │    │ │    │   │  selected: blue-700
│  └────┘ └────┘ └────┘ └────┘   │
│                                │
│  Reason (optional)             │
│  ┌──────────────────────────┐  │
│  │  e.g. annual checkup...  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Confirm Booking  ✓    │  │  bg: blue-700
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 27 — AI Symptom Checker

```
┌────────────────────────────────┐
│  ←  AI Symptom Checker    🤖   │
│                                │
│  ┌──────────────────────────┐  │
│  │  🤖  Hi! I'm FurrAI.     │  │  intro card
│  │                          │  │  bg: blue-50, border: blue-200
│  │  I'll help assess your   │  │
│  │  pet's symptoms.         │  │
│  │                          │  │
│  │  ⚠️ Not a substitute for │  │  amber disclaimer pill
│  │     professional vet care│  │
│  └──────────────────────────┘  │
│                                │
│  Which pet?                    │
│  ┌──────┐ ┌──────┐             │
│  │ Max  │ │ Luna │             │
│  │  🐶  │ │  🐱  │             │
│  └──────┘ └──────┘             │
│                                │
│  Select symptoms               │
│  ┌───────────┐ ┌───────────┐   │
│  │ 🍽️ Not   │ │ 🤢 Vomit  │   │  symptom chips
│  │   Eating  │ │    ing    │   │  selected: blue-700 bg
│  └───────────┘ └───────────┘   │  unselected: white + border
│  ┌───────────┐ ┌───────────┐   │
│  │ 😴 Lethgc │ │ 🦵 Limping│   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │ 💨 Coughing│ │ 👁️ Dschrg│   │
│  └───────────┘ └───────────┘   │
│                                │
│  Describe in your words        │
│  ┌──────────────────────────┐  │
│  │  acting lethargic since  │  │
│  │  morning, not drinking.. │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │    Assess Symptoms  →    │  │  bg: blue-700
│  └──────────────────────────┘  │
│                                │
│  ─── Result (after assess) ──  │
│                                │
│  ┌──────────────────────────┐  │
│  │  ⚠️  See a vet soon       │  │  severity badge
│  │      HIGH concern         │  │  red-50 bg, red border
│  │                          │  │
│  │  Symptoms reported:      │  │
│  │  • Not eating            │  │
│  │  • Lethargy              │  │
│  │                          │  │
│  │  These symptoms together │  │
│  │  may indicate illness.   │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  🚨  Find Emergency Vet  │  │  bg: red-600
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📅  Book Appointment    │  │  bg: blue-50, blue-700 text
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 28 — Pet Passport / Health Records

```
┌────────────────────────────────┐
│  ←  Max's Passport        ↗    │
│                                │
│  ┌──────────────────────────┐  │  passport card
│  │  [Max's photo]           │  │  blue-900 gradient bg
│  │  Max · Labrador · 2 yrs  │  │  white text
│  │  📍 Bangalore             │  │
│  │  🆔 FC-DOG-2024-0042     │  │  pet ID
│  └──────────────────────────┘  │
│                                │
│  ─── Vaccination Record ─────  │
│                                │
│  ┌──────────────────────────┐  │
│  │  ✅ Rabies          2024 │  │  done: green check
│  │  ✅ DHPP            2024 │  │
│  │  🔴 Bordetella   Overdue │  │  overdue: red
│  │  🔵 Annual Checkup Jun'26│  │  upcoming: blue
│  └──────────────────────────┘  │
│                                │
│  ─── Health Stats ───────────  │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Weight│ │Height│ │ Heart│   │  stat cards
│  │ 28kg │ │ 56cm │ │Score │   │  bg: blue-50
│  │      │ │      │ │  95  │   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── Documents ──────────────  │
│                                │
│  ┌──────────────────────────┐  │
│  │  📄  Vet Certificate     │→ │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📄  Prescription Apr'26 │→ │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  + Add Record            │  │  ghost button, blue-600
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## PROFILE

### Screen 29 — Pet Profile (Public View)

```
┌────────────────────────────────┐
│  ←  🐾 Max                ↗   │
│                                │
│  ┌──────────────────────────┐  │
│  │  [ Cover / Banner Photo ]│  │  full-width, 3:1 ratio
│  └──────────────────────────┘  │
│       ╭──────────╮             │
│       │ [Max pic]│  Max        │  avatar overlapping banner
│       │  circle  │  Golden Retriever   │
│       ╰──────────╯  2 yrs · Male · Bangalore   │
│                                │
│  ┌──────┐ ┌──────────┐ ┌──────┐│  health badges row
│  │  💉  │ │  🏠      │ │  😊  ││  bg: blue-100
│  │Vacc. │ │ Adopted  │ │Kids  ││  text: blue-700
│  └──────┘ └──────────┘ └──────┘│
│                                │
│  ┌──────────────────────────┐  │  request playdate CTA
│  │  💙  Request Playdate    │  │  bg: blue-700
│  └──────────────────────────┘  │
│                                │
│  ─── Stats ──────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  240 │ │  18  │ │  56  │   │
│  │Posts │ │Match │ │Frndz │   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── Personality Card ───────  │
│  ┌──────────────────────────┐  │
│  │  ♌ Leo  ·  🌟 Aura: Gold │  │  blue-50 bg
│  │  Mood today:  😄 Excited  │  │
│  │  Vibe:  Playful & Gentle  │  │
│  └──────────────────────────┘  │
│                                │
│  Posts  ▦   Reels  ▤  Tagged   │  grid switcher
│                                │
│  ┌─────┐ ┌─────┐ ┌─────┐      │  3-col photo grid
│  │ [P1]│ │ [P2]│ │ [P3]│      │
│  └─────┘ └─────┘ └─────┘      │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ [P4]│ │ [P5]│ │ [P6]│      │
│  └─────┘ └─────┘ └─────┘      │
└────────────────────────────────┘
```

---

### Screen 30 — Owner Profile (My Profile)

```
┌────────────────────────────────┐
│  👤 My Profile         ⚙️ Edit │
│                                │
│  ┌──────────────────────────┐  │
│  │  [ Profile Cover ]       │  │  blue-900 gradient default
│  └──────────────────────────┘  │
│       ╭──────────╮             │
│       │ [User pic│  Priya Sharma│
│       │  circle  │  @priyapets │
│       ╰──────────╯  Mumbai, India│
│                                │
│  "Golden retriever mom 🐶      │
│   Rescue advocate 🐾"          │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 1.2k │ │  324 │ │  289 │   │
│  │Follwr│ │Follwg│ │ ❤️   │   │
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── My Pets ────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │[Max] │ │[Luna]│ │  +   │   │  pet bubbles
│  │  🐶  │ │  🐱  │ │ Add  │   │  blue-100 bg
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ─── Menu ───────────────────  │
│  ┌──────────────────────────┐  │
│  │  📋  Pet Passport       →│  │  care entry point
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🏥  Care & Health      →│  │  → /care
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🔖  Saved Posts        →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📝  My Posts           →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🔔  Notifications      →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  ⚙️  Settings           →│  │
│  └──────────────────────────┘  │
│                                │
│  🌙 Dark Mode        ○────●    │  toggle switch
│                                │
│  My Posts  ▦  Reels  ▤  Saved  │
│                                │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ [P1]│ │ [P2]│ │ [P3]│      │
│  └─────┘ └─────┘ └─────┘      │
│                                │
│ ╔══════╦══════╦══════╦══════╦══╗│
│ ║  🏠  ║  🔍  ║  💞  ║  💬  ║👤║│
│ ╚══════╩══════╩══════╩══════╩══╝│
└────────────────────────────────┘
```

---

### Screen 31 — Pet Personality Card (Shareable)

```
┌────────────────────────────────┐
│                                │
│  ┌──────────────────────────┐  │
│  │  bg: blue-900 gradient   │  │  shareable card
│  │                          │  │  16:9 or square
│  │   FURR CIRCLE            │  │  Poppins 800, white
│  │                          │  │
│  │   ╭──────────╮           │  │
│  │   │ [Max pic]│           │  │
│  │   ╰──────────╯           │  │
│  │                          │  │
│  │   Max                    │  │
│  │   Golden Retriever · 2y  │  │  blue-200 text
│  │                          │  │
│  │   ♌  Leo                 │  │
│  │   🌟  Aura: Golden        │  │
│  │   💥  Energy: Chaotic     │  │
│  │   💙  Vibe: Cuddle King   │  │
│  │                          │  │
│  │   #FurrCircle  @maxgolden│  │  footer
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  ↗  Share Card           │  │  bg: blue-700
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  ✏️  Customise           │  │  blue-50 bg
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 32 — Settings

```
┌────────────────────────────────┐
│  ←  Settings                   │
│                                │
│  Account                       │  section header
│  ┌──────────────────────────┐  │
│  │  ✏️  Edit Profile       →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🐾  My Pets            →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  🔒  Privacy Settings   →│  │
│  └──────────────────────────┘  │
│                                │
│  Preferences                   │
│  ┌──────────────────────────┐  │
│  │  🔔  Notifications      →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  💞  Match Preferences  →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📍  Location           →│  │
│  └──────────────────────────┘  │
│                                │
│  Premium  ✨                   │
│  ┌──────────────────────────┐  │
│  │  🌟  Upgrade to Plus     │  │  bg: blue-50, blue-700 border
│  │      Unlimited Swipes    │  │
│  │      Profile Boost       │  │
│  │      Priority in Search  │  │
│  └──────────────────────────┘  │
│                                │
│  Support                       │
│  ┌──────────────────────────┐  │
│  │  ❓  Help & FAQ         →│  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  ⚠️  Report a Problem   →│  │
│  └──────────────────────────┘  │
│                                │
│  ─────────────────────────────  │
│  Log Out                        │  red-600 text
│  Delete Account                 │  red-600 text
└────────────────────────────────┘
```

---

## UTILITY SCREENS

### Screen 33 — Notifications

```
┌────────────────────────────────┐
│  ←  Notifications     Mark all │
│                                │
│  New                           │  section header
│  ┌──────────────────────────┐  │
│  │ 💙  @luna_persian + Max  │  │  unread: blue-50 bg
│  │     matched!             │  │  blue-200 left border
│  │     Plan a playdate →    │  │
│  │     2 min ago            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ❤️   342 people liked    │  │
│  │     your reel            │  │
│  │     3h ago               │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │  care reminder
│  │ 💉  Max's Rabies vaccine │  │  bg: amber-50
│  │     due in 7 days        │  │  amber border
│  │     Book Now →           │  │
│  └──────────────────────────┘  │
│                                │
│  Earlier                       │
│  ┌──────────────────────────┐  │
│  │ 💬  @dranimals replied   │  │  read: white bg
│  │     to your question     │  │
│  │     in Health · 1d       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 👋  @goldenclub started  │  │
│  │     following you · 1d   │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 34 — Chat Inbox

```
┌────────────────────────────────┐
│  ←  Messages           ✏️ New  │
│                                │
│  ┌──────────────────────────┐  │
│  │  🔍  Search messages     │  │
│  └──────────────────────────┘  │
│                                │
│  Match Requests  (3)           │  section pill: blue-700
│  ┌──────────────────────────┐  │
│  │  🐱 Luna + Max           │  │  match request card
│  │     Want a playdate?     │  │  bg: blue-50
│  │     New match · 2m    → │  │
│  └──────────────────────────┘  │
│                                │
│  Messages                      │
│  ┌──────────────────────────┐  │
│  │  [pic]  @samlab          │  │  unread: bold name
│  │  "Haha Bruno does the    │  │  grey dot for unread count
│  │   same thing!"           │  │
│  │   12:34 PM   ✓✓          │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  [pic]  Dr. Anand Sharma │  │
│  │  "Your prescription is   │  │
│  │   ready"                 │  │
│  │   Yesterday   ✓          │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

### Screen 35 — Chat Thread

```
┌────────────────────────────────┐
│  ←  🐕 Bruno + Max        📅  │
│     @samlab · Active now       │
│                                │
│  ────── Today ─────────────    │  date divider
│                                │
│  ┌──────────────────────────┐  │  received bubble
│  │  Hey! Bruno loved        │  │  bg: blue-50
│  │  Max's latest reel 😂    │  │  radius: 16 16 16 4
│  │                 12:30 PM │  │
│  └──────────────────────────┘  │
│                                │
│    ┌──────────────────────────┐│  sent bubble
│    │  Haha they'd be best     ││  bg: blue-700
│    │  friends for sure 🐾     ││  white text
│    │  12:32 PM  ✓✓            ││  radius: 16 16 4 16
│    └──────────────────────────┘│
│                                │
│  ┌──────────────────────────┐  │
│  │  [Bruno's photo 🐶]      │  │  image message
│  │  Check Bruno at the      │  │
│  │  park today!             │  │
│  │             12:35 PM     │  │
│  └──────────────────────────┘  │
│                                │
│  ────────────────────────────  │
│  📅 Plan Playdate              │  contextual CTA bar
│  ────────────────────────────  │
│                                │
│  ┌────────────────────────────┐│
│  │  Message...      📷    ↗  ││  input bar
│  └────────────────────────────┘│
└────────────────────────────────┘
```

---

### Screen 36 — Lost & Found

```
┌────────────────────────────────┐
│  ←  Lost & Found          🔔   │
│                                │
│  ┌──────────────────────────┐  │  urgent alert
│  │ 🔴  Lost dog 0.4km away  │  │  bg: red-50
│  │     Bruno · Lab · 2h ago │  │  border: red-300
│  │     Contact @samlab  →  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │  search
│  │  🔍  Search by name...   │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────┐ ┌──────┐ ┌──────┐   │  filter tabs
│  │🐾 All│ │🔴Lost│ │🟢Fnd │   │  active: colour fill
│  └──────┘ └──────┘ └──────┘   │
│                                │
│  ┌──────────────────────────┐  │
│  │ [photo]   Bruno          │  │  report card
│  │  🔴 LOST                 │  │  red badge top-right
│  │  Labrador · Brown        │  │
│  │  📍 Koramangala · 0.4km  │  │
│  │  "Last seen MG Road..."  │  │
│  │  @samlab  [Contact]      │  │  contact btn: blue-700
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ [photo]   Unknown Cat    │  │
│  │  🟢 FOUND                │  │  green badge
│  │  Tabby · Orange          │  │
│  │  📍 Indiranagar · 1.2km  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────┐          │  FAB
│  │  + Report Pet    │          │  bg: blue-700, bottom-right
│  └──────────────────┘          │
└────────────────────────────────┘
```

---

## Navigation Map

```
┌──────────────────────────────────────────────────────────────────┐
│                        NAVIGATION STRUCTURE                      │
├────────────┬────────────┬────────────┬────────────┬─────────────┤
│  🏠 Home   │  🔍 Disc.  │  💞 Match  │  💬 Comm.  │  👤 Profile │
├────────────┼────────────┼────────────┼────────────┼─────────────┤
│ Greeting   │ Search     │ Adopt mode │ Stories    │ Own profile │
│ Pet cards  │ Categories │ Playdate   │ Feed tabs  │ Pet bubbles │
│ Reminders  │ Reels feed │ Breed mode │ Post detail│ Pet Passport│
│ Quick acts │ Pet browse │ Owner mode │ Post create│ Care & Health│
│ Nearby vets│ Breed clubs│ Match ovly │ Breed comm │ Saved posts │
│ Community  │ Adopt cards│            │            │ Settings    │
│ spotlight  │            │            │            │ Dark mode   │
├────────────┴────────────┴────────────┴────────────┴─────────────┤
│  SECONDARY ROUTES (no tab — back nav)                           │
│  /care          Care Hub (accessible from Home + Profile)       │
│  /care/ai-check AI Symptom Checker                              │
│  /vets          Vet list                                         │
│  /vets/[id]     Vet profile + Book                              │
│  /appointments  Appointment list + booking                       │
│  /lost-found    Lost & Found                                     │
│  /reminders     Reminders management                            │
│  /health/       Health record screens                            │
│  /community/    Posts, chats, events                            │
│  /notifications Notification centre                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## User Journey Flows

### Journey 1 — New Adopter
```
Onboarding → Sign Up → Setup (Owner) → Setup (Pet optional)
→ Interest: Adoption → Home → Discover → Adoption card
→ Match tab (Adopt) → Swipe Bruno → Right-swipe → Match overlay
→ Apply to Adopt → Chat shelter → Book visit → Adopt pet
→ Share rescue story → Community
```

### Journey 2 — Social Pet Parent
```
Sign Up → Setup (Owner + Pet) → Home Feed (existing)
→ Community tab → For You feed → Create reel → Get likes
→ Stories → Discover → Breed community → Daily retention loop
```

### Journey 3 — First-Time Owner (Care)
```
Sign Up → Setup → Home → Quick action "Find Vet"
→ Care Hub → Upcoming reminders + nearby vets
→ Ask question in Community → Vet answers
→ AI Checker → Low severity → Book appointment
→ Pet Passport → Store records → Regular return
```

### Journey 4 — Playdate Seeker
```
Sign Up → Setup pet → Match tab (Playdate mode)
→ Swipe Luna → 82% compatibility → Right swipe
→ It's a Match overlay → Send message
→ Chat → Plan Playdate → Share playdate story
→ Grow followers
```

---

## Component Reference

### Trust Badge System
```
✓ Verified Vet         blue-600  (#2563eb)
✓ Verified Shelter     green-600 (#16a34a)
✓ Vaccinated           blue-400  (#60a5fa)
⭐ Trusted Breeder     blue-700  (#1d4ed8)
🔴 Emergency Clinic    red-600   (#dc2626)  — safety, not brand
👑 Premium Member      purple-600 (#9333ea)
```

### Bottom Tab Bar
```
┌──────┬──────┬──────┬──────┬──────┐
│  🏠  │  🔍  │  💞  │  💬  │  👤  │
│ Home │ Disc │Match │ Comm │ Prof │
└──────┴──────┴──────┴──────┴──────┘
Height: 60dp   Icon: 24dp   Label: 10sp Inter 600
Active: blue-700 (#1d4ed8)  (light) / blue-400 (dark)
Inactive: slate-400
Center Match: 74×74dp raised circle, blue-700 filled, white heart icon
Background: white/dark blur  Shadow: blue-tinted 0 -8 18
```

### Swipe Card
```
Width: screen - 40px   Aspect: 1:1.35
Photo: top 68%         Info: bottom 32%
Radius: 24dp           Shadow: blue-tinted 0 8 24
Badge: blue-600 bg, white, absolute top-right
Tag pills: blue-100 bg, blue-700 text, radius 20
LIKE stamp: green border + text, -15deg rotation
NOPE stamp: red border + text, +15deg rotation
```

### Post Card
```
Header: avatar (40px) + name + role badge + time
Body: text (max 4 lines) + optional media
Media: radius 12, cover fill
Actions: ❤️ Like  💬 Comment  ↗ Share  🔖 Save
Engagement: Inter 500 12px, slate-400 color
```

---

## Phase 1 MVP Build Priority

| Priority | Screen | Why |
|---|---|---|
| P0 | Onboarding + Auth | Entry gate |
| P0 | Home (existing) | Core retention — DO NOT CHANGE |
| P0 | Community Feed | Daily engagement |
| P0 | Post Creation | UGC engine |
| P1 | Match — Adopt mode | Core differentiator |
| P1 | Discover Hub | Growth surface |
| P1 | Pet Profile (public) | Social identity |
| P1 | Notifications | Re-engagement |
| P2 | Match — Playdate mode | Retention booster |
| P2 | Care Hub | Monetization |
| P2 | Vet Profile + Booking | Revenue |
| P2 | Chat Inbox | Social glue |
| P3 | AI Symptom Checker | Trust + stickiness |
| P3 | Reels fullscreen | Virality |
| P3 | Breed Communities | Network effects |
| P3 | Lost & Found | Community trust |
| P3 | Pet Passport | Healthcare depth |
| P3 | Personality Card | Viral shares |

---

*Furr Circle — The Social Ecosystem for Modern Pet Parents*
*"Where Every Pet Finds Their Circle."*
