# PawsHub Missing Functionality And Next Steps

Audit date: 2026-04-11

Scope reviewed:
- `mobile-expo/`
- `backend/`
- `admin-panel/`
- `frontend/` for project context

This file is a product and engineering next-steps audit. It intentionally does not change application code.

## Executive Summary

PawsHub already has a meaningful foundation:
- Expo mobile app with owner and veterinarian experiences.
- Express + Sequelize backend with auth, pets, health, appointments, reminders, community, chat, events, admin, and uploads.
- Next.js admin panel with real API calls for users, vets, pets, adoptions, community moderation, and events.
- Next.js marketing frontend.

The largest remaining gaps are not "missing UI everywhere"; they are workflow completeness and consistency gaps:
- Some important user flows exist only halfway, such as adoption/foster interest, owner appointments, reminders, notifications, saved vets, and password reset.
- Some screens are still static or partly decorative, especially mobile notifications, saved vets, my posts, security/settings, and admin settings/logs.
- Some backend and admin field names do not match, especially events using `image_url` in admin while the backend model stores `imageUrl`.
- Several production-readiness concerns remain: JWT fallback secret, public role lookup endpoint, auto schema sync, incomplete migrations, and no real reset/email/notification infrastructure.

## Verification Performed

Static TypeScript checks:
- `backend`: `npx tsc --noEmit` passed.
- `mobile-expo`: `npx tsc --noEmit` passed.
- `frontend`: `npx tsc --noEmit` passed.
- `admin-panel`: `npx tsc --noEmit` failed.

Admin panel TypeScript failures:
- `admin-panel/src/components/AdminHeader.tsx:47` uses `admin?.title`, but `AdminSession` does not define `title`.
- `admin-panel/src/components/Sidebar.tsx:65` uses `admin?.title`, but `AdminSession` does not define `title`.

## Priority 0 - Build And Data Integrity Blockers

### 1. Admin panel TypeScript build failure

Status: Missing/bug

Files:
- `admin-panel/src/contexts/AdminAuthContext.tsx`
- `admin-panel/src/components/AdminHeader.tsx`
- `admin-panel/src/components/Sidebar.tsx`

Issue:
- `AdminSession` has `id`, `name`, `email`, `role`, and `token`.
- Header and sidebar read `admin.title`, which does not exist.

Next step:
- Either remove `admin?.title` usage and use a literal/admin role label, or add a `title` field to the session type and set it during login.

### 2. Admin event fields do not match backend event model

Status: Missing/bug

Files:
- `backend/models/Event.ts`
- `backend/controllers/adminController.ts`
- `admin-panel/src/app/events/page.tsx`
- `mobile-expo/services/shared/normalizers.ts`
- `mobile-expo/components/ui/EventCard.tsx`

Issue:
- Backend model defines `imageUrl`.
- Admin panel form and table use `image_url`.
- Backend admin controller reads/writes `image_url`, but Sequelize model does not define that attribute.
- Admin panel uses event `status`, but backend model does not define `status`.
- Admin controller creates events with `createdBy`, but model defines `organizerId`.
- Mobile event cards consume `imageUrl`, while admin-created uploaded images are likely saved under a field the model ignores.

User impact:
- Event images and status can appear to save in the admin UI but not persist correctly.
- Mobile event images can be blank.
- Event organizer/host can be missing.

Next step:
- Standardize event fields across backend, admin, and mobile.
- Recommended backend fields: `organizerId`, `title`, `description`, `date`, `time`, `location`, `category`, `imageUrl`, `status`, `capacity`.
- Update admin to send `imageUrl`, or update backend to map `image_url` to `imageUrl`.

### 3. Community moderation policy is inconsistent

Status: Missing/bug

Files:
- `backend/controllers/communityController.ts`
- `backend/controllers/adminController.ts`
- `admin-panel/src/app/community/page.tsx`
- `backend/models/Post.ts`

Issue:
- `createCommunityPost` currently creates posts as `status: "approved"`.
- Admin moderation expects pending posts through `GET /api/admin/pending-posts`.
- Admin login page copy says moderators review community posts.
- Result: the pending moderation queue will often be empty because posts bypass moderation.

Next step:
- Decide product policy.
- If moderated feed is desired, create posts as `pending` and show pending state in mobile.
- If instant publishing is desired, remove or repurpose pending moderation UI.

### 4. Backend uses production-risk defaults

Status: Production readiness gap

Files:
- `backend/controllers/authController.ts`
- `backend/middleware/authMiddleware.ts`
- `backend/app.ts`
- `backend/models/index.ts`
- `backend/config/config.js`

Issues:
- JWT uses `process.env.JWT_SECRET || "fallback_secret"`.
- CORS is `origin: "*"` with credentials enabled.
- `sequelize.sync({ alter: true })` runs at startup.
- Only five migrations exist, while many models rely on sync/alter.
- No environment validation for AWS/S3, database, or JWT secrets.

Next step:
- Fail fast when required env vars are missing.
- Replace startup `alter` with migrations for every table.
- Restrict CORS by environment.
- Remove fallback JWT secret.

## Priority 1 - Core Missing Product Flows

### 5. Login and signup need explicit owner/shelter/veterinarian role toggles

Status: Missing UX/product flow

Files:
- `mobile-expo/app/signup.tsx`
- `mobile-expo/app/login.tsx`
- `mobile-expo/contexts/AuthContext.tsx`
- `mobile-expo/services/auth/authApi.ts`
- `backend/controllers/authController.ts`

Current state:
- Signup only offers `owner` and `veterinarian`.
- Shelter exists as a backend role, but there is no shelter signup toggle in the mobile UI.
- Login uses one shared email/password form for owners and vets.
- Users are not asked which account type they are logging into, so owner/vet/shelter auth feels blended.

Required behavior:
- Signup should have three role toggles: `Owner`, `Shelter`, and `Veterinarian`.
- Changing the signup toggle should change the form below it.
- Owner signup form should collect pet-parent basics such as name, email, password, phone/city if needed.
- Shelter signup form should collect organization/rescue details such as shelter name, contact person, email, password, phone, city/address.
- Veterinarian signup form should collect clinic/professional details such as doctor name, clinic/hospital name, specialty/profession, license number, email, password, phone, city/address.
- Login should also have three role toggles: `Owner`, `Shelter`, and `Veterinarian`.
- Changing the login toggle should change heading/helper text and any demo/development hints below it.
- Login may still use email/password fields, but submit should validate that the returned account role matches the selected toggle.

Backend/API note:
- Current `POST /api/auth/login` checks the `users` table first and then the `vets` table.
- To make role-specific login strict, either pass the selected role/userType to the same endpoint or add role-specific login endpoints behind the mobile `authApi.login` abstraction.
- If selected login role is `owner`, reject shelter/admin/vet credentials.
- If selected login role is `shelter`, reject owner/admin/vet credentials.
- If selected login role is `veterinarian`, authenticate against `vets` only.

Next step:
- Update signup UI to include three toggles and role-specific forms.
- Update login UI to include three toggles and role-specific copy/validation.
- Extend auth API payloads only as much as needed to keep routing and role checks unambiguous.

### 6. Owner appointment list and cancellation flow is missing

Status: Missing screen/functionality

Existing backend:
- `GET /api/appointments/owner`
- `PATCH /api/appointments/:id/status` lets owners cancel only.

Existing mobile:
- Booking screen exists: `mobile-expo/app/appointments/book.tsx`.
- No owner-facing screen lists appointment requests, confirmed appointments, cancelled appointments, or history.

Next step:
- Add owner appointments screen.
- Link it from home/profile.
- Show status, pet, vet, date/time, reason, and cancel action.

### 7. Reminder creation/edit/delete UI is missing

Status: Missing screen/functionality

Existing backend:
- `GET /api/reminders`
- `POST /api/reminders`
- `PUT /api/reminders/:id`
- `PATCH /api/reminders/:id/toggle`
- `DELETE /api/reminders/:id`

Existing mobile:
- `mobile-expo/app/reminders/index.tsx` lists and toggles reminders only.
- `mobile-expo/services/users/remindersApi.ts` exposes only list and toggle.

Next step:
- Add reminder create/edit form.
- Add service functions for create/update/delete.
- Support reminder types: general, vaccine, medication, appointment.
- Allow optional pet selection and recurrence.

### 8. Adoption/foster workflow is only chat-based

Status: Missing workflow

Existing backend:
- Pet listing flags: `isAdoptionOpen`, `isFosterOpen`.
- Discover pets endpoint: `GET /api/pets/discover`.
- Chat start endpoint: `POST /api/community/chats/start`.

Existing mobile:
- Pet owner can toggle adoption/foster visibility.
- Interested user taps request adoption/foster, which starts a chat.

Missing:
- Adoption applications.
- Foster applications.
- Application status: submitted, reviewing, accepted, rejected, withdrawn.
- Admin review of adoption/foster applications.
- Owner/shelter dashboard for applicants.
- Structured applicant fields, home details, pet experience, phone, city.

Next step:
- Add `adoption_applications` model and endpoints.
- Keep chat as follow-up, not as the only application record.
- Add admin applications review screen.

### 9. Saved vets feature is static and lacks backend

Status: Missing feature

Files:
- `mobile-expo/app/profile/vets.tsx`
- `mobile-expo/app/(tabs)/profile.tsx`
- `mobile-expo/app/vets/[id].tsx`
- `mobile-expo/app/(tabs)/discover.tsx`

Issue:
- Profile shows "Saved Vets" count as `5`.
- Saved vets screen renders a hardcoded list.
- Vet detail has no save/unsave action.
- Backend has no saved vets model or route.

Next step:
- Add `saved_vets` model with userId/userType and vetId.
- Add endpoints to save, unsave, and list saved vets.
- Wire mobile profile count and saved vets screen.

### 10. My posts screen is static and lacks a personal posts endpoint

Status: Missing feature

Files:
- `mobile-expo/app/profile/posts.tsx`
- `mobile-expo/app/(tabs)/profile.tsx`
- `backend/routes/communityRoutes.ts`

Issue:
- My Posts count is hardcoded as `8`.
- My Posts screen uses hardcoded posts.
- Backend has feed and post detail but no `GET /community/posts/me`.

Next step:
- Add endpoint for current user's posts.
- Include status, likes, comments, shares, image, createdAt.
- Wire profile count and My Posts screen.

### 11. Notifications are mostly static/local

Status: Missing system

Files:
- `mobile-expo/app/notifications/index.tsx`
- `mobile-expo/contexts/NotificationContext.tsx`
- `mobile-expo/app/_layout.tsx`

Current state:
- Notification screen uses a hardcoded `notifications` array.
- Global header always shows a red dot.
- Notification context polls chats every 30 seconds and stores last seen timestamps in AsyncStorage.
- No backend notifications table or notification endpoints exist.

Next step:
- Add notification model and routes.
- Generate notifications for appointment status, reminders, event bookings, chat messages, post moderation, and adoption applications.
- Replace static notification screen with API data.
- Make header badge reflect real unread count.

### 12. Password reset is only a placeholder

Status: Missing backend workflow and mobile UI

Files:
- `backend/controllers/authController.ts`
- `mobile-expo/app/login.tsx`

Issue:
- Backend `resetPassword` only returns "Password reset link sent" when an account exists.
- No token generation, email sending, reset confirmation, expiry, or new password endpoint.
- Login screen has no forgot-password UI.

Next step:
- Add reset token storage and expiry.
- Add email provider integration.
- Add forgot password and reset password screens.
- Avoid user enumeration in responses.

### 13. Vet verification is not enforced beyond discover listing

Status: Missing guard/policy

Files:
- `backend/middleware/authMiddleware.ts`
- `backend/routes/appointmentRoutes.ts`
- `mobile-expo/app/(vet-tabs)/_layout.tsx`
- `mobile-expo/app/signup.tsx`

Current state:
- Vet registration creates `isVerified: false`.
- Discover/list vets returns only verified vets.
- Unverified vets can still log in and access vet tabs.
- Vet dashboard/appointments endpoints use `vetOnly`, but do not require `isVerified`.
- Signup does not clearly explain pending verification.

Next step:
- Add `verifiedVetOnly` middleware for vet operational routes, or intentionally allow read-only pending dashboard.
- Add pending verification screen/state in mobile.
- Collect professional fields during vet signup: clinic/hospital, profession/specialty, license number, phone, city.
- Add license/credential fields to backend if verification is meant to be real.

## Priority 2 - Screen And CTA Gaps

### 14. Mobile settings and security screens are static

Status: Static UI

Files:
- `mobile-expo/app/profile/settings.tsx`
- `mobile-expo/app/profile/security.tsx`

Issues:
- Language, notification settings, storage, cache, terms, change password, 2FA, biometric auth, profile visibility, and location visibility are not persisted or wired.
- Version is hardcoded as `v2.4.0`.
- Storage used is hardcoded as `128 MB`.

Next step:
- Decide which settings belong in MVP.
- Wire app version to Expo constants/package metadata.
- Add change password flow using existing profile update or a dedicated endpoint.
- Persist notification/email/location preferences if they are real product features.

### 15. Admin settings and logs are static

Status: Static UI

Files:
- `admin-panel/src/app/settings/page.tsx`

Issues:
- System settings values are hardcoded.
- "Recent Logs" is generated from `[1, 2, 3, 4]`.
- Buttons do not edit settings or view real audit logs.
- "Operatinal" typo in API status label.

Next step:
- Add backend system settings/audit log endpoints, or mark the page as read-only static documentation.
- Add real health/status endpoint usage.

### 16. Mobile event booking success copy is inaccurate

Status: Mock copy to remove

File:
- `mobile-expo/app/community/events/[id].tsx`

Issue:
- After booking an event, alert says: "In the current mock setup this is stored locally in the app."
- Backend persists bookings in `event_bookings`.

Next step:
- Replace copy with real booking confirmation.

### 17. Event auto-seeding creates demo data at runtime

Status: Mock/demo data to remove or move

File:
- `backend/controllers/communityController.ts`

Issue:
- `seedEventsIfNeeded` creates "Puppy Social Mixer" and "Vaccination Drive" when events are empty.
- This happens from user-facing event endpoints.

Next step:
- Move demo seeding into an explicit seed script.
- Do not write demo data from GET requests.

### 18. Demo login and demo seed accounts should be environment-gated

Status: Demo data to remove/gate before production

Files:
- `mobile-expo/app/login.tsx`
- `backend/scripts/seedDemoAccounts.ts`

Current state:
- Login screen has quick demo buttons for `demo.owner@pawshub.app` and `demo.vet@pawshub.app`.
- Backend has `npm run seed-demo`.

Next step:
- Show demo login only in development.
- Ensure demo accounts are not present in production data.

### 19. Community author modeling does not fully support vets/admin

Status: Data model gap

Files:
- `backend/models/Post.ts`
- `backend/models/Comment.ts`
- `backend/models/Like.ts`
- `backend/controllers/communityController.ts`
- `backend/controllers/adminController.ts`

Issues:
- Posts store only `userId`, not `authorType`.
- Comments store only `userId`, not `authorType`.
- Likes store only `userId`, not `userType`.
- Saved posts include `userType`, but likes/comments do not.
- Admin post listing includes only `User` as author, so vet-authored posts can show missing/unknown author.

Next step:
- Add `authorType`/`userType` fields consistently where users and vets can both interact.
- Update admin post serialization to resolve user/vet authors like the mobile feed serializer does.

### 20. Profile counts are partial or hardcoded

Status: Partial/static

Files:
- `mobile-expo/app/(tabs)/profile.tsx`
- `mobile-expo/app/(vet-tabs)/profile.tsx`

Issues:
- Owner pet count is real after profile refresh, but saved vets and my posts counts are hardcoded.
- Vet menu items are decorative and do not navigate.
- Vet profile relies on profile fields but lacks stats integration for patient count/reviews.

Next step:
- Add real counts from APIs.
- Wire vet profile menu to existing tabs/screens or remove until ready.

### 21. Owner/vet appointment detail screens are missing

Status: Missing screen

Existing:
- Owner booking.
- Vet list and status update.

Missing:
- Appointment detail screen.
- Appointment notes editing/history.
- Owner cancellation from detail.
- Vet access to appointment-linked pet records in context.

Next step:
- Add appointment detail route shared by owner/vet with role-specific actions.

### 22. Medical record and vaccine documents are not uploadable/downloadable

Status: Missing feature

Files:
- `mobile-expo/app/health/vaccines.tsx`
- `mobile-expo/app/health/records.tsx`
- `backend/models/Vaccine.ts`
- `backend/models/MedicalRecord.ts`

Issues:
- Vaccines screen shows "Download Certificate" but no action.
- Medical records have no file attachment support.
- Upload API supports images only by folder, not generic documents/PDFs.

Next step:
- Add document URL fields for vaccines/records.
- Support document uploads or generated certificates.
- Remove inactive download CTA until implemented.

### 23. Vet reviews are modeled but not exposed

Status: Missing feature

Existing backend:
- `VetReview` model and associations exist.

Missing:
- No review routes.
- No mobile review submission/listing UI.
- Vet profile "My Reviews" is not wired.
- Vet rating is stored but not recalculated from reviews.

Next step:
- Add reviews endpoints and UI.
- Update vet rating from reviews.
- Add admin visibility/moderation if needed.

## Priority 3 - Backend/API Completeness

### 24. Public `GET /api/auth/users/:role` exposes user data

Status: Security concern

File:
- `backend/routes/authRoutes.ts`

Issue:
- `router.get("/users/:role", getUsersByRole)` is not protected.
- Mobile uses it for shelters.
- It can expose names/emails/profile fields without auth.

Next step:
- Add `protect` middleware.
- Return limited public profile fields only.

### 25. Uploads require S3 env but do not validate it

Status: Production readiness gap

Files:
- `backend/services/s3Service.ts`
- `backend/controllers/uploadController.ts`

Issue:
- S3 client assumes AWS env vars exist.
- App startup does not validate missing S3 config.
- Upload failures occur at runtime.

Next step:
- Validate AWS env vars at startup or upload route initialization.
- Consider local/dev upload fallback if needed.

### 26. Notifications and reminders are not scheduled

Status: Missing infrastructure

Existing:
- Reminders are stored.
- Notification polling checks only chats.

Missing:
- Background jobs.
- Push notification delivery.
- Reminder due calculation.
- User notification preferences.

Next step:
- Add scheduler or cron worker.
- Add notification records and push provider when outside Expo Go constraints.

### 27. Socket.IO server is initialized but not used

Status: Unused infrastructure

File:
- `backend/app.ts`

Issue:
- Socket.IO server exists, but chat APIs are REST-only and no socket event handlers are registered.

Next step:
- Either implement real-time chat/event notifications or remove Socket.IO until needed.

### 28. Missing pagination and filtering on large lists

Status: Scalability gap

Endpoints affected:
- `GET /api/community/feed`
- `GET /api/pets/discover`
- `GET /api/appointments/vets`
- `GET /api/admin/users`
- `GET /api/admin/vets`
- `GET /api/admin/pets`
- `GET /api/admin/posts`
- `GET /api/admin/events`

Next step:
- Add pagination, search, and filters server-side before production scale.

## Priority 4 - Mobile UX And Smaller Integration Gaps

### 29. Home community spotlight is static

Status: Static UI

File:
- `mobile-expo/app/(tabs)/index.tsx`

Issue:
- "Luna found her forever home" card is hardcoded.

Next step:
- Use latest approved post or a featured post endpoint.

### 30. Home greeting is static

Status: UX polish

Files:
- `mobile-expo/app/(tabs)/index.tsx`
- `mobile-expo/app/(vet-tabs)/dashboard.tsx`

Issue:
- Always says "Good morning".

Next step:
- Calculate time-of-day greeting locally.

### 31. Discover modal has decorative actions

Status: Partial

File:
- `mobile-expo/app/(tabs)/discover.tsx`

Issues:
- Vet modal "Contact" button has no action.
- Shelter modal "Visit Website" has no action or website field.

Next step:
- Wire contact to call/chat/email where data exists.
- Add shelter website field or remove CTA.

### 32. Admin global search and bell are decorative

Status: Static UI

Files:
- `admin-panel/src/components/AdminHeader.tsx`

Issues:
- Header search input does not search globally.
- Bell icon and red dot are static.

Next step:
- Implement or remove until notifications/audit events exist.

### 33. Admin user stats misclassify veterinarians

Status: Data display issue

File:
- `admin-panel/src/app/users/page.tsx`

Issue:
- Users page fetches only `/admin/users`, which returns the `users` table.
- Vets are stored in a separate `vets` table.
- The "Veterinarians" user stat filters `users` for role `veterinarian`, which will usually be zero.

Next step:
- Either remove veterinarian stat from users page or combine users and vets in a dedicated account overview.

### 34. Admin vets page reads old/mobile field names

Status: Data display issue

File:
- `admin-panel/src/app/vets/page.tsx`

Issue:
- Vet model uses `hospital_name`, `profession`, and `avatar_url`.
- Admin vets page reads `clinic_name`, `specialty`, and `avatar`.

Next step:
- Normalize fields in admin client or update page to use backend field names.

### 35. Admin community page reads image and author fields inconsistently

Status: Data display issue

Files:
- `admin-panel/src/app/community/page.tsx`
- `backend/controllers/adminController.ts`

Issues:
- Mobile creates post image field as `imageUrl`.
- Admin page displays `post.image_url`.
- Admin backend includes only `User` author relation.

Next step:
- Standardize to `imageUrl`.
- Resolve vet/user authors consistently.

## Suggested Implementation Order

1. Fix admin TypeScript build errors.
2. Standardize event fields and remove GET-time demo event seeding.
3. Decide community moderation policy and align mobile/admin/backend.
4. Add owner/shelter/veterinarian toggles to signup and login.
5. Add owner appointments screen.
6. Add reminder create/edit/delete UI and service methods.
7. Add real notifications model/API or remove static notification claims from MVP.
8. Add formal adoption/foster applications.
9. Add saved vets backend and mobile wiring.
10. Add my posts endpoint and profile screen wiring.
11. Harden auth/security/env behavior before production.

## Quick "Mock Data To Remove Or Gate" List

- `mobile-expo/app/login.tsx`: quick demo login buttons.
- `backend/scripts/seedDemoAccounts.ts`: demo accounts should remain dev-only.
- `backend/controllers/communityController.ts`: `seedEventsIfNeeded` creates demo events from user-facing GETs.
- `mobile-expo/app/notifications/index.tsx`: hardcoded notifications.
- `mobile-expo/app/profile/vets.tsx`: hardcoded saved vets.
- `mobile-expo/app/profile/posts.tsx`: hardcoded my posts.
- `mobile-expo/app/profile/settings.tsx`: hardcoded app version and storage.
- `mobile-expo/app/profile/security.tsx`: local-only toggles.
- `admin-panel/src/app/settings/page.tsx`: hardcoded settings and recent logs.
- `admin-panel/src/app/page.tsx`: "Growth Activity" chart placeholder.

## Screens Or Flows To Add

- Owner appointments list/history.
- Appointment detail screen.
- Add/edit reminder screen.
- Forgot password screen.
- Reset password screen.
- Adoption/foster application form.
- Owner/shelter application inbox.
- Admin adoption/foster application review.
- Saved vets list wired to backend.
- My posts list wired to backend.
- Real notifications list.
- Vet reviews list/submission flow.
- Vet verification pending screen.
- Admin audit logs/settings, if these are real MVP features.
