# PawsHub Current Bugs Research And Fix Plan

Audit date: 2026-04-12

Scope reviewed:
- `mobile-expo/`
- `backend/`

This file documents the current bug list from product testing and a static code review. It does not change application behavior yet. The goal is to make each bug clear enough that implementation can happen in the next pass without re-discovering the same issues.

## Summary

The main pattern across these bugs is that the backend has many of the raw records already, but the app does not consistently connect status changes, notifications, real-time updates, role permissions, and downloadable clinical documents.

Highest priority fixes:
- Appointment status changes must update or hide appointment reminders.
- Chat and appointment notifications need recipient-side notification records and immediate UI updates.
- Chat needs a real-time transport or a short-term polling fallback.
- Add/edit screens must refresh previous screens after save.
- Pet profile health actions need role-specific UI: vets upload clinical data, owners view and download it.
- Medication add/log flow is currently incomplete.

## Bug 1 - Declined Vet Appointments Still Appear In Owner Reminders

### User symptom

When a vet declines an appointment, the owner still sees that appointment in reminders. The reminder status is not updated.

### Current behavior found in code

Files:
- `backend/controllers/appointmentController.ts`
- `backend/controllers/reminderController.ts`
- `backend/models/Appointment.ts`
- `backend/models/Reminder.ts`
- `mobile-expo/app/reminders/index.tsx`
- `mobile-expo/app/(tabs)/index.tsx`

Appointment booking creates two separate records:
- An `appointments` row with `status: "pending"`.
- A `reminders` row with `type: "appointment"` and `isDone: false`.

Appointment status updates only modify the appointment. The reminder is never linked back to the appointment and is never marked cancelled, completed, hidden, or done.

The `Reminder` model also has no `appointmentId` or `status` field, so there is no durable way to know which reminder belongs to which appointment once the status changes.

The mobile reminders and home screens show reminders based on `isDone`; they do not know whether the original appointment was declined or cancelled.

### Expected behavior

When a vet declines or cancels an appointment:
- The appointment status must update to `cancelled` or a separate `declined` status if the product wants that wording.
- The linked appointment reminder must no longer appear as an upcoming reminder.
- The owner should see the status update in notifications and appointment history.
- Home reminder counts should update without a manual refresh.

### Recommended fix

Best fix:
- Add `appointmentId` to `Reminder`.
- Add a reminder status such as `active`, `cancelled`, `completed`, or derive status directly from `Appointment`.
- When creating an appointment reminder, save `appointmentId`.
- In `updateAppointmentStatus`, update the linked reminder when appointment status becomes `cancelled`, `completed`, or `declined`.

Minimum patch:
- In `updateAppointmentStatus`, find reminders by `userId`, `petId`, `type: "appointment"`, `date`, and `time`, then mark them `isDone: true` or delete them when the appointment is cancelled.
- This is weaker because date/time/title matching can break if two appointments are close together.

### Acceptance criteria

- Book an appointment and confirm the owner sees an appointment reminder.
- Vet declines/cancels the appointment.
- Owner no longer sees that reminder in upcoming reminders or home reminders.
- Owner can still see the cancelled appointment in appointment history.
- Owner receives a notification that the appointment was declined/cancelled.

## Bug 2 - Vaccine And Vital Presets Prefill Data; Vaccine Names Need A Persistent Dropdown

### User symptom

On add vaccine and add vital screens, tapping a preset fills in values automatically. This should be removed. Users should manually enter the data. For vaccines, the vaccine name should be an input dropdown. New vaccine names should be saved and suggested forever for all users next time.

### Current behavior found in code

Files:
- `mobile-expo/app/health/add-vaccine.tsx`
- `mobile-expo/app/health/add-vital.tsx`
- `mobile-expo/services/users/healthApi.ts`
- `backend/controllers/healthController.ts`
- `backend/models/Vaccine.ts`
- `backend/models/Vital.ts`

`add-vaccine.tsx` has hard-coded `vaccinePresets`:
- Rabies
- DHPP Booster
- Bordetella

Tapping a preset fills:
- `name`
- `status`
- `nextDueDate`

`add-vital.tsx` has hard-coded `vitalPresets`:
- Weight: `28 kg`
- Heart Rate: `92 bpm`
- Temperature: `101.2 F`

Tapping a vital preset fills clinical values. This is risky because it can create inaccurate health records.

There is no backend vaccine type table, no vaccine type lookup endpoint, and no service method for persistent vaccine name suggestions.

### Expected behavior

Vaccine screen:
- Remove hard-coded chips that prefill status and due dates.
- Replace vaccine name with a searchable input dropdown.
- User can type a new vaccine name manually.
- When a vaccine is saved, its name is stored as a reusable vaccine type.
- Next time any user starts typing the same vaccine, it appears in the dropdown.
- Selecting a vaccine name should only fill the name, not clinical dates/status.

Vital screen:
- Remove preset chips that fill actual measurements.
- Let users manually enter type, value, and unit.
- If suggestions are kept later, they should only suggest type/unit labels, not patient-specific values.

### Recommended fix

Backend:
- Add a `vaccine_types` table or model with fields:
  - `id`
  - `name`
  - `normalizedName`
  - `createdBy`
  - `createdByType`
  - timestamps
- Add `GET /api/health/vaccine-types?query=...`.
- Add `POST /api/health/vaccine-types` or auto-upsert vaccine names inside `addVaccine`.
- Enforce case-insensitive uniqueness on vaccine names.

Mobile:
- Add `userHealthApi.listVaccineTypes`.
- Replace vaccine preset chips with a searchable dropdown/input.
- On save, send the vaccine name as entered and let the backend upsert the type.
- Keep date/status fields manual.

### Acceptance criteria

- Tapping a vaccine suggestion only sets the vaccine name.
- No due date or status is auto-filled from a preset.
- Typing and saving a new vaccine name makes it available in suggestions for future users.
- Add vital does not fill fake values from preset chips.

## Bug 3 - Notifications Are Not Working Reliably For Chat And Vet Appointment Booking

### User symptom

Notifications are not working for chat. Vets also do not reliably get notified when an owner books an appointment.

### Current behavior found in code

Files:
- `backend/controllers/communityController.ts`
- `backend/controllers/appointmentController.ts`
- `backend/services/notificationService.ts`
- `backend/controllers/notificationController.ts`
- `mobile-expo/contexts/NotificationContext.tsx`
- `mobile-expo/app/_layout.tsx`
- `mobile-expo/app/(vet-tabs)/dashboard.tsx`
- `mobile-expo/app/(vet-tabs)/appointments.tsx`

Chat:
- `sendMessage` creates a `messages` row.
- `startChat` can create an initial message.
- Neither function creates a notification for the recipient.
- There is no push notification integration.
- There is no WebSocket, SSE, or real-time subscription.

Appointment booking:
- `createAppointment` does create a notification record for the vet with `userType: "vet"`.
- The vet UI depends on polling in `NotificationContext`, which runs every 30 seconds.
- Vet dashboard and vet appointments screens fetch on mount only, not on focus or real-time events.
- A vet may not see the new appointment or badge immediately unless they wait for polling or refresh manually.

### Expected behavior

Chat:
- When a user sends a chat message, the other participant gets an unread chat notification.
- Notification count updates immediately or near-immediately.
- If the recipient is inside the chat list or chat thread, the UI updates without refresh.

Appointment booking:
- When an owner books an appointment, the vet receives a notification immediately.
- Vet dashboard pending count updates.
- Vet appointments list shows the new pending request without manual refresh.

### Recommended fix

Backend:
- In `sendMessage`, identify the recipient and call `createNotification` with:
  - `userId` = recipient participant id
  - `userType` = recipient participant type
  - `type` = `chat_message`
  - `relatedId` = conversation id
  - `relatedType` = `chat`
- In `startChat`, create a notification when the first message is sent.
- Keep appointment notification creation, but verify vet tokens have `userType: "vet"` and notification queries filter by the same type.

Mobile:
- Add immediate notification refresh after booking and after receiving socket/poll events.
- Add badges for vet appointments or dashboard pending count.
- Avoid relying only on a 30-second global poll.

### Acceptance criteria

- Send a chat message from owner to vet; vet receives unread count and notification.
- Send a chat message from vet to owner; owner receives unread count and notification.
- Book an appointment; vet notification count increments and pending appointment appears.
- Mark notifications read clears the badge for the correct account type.

## Bug 4 - Chat Messages Are Not Real-Time

### User symptom

Chat messages are not real time.

### Current behavior found in code

Files:
- `mobile-expo/app/community/chat/[id].tsx`
- `mobile-expo/services/users/communityApi.ts`
- `backend/controllers/communityController.ts`
- `backend/models/Conversation.ts`
- `backend/models/Message.ts`

The chat screen calls `getChatById` once on mount. When the current user sends a message, the screen updates from the POST response.

The other participant's messages do not appear until the screen is refreshed or reopened. The backend is plain REST and does not expose WebSocket/SSE events.

`NotificationContext` polls chat lists every 30 seconds, but that only affects badge counts. It does not refresh the active chat thread.

### Expected behavior

- Messages appear on both sender and recipient screens without manual refresh.
- The active chat thread updates while open.
- The chat list updates its last message and unread state quickly.

### Recommended fix

Best fix:
- Add Socket.IO or WebSocket support to the backend.
- Join a room per conversation id.
- Emit `message.created` when `sendMessage` succeeds.
- Mobile chat screen subscribes while mounted and appends messages.
- Chat list subscribes or refreshes when a message event arrives.

Short-term patch:
- Poll the active chat thread every 2 to 5 seconds while the screen is focused.
- Stop polling when the screen blurs or app backgrounds.
- Keep this as a temporary fallback only.

### Acceptance criteria

- User A and user B open the same chat.
- User A sends a message.
- User B sees the message without navigating away or pulling to refresh.
- Chat list last message and unread badge update without app restart.

## Bug 5 - New Data Does Not Appear Instantly After Add/Update Actions

### User symptom

When adding a pet, vaccine, vital, and other records, the app often requires a manual refresh before the new item appears.

### Current behavior found in code

Files:
- `mobile-expo/app/(tabs)/index.tsx`
- `mobile-expo/app/(tabs)/pets.tsx`
- `mobile-expo/app/pets/[id].tsx`
- `mobile-expo/app/health/vaccines.tsx`
- `mobile-expo/app/health/vitals.tsx`
- `mobile-expo/app/health/meds.tsx`
- `mobile-expo/app/health/records.tsx`
- `mobile-expo/app/health/add-vaccine.tsx`
- `mobile-expo/app/health/add-vital.tsx`
- `mobile-expo/app/health/add-med.tsx`
- `mobile-expo/app/health/add-record.tsx`

Many list/detail screens fetch with `useEffect` only on mount. Add screens save data and call `router.back()`.

In Expo Router, the previous screen often stays mounted in the navigation stack. Because the list screen does not refetch on focus, it keeps stale state until the user refreshes manually or remounts the screen.

Some screens already use `useFocusEffect`, but the pattern is not applied consistently across pets, home, pet details, vaccines, vitals, meds, and records.

### Expected behavior

After saving:
- Add pet immediately updates home and My Pets.
- Add vaccine immediately updates vaccine list, pet profile, and home counts where relevant.
- Add vital immediately updates vital overview/history.
- Add medication immediately updates meds list and pet profile.
- Add record/allergy immediately updates records and pet profile.
- Appointment status changes update lists and reminders immediately.

### Recommended fix

Mobile:
- Add `useFocusEffect` refetching to screens that show mutable data.
- Add an app-level cache or event invalidation helper for pets, health, reminders, appointments, and notifications.
- After mutation, either pass the created object back into local state or invalidate the relevant query/screen.

Backend:
- Return complete normalized records after creation where possible, including any related fields needed by the UI.

### Acceptance criteria

- Add a pet, return to My Pets, and see it immediately.
- Add a vaccine, return to vaccine list, and see it immediately.
- Add a vital, return to vitals, and see updated overview/history immediately.
- Add a medication, return to meds, and see it immediately.
- Cancel/decline appointment and see reminders update without manual refresh.

## Bug 6 - Vet Pet Profile Permissions Need Role-Specific UI

### User symptom

A vet can see the pet profile, which is good. But some owner-only controls should be hidden for vets, such as profile edit and adoption/foster toggles. Vets should be able to upload vaccines, meds, records, and related clinical data. Owners should be able to download those documents.

### Current behavior found in code

Files:
- `backend/controllers/petController.ts`
- `backend/controllers/healthController.ts`
- `mobile-expo/app/pets/[id].tsx`
- `mobile-expo/app/health/vaccines.tsx`
- `mobile-expo/app/health/meds.tsx`
- `mobile-expo/app/health/records.tsx`

Backend:
- `canViewPrivatePet` allows a vet to view a pet if the vet has an appointment for that pet.
- `canAccessPet` in health controller also allows a vet with an appointment to add health data.
- This means backend health writes are already possible for vets in principle.

Mobile:
- Pet profile computes `canManagePet` for owners only.
- Edit button is hidden behind `canManagePet`, so it should already be hidden for vets. This should still be QA-verified.
- Adoption/foster controls are still rendered for non-owners and vets, but disabled. User request is to hide them for vets.
- Quick actions for Vaccines, Meds, Vitals, and Records are also hidden behind `canManagePet`. That means vets cannot reach the health upload flows from pet profile, even though backend permits vet health writes.
- Owners can currently open add vaccine/vital/record flows. This conflicts with the desired "vet uploads, owner downloads" model.

### Expected behavior

Vet view:
- Can view pet profile.
- Cannot edit pet identity/profile fields.
- Cannot see adoption/foster owner controls.
- Can access clinical upload actions:
  - Add vaccine
  - Add medication
  - Add vital
  - Add medical record
  - Upload report/certificate attachments

Owner view:
- Can edit pet profile and adoption/foster listing.
- Can view clinical records.
- Can download reports/certificates.
- Should not be able to overwrite vet-issued clinical records unless the product keeps a separate owner-entered health log.

### Recommended fix

Mobile:
- Split permissions into explicit booleans:
  - `canEditPetProfile`
  - `canManageListing`
  - `canAddClinicalRecord`
  - `canDownloadClinicalRecord`
- Hide adoption/foster controls unless `canManageListing`.
- Show health upload actions when `canAddClinicalRecord`, including for vets.
- Show download buttons when `canDownloadClinicalRecord`, especially for owners.

Backend:
- Add created-by fields to clinical records:
  - `createdById`
  - `createdByType`
  - `vetId` where applicable
- Enforce owner/vet permissions on create, update, delete, and download endpoints.
- Consider separating owner-entered observations from vet-issued records.

### Acceptance criteria

- Vet opens a patient pet profile and sees no edit button.
- Vet sees no adoption/foster toggles.
- Vet can add vaccine, medication, vital, and medical record.
- Owner can view and download vet-uploaded records.
- Owner cannot modify a vet-issued signed report.

## Bug 7 - Default Vet Report Template With Clinic Name And Stamp Is Missing

### User symptom

The app needs a common default report template with clinic name and stamp picture, uploaded by vet. Vet uploads clinical data; owner downloads the report.

### Current behavior found in code

Files:
- `backend/models/Vet.ts`
- `backend/models/MedicalRecord.ts`
- `backend/models/Vaccine.ts`
- `backend/controllers/uploadController.ts`
- `mobile-expo/services/uploadApi.ts`
- `mobile-expo/app/(vet-tabs)/profile.tsx`
- `mobile-expo/app/health/vaccines.tsx`
- `mobile-expo/app/health/records.tsx`

Current gaps:
- `Vet` has clinic fields such as `hospital_name`, `profession`, `working_hours`, and `avatar_url`.
- `Vet` does not have a stamp/seal image field.
- Upload folders only allow `profiles`, `pets`, `posts`, and `events`.
- There is no `stamps`, `reports`, or `certificates` upload folder.
- Medical records and vaccines do not store `vetId`, `clinicName`, `stampUrl`, `reportUrl`, `certificateUrl`, or attachment metadata.
- The vaccine screen has a "Download Certificate" button, but it has no download handler.
- The records screen displays records but has no downloadable report action.

### Expected behavior

Vet setup:
- Vet can upload a clinic stamp/seal image.
- Vet profile stores clinic name, address, phone, license details, and stamp URL.

Report generation:
- When a vet creates a vaccine, medication, vital summary, or medical record, the app can generate a default report/certificate.
- The report includes:
  - Clinic name
  - Clinic address/contact
  - Vet name and license/profession
  - Pet name/species/breed
  - Owner name
  - Record details
  - Date
  - Vet stamp image
  - Optional signature/stamp placement

Owner download:
- Owner can download/view PDF reports or certificates.
- The same record remains visible in the health timeline.

### Recommended fix

Backend:
- Add vet fields:
  - `clinicStampUrl`
  - `licenseNumber` if not already stored elsewhere
  - optional `signatureUrl`
- Add upload folders:
  - `stamps`
  - `reports`
  - `certificates`
- Add report metadata fields to clinical models or a separate `clinical_reports` table:
  - `id`
  - `petId`
  - `ownerId`
  - `vetId`
  - `recordType`
  - `recordId`
  - `reportUrl`
  - timestamps
- Add a report generation service that creates a PDF from the default template.

Mobile:
- Add stamp upload to vet profile edit.
- Add report/certificate download buttons for owners.
- Add "Generate report" or auto-generate behavior after vet saves a clinical record.

### Acceptance criteria

- Vet uploads a stamp image once in profile settings.
- Vet adds a vaccine or medical record for a patient.
- System generates a report using the default template and vet stamp.
- Owner opens the pet health section and downloads the report.

## Bug 8 - Remove Notification Button From User Home Page

### User symptom

Remove the notification button from the user home page.

### Current behavior found in code

Files:
- `mobile-expo/app/_layout.tsx`
- `mobile-expo/app/(tabs)/index.tsx`

There are two notification entry points:
- Global logged-in header in `_layout.tsx`.
- A second bell button inside the user home greeting in `(tabs)/index.tsx`.

The user request is specifically to remove the notification button from the user home page. Since the global header already has a notification button, the home-specific button is redundant.

### Expected behavior

- User home page does not render a separate notification bell in the greeting section.
- Notification access remains available from the global header and/or profile menu.
- Removing the home bell should not break notification polling or unread counts.

### Recommended fix

Mobile:
- Remove `Bell` import from `mobile-expo/app/(tabs)/index.tsx` if no longer used there.
- Remove `useNotifications` usage from HomeScreen if only used for the bell.
- Remove the home greeting `Pressable` that routes to `/notifications`.
- Keep the global header notification button in `mobile-expo/app/_layout.tsx`.

### Acceptance criteria

- User home page shows no local notification bell.
- Global header notification bell still works.
- TypeScript passes after removing unused imports.

## Bug 9 - Medications Flow Is Not Working

### User symptom

Meds is not working.

### Current behavior found in code

Files:
- `mobile-expo/app/health/meds.tsx`
- `mobile-expo/app/health/add-med.tsx`
- `mobile-expo/app/_layout.tsx`
- `mobile-expo/services/users/healthApi.ts`
- `backend/controllers/healthController.ts`
- `backend/models/Medication.ts`

Backend and service methods exist:
- `GET /api/health/meds/:petId`
- `POST /api/health/meds/:petId`
- `userHealthApi.listMedications`
- `userHealthApi.addMedication`

Mobile gaps:
- `add-med.tsx` exists, but the meds list floating plus button has a TODO and does not navigate anywhere.
- `_layout.tsx` declares `health/meds` but does not declare `health/add-med`.
- The meds list "Log Dose" button has no handler.
- There is no edit/delete medication flow.
- There is no dose history model or endpoint.
- Empty state says "No weight medication found", which looks like copy/paste text.
- Dates can render poorly if `startDate` or `endDate` is missing.

### Expected behavior

- From meds list, plus button opens Add Medication.
- Saving medication returns to meds list and shows the new medication immediately.
- If "Log Dose" is shown, it should record a dose. If dose logging is not implemented yet, hide the button.
- Medications should support owner/vet permissions according to the final clinical workflow.
- Empty state copy should say "No medications found".

### Recommended fix

Mobile:
- Make meds plus button route to `/health/add-med?petId=...`.
- Add `Stack.Screen name="health/add-med"` or confirm Expo Router auto-registration and still configure it consistently.
- Add focus refresh to meds list.
- Hide or implement "Log Dose".
- Fix empty state copy.

Backend:
- If dose logging is required, add `medication_doses` model and routes.
- If dose logging is out of scope, remove the UI control until the model exists.

### Acceptance criteria

- Tap Meds from pet profile.
- Tap plus.
- Add a medication.
- Return to meds list and see the medication immediately.
- "Log Dose" either works or is not visible.

## Cross-Cutting Implementation Order

Recommended order:

1. Fix mobile refresh behavior with `useFocusEffect` and/or mutation invalidation for pets, health, appointments, reminders, and home.
2. Fix meds navigation and remove the home notification button because these are small, isolated mobile fixes.
3. Link appointment reminders to appointment status.
4. Add chat notifications and short-term active-chat polling.
5. Add true real-time chat/notification infrastructure.
6. Add vaccine type persistence and replace hard-coded presets.
7. Add role-specific pet profile actions for owner versus vet.
8. Add vet stamp upload and default report/certificate generation.

## QA Checklist

- Owner books appointment; vet receives a notification and sees pending request.
- Vet declines appointment; owner reminder disappears from upcoming reminders.
- Owner receives cancellation notification.
- Owner and vet exchange chat messages and both see them without refresh.
- Add pet appears on Home and My Pets immediately after returning.
- Add vaccine appears in vaccine list and pet profile immediately.
- Add vital appears in vital overview immediately.
- Add med flow can be opened and saved.
- Vet patient profile hides owner controls and shows clinical upload controls.
- Owner health screens show download actions for vet-issued records.
- Home screen has no duplicate notification bell.
