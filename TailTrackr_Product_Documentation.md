# TailTrackr — Product, UX, and Engineering Documentation

## 1. Product Overview

**Product name:** TailTrackr  
**Platform:** Mobile app  
**Stack:** Expo, React Native, NativeWind, Gluestack UI  
**Primary users:** Pet parents, adopters, rescue volunteers, foster caregivers, and veterinary discovery users

TailTrackr is a mobile-first pet care platform that combines **pet health tracking**, **nearby vet discovery**, **adoption workflows**, and a **pet community** into one app.

The core idea is simple:

> One app to manage a pet’s life — from vaccines and checkups to adoption and community support.

Most pet apps solve only one part of the journey:
- reminder apps handle vaccines and medications
- maps apps help find vets
- adoption apps list pets
- social apps create community

TailTrackr combines all of these in a single, trustworthy system.

---

## 2. Vision

Build the most useful everyday app for pet parents and future pet parents.

TailTrackr should feel:
- warm
- trustworthy
- organized
- modern
- calm
- premium but friendly

The app should reduce anxiety for pet owners by making it easy to:
- remember health events
- organize pet records
- find nearby care
- connect with nearby pet people
- safely manage adoptions

---

## 3. USP (Unique Selling Proposition)

### Main USP
**TailTrackr is an all-in-one pet care and adoption app that helps users track health, discover nearby vets, connect with community, and manage adoption in one place.**

### Why it stands out
1. **Health + Community + Adoption + Discovery in one app**
2. **Pet-first experience**, not just owner-first
3. **Clean, calm mobile UX** designed around trust
4. **Action-based home dashboard** with reminders and status cards
5. **Local utility**, including nearby vets and care services
6. **Adoption workflow**, not just passive listings

### Positioning statement
TailTrackr helps pet parents stay on top of care, connect with trusted services, and find or rehome pets responsibly through one simple app.

---

## 4. Product Goals

### Business goals
- Launch an MVP with strong daily/weekly retention
- Become a trusted pet utility app, not just a browsing app
- Build repeat usage through reminders and records
- Create community-led growth through shares, profiles, and adoption
- Introduce future monetization through premium services, partner listings, and verified vet/rescue programs

### User goals
- Never forget a vaccine or medication
- Keep all pet records in one place
- Find a nearby vet fast
- Discover helpful community content
- Put a pet up for adoption or apply for one safely
- Manage multiple pets without confusion

---

## 5. Audience Segments

### Primary users
#### 5.1 Pet parents
People with one or more pets who want reminders, medical logs, and nearby services.

#### 5.2 New adopters
People searching for pets to adopt and wanting trustworthy listings.

#### 5.3 Foster and rescue users
Users who post pets for adoption, review applications, and manage status.

#### 5.4 Community users
Pet lovers who post updates, ask questions, and connect locally.

### Secondary users
- veterinary clinics
- rescues and NGOs
- pet service providers
- groomers, trainers, walkers, boarding centers

---

## 6. Product Principles

1. **Trust first**  
   Medical and adoption flows must feel reliable and clear.

2. **Action over clutter**  
   The app should guide users to what matters next.

3. **Pet-centered organization**  
   Each pet has its own records, timeline, and health state.

4. **Warm but efficient**  
   Friendly visuals, efficient interactions.

5. **Local relevance**  
   Nearby vets, events, and pet people matter.

6. **Scalable design**  
   The design system should support fast feature expansion.

---

## 7. MVP Scope

### Included in MVP
- user onboarding
- auth
- pet profile creation
- multi-pet support
- health dashboard
- vaccine and medication reminders
- medical records logging
- nearby vet discovery
- adoption listings
- adoption detail and apply flow
- post pet for adoption
- community feed
- profile and settings

### Excluded from MVP
- telemedicine
- in-app payments
- insurance
- advanced AI diagnosis
- live video consultations
- rescue admin dashboards
- deep analytics for partners
- multilingual localization beyond phase 1
- wearable integrations

---

## 8. Information Architecture

### Main app sections
1. Home
2. Pets
3. Discover
4. Community
5. Profile

### Proposed bottom tab navigation
- **Home**
- **Pets**
- **Discover**
- **Community**
- **Profile**

### Secondary flows
- Add Pet
- Health Detail
- Vet Detail
- Adoption Detail
- Create Post
- Post for Adoption
- Notifications
- Settings
- Edit Profile

---

## 9. App Structure and Screen Inventory

## 9.1 Auth & Onboarding
- Splash
- Welcome / Intro
- Sign Up
- Log In
- OTP / Verification
- Basic Setup
- Add First Pet
- Permissions Prompt

## 9.2 Main App
- Home Dashboard
- Pet Switcher
- Pets List
- Pet Profile Detail
- Health Records
- Vaccination Tracker
- Medication Tracker
- Appointment Tracker
- Growth / Weight Log
- Documents / Reports
- Discover Landing
- Nearby Vets List
- Vet Detail
- Adoption List
- Adoption Detail
- Adoption Apply
- Create Adoption Listing
- Community Feed
- Post Detail
- Create Community Post
- Notifications
- User Profile
- Settings

---

## 10. User Flows

## 10.1 First-time user flow
1. Open app
2. Read value proposition slides
3. Sign up / continue
4. Enter name and city
5. Add first pet
6. Enter pet type, breed, age, weight
7. Add vaccine date or skip
8. Land on Home dashboard

## 10.2 Existing pet parent flow
1. Open app
2. See reminder cards
3. Tap due vaccination
4. Update vaccination status
5. Save record
6. Return to dashboard with updated health state

## 10.3 Adoption seeker flow
1. Open Discover
2. Browse adoption pets
3. Filter by species, age, location
4. Open pet detail
5. Apply for adoption
6. Track application status

## 10.4 Adoption lister flow
1. Open Discover or Profile
2. Tap Post for Adoption
3. Fill pet details, reason, behavior, location
4. Add images
5. Publish listing
6. Receive applications

## 10.5 Vet discovery flow
1. Open Discover
2. Search nearby vets
3. View map/list
4. Open clinic profile
5. Call, navigate, save, or book externally

---

## 11. Design Direction

## 11.1 Theme
**Primary theme:** Blue-900 led visual system  
Mood: dependable, safe, premium, calm

### Brand feel
- deep navy core
- soft cool neutrals
- high readability
- trust-building whites and muted accent tones
- subtle rounded shapes

### Why blue-900
Blue-900 communicates:
- trust
- healthcare
- navigation clarity
- professionalism
- emotional calm

It fits the product because TailTrackr handles sensitive pet care information and should feel dependable.

---

## 12. Visual Design System

## 12.1 Color palette

### Primary colors
- `blue-900` — primary brand, headers, main CTAs
- `blue-800` — pressed states, cards, highlighted sections
- `blue-700` — secondary CTA and active indicators

### Supporting neutrals
- `slate-950` — primary text on light backgrounds
- `slate-800` — secondary headings
- `slate-600` — body secondary text
- `slate-400` — placeholders, dividers
- `slate-200` — borders
- `slate-100` — muted surfaces
- `white` — cards, backgrounds, reversed text

### Semantic colors
- `emerald-600` — success, completed vaccines
- `amber-500` — upcoming reminders
- `rose-500` — urgent, overdue, destructive
- `sky-500` — info states
- `violet-500` — community highlights
- `teal-500` — adoption accent or rescue-related status

### Suggested usage balance
- 60% white / light surfaces
- 25% slate neutrals
- 10% blue brand surfaces
- 5% semantic highlights

---

## 12.2 Typography
Use system-friendly typography through React Native defaults, with Gluestack tokens for sizing and NativeWind utility classes.

### Type scale
- Display: 32 / 40
- H1: 28 / 36
- H2: 24 / 32
- H3: 20 / 28
- Title: 18 / 26
- Body: 16 / 24
- Caption: 14 / 20
- Micro: 12 / 16

### Font usage
- Bold / semibold for titles and metrics
- Medium for interactive labels
- Regular for body content

### Tone
Readable, calm, not too playful, not overly clinical.

---

## 12.3 Spacing system
Base spacing unit: **4**

Common usage:
- 4, 8, 12, 16, 20, 24, 32, 40

### Layout rhythm
- screen horizontal padding: 16 to 20
- card gap: 12 to 16
- section gap: 20 to 24
- large section separation: 32

---

## 12.4 Radius
- small controls: 10
- inputs: 12
- cards: 16
- bottom sheets: 24
- hero cards: 28

Rounded corners should feel soft and safe.

---

## 12.5 Elevation and shadow
Use subtle elevation:
- low shadow for cards
- medium shadow for floating actions / modals
- avoid heavy dramatic shadows

---

## 12.6 Iconography
Style:
- simple line icons
- rounded edges
- consistent stroke width
- readable at small sizes

Recommended set:
- Lucide-compatible style or similar

Common icons:
- home
- heart
- paw
- syringe
- stethoscope
- bell
- calendar
- map-pin
- users
- file-text
- plus
- chat
- shield

---

## 12.7 Component style language
Components should feel:
- structured
- warm
- lightly elevated
- high contrast
- clearly tappable

Buttons should be strong and easy to scan.
Cards should contain one clear primary action.

---

## 13. Design System Components

## 13.1 Buttons
### Variants
- Primary
- Secondary
- Ghost
- Destructive
- Icon button

### Primary button
- background: blue-900
- text: white
- radius: xl
- min height: 48

### Secondary button
- background: blue-50 or slate-100
- text: blue-900

### Ghost button
- transparent background
- text emphasis only

---

## 13.2 Inputs
- rounded
- left icon optional
- helper text supported
- error state visible
- clear focus ring
- good keyboard handling on mobile

Input types:
- text
- email
- password
- number
- search
- multiline notes
- date picker trigger
- dropdown / select

---

## 13.3 Cards
Common card types:
- reminder card
- pet summary card
- vet card
- adoption pet card
- community post card
- stat card

Shared card rules:
- white background
- 16 radius
- 12 to 16 padding
- subtle border or shadow
- one clear focal point

---

## 13.4 Chips and tags
Use for:
- pet type
- vaccine status
- adoption status
- post categories
- filters

Examples:
- Dog
- Cat
- Due Soon
- Vaccinated
- Rescue Verified
- Nearby

---

## 13.5 Bottom sheets
Use for:
- pet switcher
- quick add actions
- filters
- post options
- reminder detail actions

---

## 13.6 Navigation
- bottom tab bar with labels
- stack navigation for detail screens
- top header with contextual actions
- floating add action only where valuable

---

## 14. Screen-by-Screen Documentation

## 14.1 Splash Screen
### Purpose
Brand introduction and app loading state.

### Content
- TailTrackr logo
- subtle paw/pet line art
- blue-900 background or white background with blue mark
- loading indicator

### Notes
Should be visible briefly only.

---

## 14.2 Welcome / Intro Screens
### Purpose
Explain product value quickly.

### Slide themes
1. Track pet health in one place
2. Find nearby care and services
3. Adopt, rehome, and connect safely

### UI elements
- illustration or icon
- title
- short supporting text
- continue button
- skip option

---

## 14.3 Sign Up / Log In
### Purpose
User authentication.

### Fields
- name
- email / phone
- password
- social auth later optional

### Features
- validation
- password visibility
- terms checkbox
- CTA button
- login/sign up switch

---

## 14.4 Basic Setup Screen
### Purpose
Capture user preferences and region.

### Fields
- city / location
- pet interests
- allow notifications
- allow location access

### Output
Personalizes local discovery and reminders.

---

## 14.5 Add First Pet Screen
### Purpose
Create first pet profile.

### Fields
- pet photo
- pet name
- species
- breed
- gender
- age / DOB
- weight
- color
- adoption date
- spayed/neutered
- medical notes

### Actions
- Save pet
- Skip advanced details

---

## 14.6 Home Dashboard
### Purpose
Main action center.

### Core sections
1. greeting header
2. active pet summary
3. due reminders
4. upcoming appointments
5. quick actions
6. nearby vets preview
7. adoption/community highlights

### Recommended layout
#### Header
- greeting
- profile avatar
- notification icon

#### Pet summary card
- pet image
- pet name
- age / breed
- health score or status
- switch pet action

#### Reminder section
Cards for:
- vaccine due
- medication due
- appointment upcoming
- overdue action

#### Quick actions
- add record
- log vaccine
- find vet
- post for adoption
- create community post

#### Nearby preview
- 2 to 3 nearby vets with distance

#### Feed highlights
- trending adoption post
- recent community post

### Home success metric
User should know what to do next within 3 seconds.

---

## 14.7 Pets List Screen
### Purpose
Manage all pets.

### Features
- all pets in cards/list
- add new pet
- tap to open profile
- pet switcher state
- health status badge per pet

### Each pet card shows
- avatar
- name
- species
- breed
- age
- due reminder count

---

## 14.8 Pet Profile Detail
### Purpose
Full detail of a single pet.

### Sections
- hero section with photo and identity
- health overview
- records shortcuts
- notes
- adoption status if any

### Feature blocks
- vaccination tracker
- medications
- appointments
- documents
- weight / growth
- allergies
- conditions
- edit pet

---

## 14.9 Vaccination Tracker Screen
### Purpose
Track vaccine history and upcoming schedule.

### Features
- vaccine list
- status: completed / due / overdue
- add vaccine record
- upload certificate
- next due date

### Data points
- vaccine name
- date given
- next due
- vet name
- notes
- proof file/image

---

## 14.10 Medication Tracker Screen
### Purpose
Track medicine plans.

### Features
- active medications
- dosage
- frequency
- start/end dates
- reminder toggle
- mark as given

### Useful interactions
- swipe to mark done
- missed dose indicator
- refill reminder in future phase

---

## 14.11 Appointment Tracker Screen
### Purpose
Organize vet visits and care appointments.

### Features
- upcoming appointments
- past appointments
- add appointment
- attach notes
- clinic name
- reminder alert

---

## 14.12 Documents / Medical Reports
### Purpose
Store records.

### Supported items
- lab reports
- vaccine certificates
- prescriptions
- adoption papers

### Features
- upload image/PDF
- tag by category
- search
- open preview
- attach to pet

---

## 14.13 Discover Landing
### Purpose
Entry point for nearby services and adoption.

### Top modules
- search bar
- category chips
- nearby vets
- adoption section
- services section in future
- city-based suggestions

### Categories
- Vets
- Adoption
- Shelters
- Groomers later
- Trainers later

---

## 14.14 Nearby Vets List
### Purpose
Help users find local clinics fast.

### Features
- map/list toggle later
- search by name or area
- filters
- open now
- emergency
- rating
- distance
- save favorite

### Each vet card
- clinic name
- distance
- rating
- specialties
- hours
- CTA buttons

### CTA buttons
- Call
- Directions
- View Details

---

## 14.15 Vet Detail Screen
### Purpose
Show clinic details.

### Content
- clinic image/logo
- address
- map preview
- hours
- phone
- specialties
- services
- rating/reviews later
- emergency availability badge
- save/book/call actions

### Future additions
- booking
- chat
- records share

---

## 14.16 Adoption Listings Screen
### Purpose
Browse pets available for adoption.

### Features
- card grid or vertical feed
- filters by type, age, gender, location, urgent
- rescue verified badge
- save listing
- share listing

### Each adoption card
- pet image
- name
- species
- age
- location
- tag line
- verified badge

---

## 14.17 Adoption Detail Screen
### Purpose
Detailed pet adoption profile.

### Sections
- image gallery
- summary
- temperament
- medical status
- vaccinated / sterilized status
- adoption reason
- rescue or owner profile
- location
- requirements
- apply CTA

### Trust elements
- verification badge
- listed date
- response time
- adoption rules

---

## 14.18 Apply for Adoption Screen
### Purpose
Collect adopter interest safely.

### Fields
- full name
- location
- housing type
- previous pet experience
- why adopt
- family details
- contact info

### Actions
- submit application
- save draft

### Future
- application status tracking
- rescue review workflow

---

## 14.19 Create Adoption Listing Screen
### Purpose
Allow users to list a pet responsibly.

### Fields
- photos
- pet details
- health status
- vaccinated yes/no
- behavior notes
- location
- adoption reason
- ideal home notes
- contact method

### Validation
- mandatory welfare checks
- discourage unsafe rehoming
- moderation flagging

---

## 14.20 Community Feed
### Purpose
Create repeat engagement and peer support.

### Post types
- updates
- questions
- pet photos
- advice
- local recommendations
- adoption boosts

### Feed items
- user avatar
- pet tag
- text
- image
- engagement actions

### Actions
- like
- comment
- save
- share
- report

### Categories
- Health
- Adoption
- Training
- Nutrition
- Funny
- Lost & Found later

---

## 14.21 Create Community Post
### Purpose
Let users contribute content.

### Fields
- text
- image upload
- post category
- tag pet
- optional location
- privacy options later

---

## 14.22 Notifications Screen
### Purpose
Central inbox for reminders and updates.

### Notification types
- vaccine due
- medication reminder
- appointment alert
- adoption application update
- community interactions
- saved vet updates later

### Features
- unread/read state
- grouped by day
- quick actions

---

## 14.23 Profile Screen
### Purpose
User account and high-level management.

### Sections
- avatar and name
- number of pets
- saved vets
- adoption posts
- community posts
- settings
- help
- logout

---

## 14.24 Settings Screen
### Sections
- account
- notifications
- location preferences
- privacy
- pets and records
- support
- about

### Important toggles
- vaccine reminders
- medication reminders
- appointment reminders
- location on/off
- adoption application alerts

---

## 15. Data Model Overview

## 15.1 User
- id
- name
- email
- phone
- avatar
- city
- createdAt
- notificationPreferences
- savedVetIds
- savedAdoptionIds

## 15.2 Pet
- id
- ownerId
- name
- species
- breed
- gender
- dob
- weight
- photo
- color
- adoptionDate
- sterilized
- allergies
- medicalNotes
- createdAt

## 15.3 VaccineRecord
- id
- petId
- vaccineName
- dateGiven
- nextDueDate
- vetName
- notes
- attachmentUrl

## 15.4 Medication
- id
- petId
- name
- dosage
- frequency
- startDate
- endDate
- reminderEnabled
- notes

## 15.5 Appointment
- id
- petId
- clinicId
- dateTime
- reason
- notes
- reminderEnabled

## 15.6 VetClinic
- id
- name
- address
- location
- phone
- rating
- specialties
- hours
- emergencyAvailable
- image

## 15.7 AdoptionListing
- id
- ownerId
- petId optional
- title
- description
- species
- breed
- age
- location
- vaccinated
- sterilized
- temperament
- images
- status
- verified
- createdAt

## 15.8 AdoptionApplication
- id
- listingId
- applicantUserId
- answers
- status
- createdAt

## 15.9 CommunityPost
- id
- authorId
- petId optional
- category
- text
- images
- location
- createdAt
- likeCount
- commentCount

---

## 16. Technical Architecture Direction

## 16.1 Frontend stack
- Expo
- React Native
- Expo Router or React Navigation
- NativeWind
- Gluestack UI
- TypeScript
- React Query or TanStack Query
- Zustand or Context for lightweight local app state
- React Hook Form + Zod for forms
- Expo Notifications
- Expo Image Picker
- Expo Location
- Expo Secure Store

## 16.2 Backend suggestions
Pick one of these:
- Supabase
- Firebase
- Node.js + PostgreSQL
- NestJS + PostgreSQL

### Best MVP recommendation
**Supabase** for speed:
- auth
- postgres
- storage
- row-level security
- realtime where needed

---

## 17. Suggested Folder Structure

```txt
src/
  app/
  components/
    ui/
    cards/
    forms/
    layout/
  features/
    auth/
    home/
    pets/
    health/
    discover/
    adoption/
    community/
    profile/
  services/
    api/
    auth/
    notifications/
    location/
  hooks/
  store/
  types/
  utils/
  constants/
  theme/
  assets/
```

---

## 18. Recommended Navigation Structure

### Tabs
- Home
- Pets
- Discover
- Community
- Profile

### Stacks
Each tab can own its stack, for example:

- HomeStack
  - Home
  - Notifications
  - QuickAction screens

- PetsStack
  - PetsList
  - PetDetail
  - VaccineTracker
  - MedicationTracker
  - Appointments
  - Documents
  - AddPet

- DiscoverStack
  - DiscoverHome
  - VetsList
  - VetDetail
  - AdoptionList
  - AdoptionDetail
  - ApplyAdoption
  - CreateAdoption

- CommunityStack
  - Feed
  - PostDetail
  - CreatePost

- ProfileStack
  - Profile
  - Settings
  - EditProfile

---

## 19. State Management Plan

### Global state
- authenticated user
- selected pet
- notification status
- location permission state
- theme tokens if needed

### Server state
- pet records
- vet listings
- adoption listings
- community posts

### Form state
Use React Hook Form + Zod.

---

## 20. API / Service Modules

### Auth service
- signUp
- signIn
- signOut
- getCurrentUser

### Pets service
- createPet
- updatePet
- deletePet
- listPets
- getPetById

### Health service
- addVaccine
- listVaccines
- addMedication
- listMedications
- addAppointment
- listAppointments
- uploadDocument

### Discover service
- getNearbyVets
- getVetById
- searchVets

### Adoption service
- listAdoptions
- getAdoptionById
- createAdoption
- applyForAdoption
- listMyAdoptionPosts

### Community service
- listPosts
- createPost
- commentOnPost
- likePost

---

## 21. Notifications Strategy

### Reminder events
- due tomorrow
- due today
- overdue
- appointment in X hours
- medication scheduled time

### Push notification examples
- Bella’s rabies vaccine is due tomorrow.
- Bruno has medication scheduled at 8:00 PM.
- You received a new adoption application.
- Someone replied to your community post.

---

## 22. Empty State Strategy

Important because users may start with no pets, no records, or no posts.

### Examples
- No pets yet → “Add your first pet to start tracking care.”
- No vaccines logged → “Add vaccine history to stay on schedule.”
- No nearby vets found → “Try a wider location range.”
- No saved adoption posts → “Browse pets looking for a home.”

Empty states should include one action button.

---

## 23. Permissions

### Required
- notifications
- media library / camera
- location

### Permission timing
Ask only when the feature is needed, not all at once.

---

## 24. Accessibility

### Requirements
- readable text sizes
- good contrast against blue-900 theme
- tap targets at least 44x44
- icon + label, not icon only where possible
- semantic roles for buttons
- screen-reader friendly forms
- error messages clear and visible

---

## 25. Security and Trust

Because the app handles pet medical records and adoption profiles, trust is critical.

### Requirements
- secure auth
- protected user records
- moderation on adoption/community posts
- report/block flow
- safe image upload rules
- privacy-first defaults
- no public contact details without consent

---

## 26. Monetization Ideas for Later Phases

Not for MVP, but design should allow future insertion.

- premium health record backup
- premium reminder scheduling
- featured vet listings
- featured adoption boosts for shelters
- trusted rescue verification subscriptions
- local partner placements
- pet services marketplace

---

## 27. Analytics Events

Track at minimum:
- sign_up_completed
- pet_created
- vaccine_added
- medication_added
- appointment_added
- vet_opened
- vet_call_tapped
- adoption_listing_viewed
- adoption_applied
- adoption_post_created
- community_post_created
- push_notification_opened

---

## 28. MVP Release Plan

## Phase 1
- auth
- onboarding
- pet profiles
- reminders
- medical records
- home dashboard

## Phase 2
- nearby vets
- adoption browsing
- apply for adoption
- create adoption listing

## Phase 3
- community feed
- notifications polish
- saved content
- moderation tools

---

## 29. Development Priorities

### Build order
1. app shell and navigation
2. auth and onboarding
3. design system components
4. pet profile CRUD
5. health tracking flows
6. dashboard integration
7. discover / nearby vets
8. adoption flows
9. community feed
10. notifications and polish

---

## 30. UI Implementation Notes for Expo + NativeWind + Gluestack

## 30.1 Expo
Use Expo for:
- fast iteration
- notifications
- image picker
- location
- deep linking later

## 30.2 NativeWind
Use NativeWind for:
- layout
- spacing
- colors
- typography utilities
- fast screen styling

### Recommendation
Create semantic wrappers so brand tokens do not live only as raw class names.

## 30.3 Gluestack
Use Gluestack for:
- buttons
- inputs
- modals
- sheets
- toasts
- accessible primitives

### Recommendation
Wrap Gluestack primitives into app-specific components:
- AppButton
- AppInput
- AppCard
- AppHeader
- StatusBadge
- PetAvatar
- SectionHeader

---

## 31. Tailwind / Theme Token Direction

### Example brand tokens
- brand-primary: blue-900
- brand-secondary: blue-700
- brand-muted: slate-100
- text-primary: slate-950
- text-secondary: slate-600
- success: emerald-600
- warning: amber-500
- danger: rose-500

---

## 32. Suggested Reusable Components

- ScreenContainer
- AppHeader
- SectionHeader
- PrimaryButton
- SecondaryButton
- AppInput
- SearchInput
- PetAvatar
- PetCard
- ReminderCard
- VaccineCard
- MedicationCard
- VetCard
- AdoptionCard
- PostCard
- EmptyState
- StatusChip
- FilterChip
- FloatingActionButton
- BottomSheetMenu
- ConfirmDialog

---

## 33. Risks and Considerations

### Product risks
- too many features in MVP
- unclear primary use case
- adoption trust and moderation burden
- local vet data accuracy
- users dropping off before adding pet details

### Mitigation
- anchor app around pet health dashboard first
- keep community and adoption scoped
- use curated local data sources
- make onboarding very short
- prioritize reminders and records for retention

---

## 34. Success Metrics

### Product health metrics
- onboarding completion rate
- pet creation completion rate
- week-1 retention
- number of reminders created per user
- number of active pets per user
- adoption application conversion rate
- community post creation rate
- saved vet interactions

### MVP success target
A strong MVP proves that users return for care tracking, not just one-time browsing.

---

## 35. Suggested Tagline Ideas

- Care. Connect. Adopt.
- Everything your pet needs, in one app.
- Smarter care for happier pets.
- Track every tail wag.
- Pet care, community, and adoption — together.

---

## 36. Final Product Summary

TailTrackr is a blue-900 themed mobile platform for modern pet care. It helps users manage pet health records, receive reminders, discover nearby veterinary support, connect with other pet owners, and browse or post adoption listings. The app should launch with a polished and scalable design system built on Expo, React Native, NativeWind, and Gluestack, with an MVP focused on retention-driving utility first.

---

## 37. Immediate Next Build Checklist

1. Set up Expo project with TypeScript
2. Configure NativeWind
3. Configure Gluestack UI
4. Define theme tokens
5. Create navigation shell
6. Build auth screens
7. Build design system base components
8. Build Add Pet flow
9. Build Home dashboard
10. Build Pet detail and health modules
11. Connect backend auth and storage
12. Add discovery and adoption flows

---

## 38. Recommended Next Documents

After this file, create:
- technical architecture doc
- API schema doc
- database schema doc
- user stories doc
- screen wireframe checklist
- sprint roadmap
