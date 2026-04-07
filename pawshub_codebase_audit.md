# PawsHub — Full Codebase Audit & Integration Planning Prompt

## Your Role
You are a senior full-stack mobile engineer. Your job is to do a **thorough, exhaustive audit** of the entire PawsHub codebase before we write a single line of new code.

---

## Project Structure
This monorepo has three parts:
- `mobile-expo/` — Expo + React Native app (UI built in Lovable, mostly dummy/unintegrated)
- `backend/` — Node.js backend (largely incomplete or not built)
- `admin/` — Next.js admin panel

**Our focus for this session is the mobile app + backend integration.**

---

## Step 1 — Read the Codebase Thoroughly

Go through **every single file** in `mobile-expo/` and `backend/`. Do not skip any folder. Read:
- Every screen component
- Every navigation file (tabs, stacks, routes)
- Every service/API call file
- Every mock/dummy data file
- Every form component
- Every button and CTA
- The backend route files, controllers, models, middleware

As you read, build a **complete mental map** of what exists.

---

## Step 2 — Produce a Full Audit Report

After reading everything, output a structured audit report in the following format:

---

### 2A. Screen Inventory
List every screen you found. For each screen:
```
Screen Name: [name]
File Path: [path]
Status: [Dummy UI Only | Partially Integrated | Fully Integrated | Broken]
Navigation: [Does tapping into this screen work? Yes / No / Partial]
```

---

### 2B. Navigation Audit
List every navigation route, tab, and stack. For each:
```
Route: [route name or path]
Type: [Tab | Stack | Modal | Bottom Sheet]
Source Screen: [where does the user come from]
Target Screen: [where does it go]
Working: [Yes / No / Crashes]
Issues: [describe any broken links, missing screens, wrong destinations]
```

Flag any:
- Dead-end navigations (screen with no way back)
- Buttons that do nothing
- Missing screens that are referenced but not created
- Duplicate screens doing the same job

---

### 2C. CTA & Button Audit
List every button, CTA, and interactive element across all screens:
```
Screen: [screen name]
Element: [button label or icon description]
Expected Action: [what should happen]
Actual Behavior: [what currently happens — nothing / console.log / navigates wrong / crashes]
Status: [Wired Up | Dummy | Broken | Missing]
```

---

### 2D. Dummy Data & Mock Audit
List every place where hardcoded or mock data is used:
```
Screen/File: [path]
What is mocked: [e.g. pet list, vet cards, vaccine records]
Where real data should come from: [API endpoint / Supabase table / local state]
```

---

### 2E. Forms Audit
For every form in the app:
```
Screen: [screen name]
Form Purpose: [e.g. Add Pet, Sign Up, Apply for Adoption]
Fields Present: [list them]
Validation: [Yes / No / Partial]
Submission Handler: [exists / missing / dummy]
API Call on Submit: [Yes / No — if yes, which endpoint]
Success/Error Handling: [exists / missing]
```

---

### 2F. Backend Audit
List every API route/controller found in the backend:
```
Route: [method + path, e.g. POST /api/pets]
Controller: [file and function]
Model/DB: [connected to DB model? Yes / No]
Auth Protected: [Yes / No]
Status: [Complete | Stub | Missing | Broken]
```

Then list every API call the mobile app makes (or should make) that has **no corresponding backend route yet**.

---

### 2G. Auth Flow Audit
Trace the entire auth flow:
- Is sign up functional end-to-end?
- Is log in functional?
- Is the auth token being stored securely?
- Are protected routes actually protected?
- What happens when the token expires?
- Is onboarding skippable in a way that breaks the app state?

---

### 2H. State Management Audit
- What global state exists?
- Where is the selected/active pet stored?
- Is the user object persisted correctly?
- Are there any state inconsistencies between screens?

---

### 2I. Duplicate & Redundant Code
List any:
- Duplicate screen components doing the same thing
- Duplicate API call logic not extracted into a service
- Copy-pasted UI blocks that should be shared components
- Inconsistent styling patterns (some NativeWind, some inline, some StyleSheet)

---

### 2J. Missing Screens
Based on the product spec, list every screen that **should exist but doesn't**:
```
Missing Screen: [name]
Required For: [which user flow]
Priority: [High / Medium / Low]
```

---

## Step 3 — Prioritized Fix Plan

After the full audit, produce a prioritized task list in this format:

### Priority 1 — Blockers (App cannot function without these)
- [ ] Task description | File(s) affected | Estimated effort

### Priority 2 — Core Flows (Health tracking, Pet CRUD, Auth)
- [ ] Task description | File(s) affected | Estimated effort

### Priority 3 — Integration Work (Wiring dummy screens to real backend)
- [ ] Task description | File(s) affected | Estimated effort

### Priority 4 — Polish & UX Gaps
- [ ] Task description | File(s) affected | Estimated effort

### Priority 5 — Missing Screens to Build from Scratch
- [ ] Task description | Estimated effort

---

## Step 4 — Confirm Before Acting

**Do NOT make any code changes yet.**

After delivering the full audit report and prioritized plan, stop and ask me:
> "Audit complete. Which priority item would you like to tackle first?"

We will go one task at a time. For each task, you will:
1. Show me exactly what you're going to change and why
2. Wait for my confirmation
3. Make the change
4. Verify it works
5. Move to the next task

---

## Important Constraints
- Do not refactor working code unless it is a blocker
- Preserve the existing UI design — do not restyle screens
- When integrating backend, use the existing service/API file pattern if one exists
- Flag anything that needs an environment variable or external config
- If Supabase is being used, note every table and RLS policy that needs to exist
- TypeScript errors count as broken — flag them

---

## Start Now
Begin by reading the full codebase. Start with the folder structure overview, then go screen by screen. Take your time. A thorough audit now saves hours of debugging later.