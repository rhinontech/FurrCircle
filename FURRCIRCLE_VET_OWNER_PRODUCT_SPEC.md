# FurrCircle: Pet Owner and Vet Product Specification

## 1. Product Direction

FurrCircle is a pet care, veterinary management, and trusted local community app.

The primary reason to open the app is to care for a pet: manage health records, stay on top of daily care, find and consult a vet, and get help from a local pet community. Social features such as posts, stories, and reels remain available, but they support pet care and community rather than acting as the core product.

### Product promise

> Everything for your pet's care, trusted vets, and local pet people.

### Account types

| Account type | Primary job in the app |
| --- | --- |
| Pet owner | Manage pets, book and attend care, store records, and participate in communities. |
| Vet / clinic | Manage availability and appointments, consult with patients, publish trusted advice, and manage follow-ups. |
| Shelter / rescue | Manage adoptable pets, adoption requests, rescue alerts, and local community activity. |
| Admin | Verify professional accounts, moderate content, manage disputes, and support safety. |

## 2. Information Architecture

The primary mobile navigation should be the same for both roles where possible, while each role receives a different home dashboard.

| Tab | Pet owner | Vet / clinic |
| --- | --- | --- |
| Today | Daily pet-care dashboard. | Daily practice dashboard. |
| Care | Pet records, medications, vaccines, symptoms, passport. | Patient records shared with consent, care plans, prescriptions. |
| Community | Circles, questions, local help, lost pets, posts. | Verified answers, clinic education, local professional presence. |
| Vet | Find, book, consult, and message vets. | Appointments, availability, consultation queue, clinic profile. |
| Profile | Owner and pet identities, saved items, settings. | Professional profile, clinic details, verification, settings. |

### Items not in primary navigation

- Playdates move into `Community > Local`.
- Adoption and foster discovery move into `Community > Rescue`.
- Posts, stories, and reels live within Community and profiles.
- A generic feed is replaced by the Today dashboard.

## 3. Shared Foundations

### 3.1 Onboarding and authentication

The first onboarding screen must ask: `I am a Pet Owner`, `I am a Vet / Clinic`, or `I am a Shelter / Rescue`.

Every account collects email/phone verification, password or social login, location permission, notification permission, and agreement to the applicable terms. Do not silently register every account as an owner.

### 3.2 Role switching

A single person can have both an owner and a professional identity. For example, a vet may also own pets. The account menu should allow switching workspaces without requiring a second login.

### 3.3 Pet identity

Every pet has a profile containing:

- Name, species, breed, sex, date of birth or age, weight, photo, and microchip ID.
- Allergies, conditions, current medications, vaccination status, and emergency contact.
- Owner or co-owner relationships.
- A private care timeline.
- Optional public social profile, separate from medical data.

Medical information is private by default. Public pet profiles must never expose records, medications, owner contact details, or live location.

### 3.4 Notifications

Support push, in-app, and optional email/SMS notifications for:

- Appointment requested, accepted, rescheduled, cancelled, and due soon.
- Consultation waiting room and consultation start.
- New prescription, care plan, message, or record shared.
- Medication, vaccination, grooming, and follow-up reminders.
- Community answers, vet-verified responses, lost-pet alerts, and moderation actions.

Notification settings must be granular. Owners should be able to mute social activity while keeping care and appointment alerts enabled.

## 4. Pet Owner Interface

## 4.1 Owner onboarding

### Screen: Account type

- Choose `Pet Owner`.
- Explain that pet records, appointments, and communities are available immediately.

### Screen: Owner profile

- Full name, profile photo, city/locality, phone number, and preferred notification channels.
- Emergency contact.
- Optional interests such as first-time owner, rescue parent, breed communities, or training.

### Screen: Add first pet

- Pet photo and name.
- Species and breed.
- Age/date of birth, sex, weight, and sterilization status.
- Existing vet/clinic, if known.
- Existing allergies, conditions, medications, and vaccine history.
- Allow record upload now or later.

### Screen: Home setup

- Request notification permission with a clear explanation: medicine, vaccines, appointments, and follow-ups.
- Let the owner follow relevant local circles and select emergency location access.

## 4.2 Today dashboard

The owner home screen replaces an entertainment feed. It should make the next best care action immediately obvious.

### Layout

1. Pet switcher for multi-pet households.
2. Health status summary: `All caught up`, `Medication due`, `Vaccination due`, or `Follow-up needed`.
3. Today's checklist: medication, meal/log, activity, grooming, appointment, or record task.
4. Next appointment card with doctor, clinic, type, date/time, and `Join` when active.
5. Quick actions: `Book a vet`, `Log medicine`, `Upload record`, `Ask community`.
6. Recent care updates: prescription, consultation note, shared record, or symptom log.
7. One relevant community or verified-vet card. This is a small useful discovery surface, not infinite scrolling.

### Empty state

For a new owner, show `Add your pet's first vaccination`, `Find a trusted vet nearby`, and `Join your local community`.

## 4.3 Care interface

### Screen: Care overview

Display the selected pet's health summary with these sections:

- Upcoming: appointments, medications, vaccines, reminders.
- Health timeline: vet visits, uploaded records, symptoms, prescriptions, and key milestones.
- Active conditions and allergies.
- Quick add: record, medicine, vaccine, symptom, weight, note.

### Screen: Medical records

- Upload PDF, image, or camera scan.
- Categorize record: consultation note, lab report, prescription, vaccination, surgery, imaging, insurance, or other.
- Enter record date, clinic/vet, tags, and optional note.
- Search, filter, preview, download, and delete owner-uploaded records.
- Choose exactly which record categories or individual records can be shared with a vet.

### Screen: Medications and reminders

- Add medicine name, dosage, frequency, start/end date, instructions, and prescribed-by vet.
- Set reminder times and refill reminders.
- Mark a dose completed, skipped, or delayed with an optional note.
- Show adherence history to the owner; share it with a vet only with consent.

### Screen: Vaccines

- Record vaccine type, date, clinic, batch number when available, and certificate.
- Calculate next due date from the vet-defined schedule or owner input.
- Send reminder notifications before due date.
- Show overdue status prominently but without panic language.

### Screen: Symptoms and vitals

- Owner can log symptoms, photos/video, appetite, water intake, stool, activity, temperature, and weight.
- Each entry has date/time and severity.
- Include an `Is this urgent?` checklist that directs emergencies to local emergency care; it must not diagnose.

### Screen: Pet passport

- Export a read-only shareable summary for travel, boarding, or a new vet.
- Include pet identity, emergency contact, allergies, conditions, vaccine status, medication list, and selected records.
- Require owner confirmation before sharing or exporting.

## 4.4 Vet discovery and booking

### Screen: Find a vet

- Search by vet, clinic, speciality, city, or landmark.
- Filter by distance, open now, consultation type, speciality, species treated, verified status, language, and availability.
- Offer `Emergency care nearby` separately from routine discovery.
- Clearly mark FurrCircle verified clinicians and clinics.

### Screen: Vet / clinic profile

- Verified name, profile image, speciality, qualifications, clinic name, years of experience, languages, and service area.
- Services: routine visit, vaccination, dermatology, surgery, nutrition, behavior, emergency, voice, video, in-clinic.
- Availability, consultation duration, fee, clinic address, map, and contact policy.
- Reviews from completed appointments only.
- `Book consultation`, `Follow clinic`, and `Save` actions.
- Educational posts and verified community answers, separated from clinical service details.

### Screen: Book consultation

1. Select pet.
2. Select appointment type: `In-clinic`, `Voice call`, or `Video call`.
3. Select reason: routine check-up, symptoms, follow-up, vaccination, prescription, behavior, nutrition, or other.
4. Attach photos/videos and select records to share.
5. Select an available slot or request an instant consultation.
6. Review fee, cancellation policy, privacy consent, and emergency disclaimer.
7. Confirm booking and payment where enabled.

### Appointment states

`Requested` -> `Accepted` -> `Scheduled` -> `Ready to join` -> `In consultation` -> `Completed`

Alternative paths: `Declined`, `Reschedule proposed`, `Cancelled by owner`, `Cancelled by vet`, `No show`, and `Refund pending`.

Every state change must create an in-app notification and be visible in the appointment history.

## 4.5 In-app voice and video consultations

Calls replace sharing personal WhatsApp numbers. Calls should only be available through an accepted appointment or an accepted instant-consult request.

### Owner consultation room

- Appointment identity: pet, vet, clinic, time, consultation type, and remaining time if applicable.
- `Join voice call` or `Join video call` becomes active shortly before the appointment.
- Pre-call checks for microphone, camera, and network.
- In-call controls: mute, speaker, camera toggle, switch camera, end call, and report technical issue.
- Side panel: owner-provided symptoms, photos/videos, selected medical records, and text chat.
- Do not show personal phone numbers.
- Display an emergency notice: virtual care may not be suitable for emergencies.

### After-call screen

- Consultation marked complete.
- Vet's summary, diagnosis only if the vet provides one, care plan, prescription, and follow-up date.
- Actions: `Add to care timeline`, `Set reminders`, `Book follow-up`, `Message clinic`, `Rate visit`.
- Feedback should only be requested after a completed appointment.

### Instant consultation

This is a controlled queue, not an unrestricted ability to call every vet.

1. Owner selects `Talk to an available vet`.
2. Owner selects pet, issue category, urgency level, and symptom media.
3. Only eligible vets currently marked available receive the request.
4. A vet accepts the request, and the owner receives the secure join action.
5. If no vet accepts, show nearby emergency clinics and allow the owner to schedule a normal appointment.

Define an explicit response target, consultation length, fee, cancellation/refund policy, and geographic/licensing eligibility before launch.

## 4.6 Owner-to-vet messages

- Messages are tied to a clinic, vet, and pet, not to a personal phone number.
- Owners can start a message thread from a booked or completed appointment.
- Clinics configure a follow-up window, for example seven days after a completed appointment.
- Owners can attach images, documents, and symptom updates.
- Urgent-message language should redirect to emergency care rather than promise a response.
- Vets can use saved replies and mark threads resolved.

## 5. Vet and Clinic Interface

## 5.1 Professional onboarding and verification

### Screen: Account type

- Choose `Vet / Clinic`.
- Select whether the account represents an individual vet, a clinic, or both.

### Screen: Professional profile

- Legal name, public display name, professional registration/license number, speciality, qualifications, years of experience, languages, and species treated.
- Government/professional documents for verification.
- Teleconsultation eligibility and service regions.

### Screen: Clinic setup

- Clinic name, address, map location, phone, operating hours, emergency availability, facilities, and staff members.
- Consultation types, duration, fees, cancellation policy, and payment configuration.
- Add other verified vets to the clinic team with role-based access.

### Verification states

`Draft`, `Documents submitted`, `Under review`, `Verified`, `Needs changes`, `Suspended`.

Unverified professionals can complete setup but cannot offer paid consultations, present themselves as verified, or access patient records.

## 5.2 Vet Today dashboard

The professional home screen should be operational, not social.

### Layout

1. Availability switch: `Available for instant consults` or `Unavailable`.
2. Today's agenda: upcoming in-clinic, voice, and video appointments.
3. Consultation queue: new instant requests and patients in the waiting room.
4. Booking requests requiring acceptance or rescheduling.
5. Follow-ups due today.
6. Unread patient messages.
7. Quick actions: `Open calendar`, `Create slot`, `Write care plan`, `Post verified answer`.

## 5.3 Appointment and calendar management

### Screen: Calendar

- Day, week, and list views.
- Separate labels for in-clinic, voice, video, instant consult, blocked, and personal time.
- Create repeating availability and one-off slots.
- Set appointment length, buffer time, maximum daily consultations, and appointment lead time.
- Block leave/holiday periods.

### Screen: Appointment request

- Pet identity and owner name.
- Reason for visit, selected symptoms, photos/videos, and owner-shared records.
- Requested type/time, fee/payment status, and prior appointment history.
- Actions: `Accept`, `Propose new time`, `Decline`, or `Request more information`.
- Declining must offer a short optional reason and emergency guidance where appropriate.

### Screen: Appointment detail

- Patient summary, owner-shared medical data, appointment notes, consent state, and attached media.
- Start/join consultation when the appointment is active.
- Reschedule, cancel, mark no-show, or complete.
- Create consultation note, prescription, and follow-up reminder after completion.

## 5.4 Vet consultation room

### In-call experience

- Secure voice/video connection with the owner.
- Access only to records the owner has shared for this clinic or appointment.
- Consultation timer, network status, and technical issue reporting.
- Text chat and file/image review without leaving the consultation.
- Notes panel that persists privately to the vet/clinic until published to the owner.

### Clinical actions after the call

- Write consultation summary.
- Add care instructions and medication recommendations.
- Generate prescription subject to local legal requirements.
- Recommend tests, in-clinic visit, or emergency care where appropriate.
- Request a follow-up date and create care reminders.
- Share selected note sections and documents with the owner.

The product must not auto-generate diagnoses or prescriptions. Any AI-assisted text in the future must be clearly editable and confirmed by the vet before it reaches an owner.

## 5.5 Patient and record access

### Screen: Patients

- List only pets with a current appointment, completed care relationship, or explicit owner sharing.
- Search by pet name, owner, phone only where permitted, or appointment ID.
- Show active conditions, allergies, current medication, last visit, and next appointment.

### Screen: Patient detail

- Identity, care timeline, appointment history, owner-shared records, notes, prescriptions, and follow-up tasks.
- Clear labels for `Owner shared`, `Clinic created`, and `Private professional note`.
- All record access is auditable.

### Access rules

- Owner grants access per appointment, per record, per category, or ongoing clinic relationship.
- Owner can revoke future access. Existing clinical records may need retention for legal/medical obligations; this must be explained in policy and implemented per jurisdiction.
- Vets cannot browse unrelated pet records.
- Clinic staff only see information necessary for their assigned role.

## 5.6 Vet community presence

Vets should build trust in Community without turning the app into influencer-first social media.

- Answer questions with a `Verified Vet` badge.
- Publish short educational posts, stories, and reels about pet care, prevention, clinic events, and awareness campaigns.
- Clearly distinguish general education from a personal consultation.
- Do not allow diagnosis, prescriptions, or sensitive medical details in public comments.
- Route owner-specific questions toward a booking or existing patient message thread.

## 6. Community and Social Features

Community remains a valuable trust and retention layer.

### Core community screens

- My circles: city, breed, rescue, first-time owners, senior pets, behavior, health conditions.
- Questions: ask, answer, save, report, and filter by local/health/adoption/general.
- Local: events, playdates, lost-and-found, rescue activity, and nearby help.
- Rescue: adoptable pets, foster needs, shelter profiles, and adoption requests.

### Social content rules

- Posts, stories, and reels are available from Community and profiles.
- Content should favor pet updates, care milestones, education, adoption stories, and local events.
- Keep a limited community highlights surface; do not make endless entertainment feed the default home.
- Give verified vet content a clear label, but do not imply it is a one-to-one diagnosis.
- Require reporting, blocking, moderation queues, and community rules before scaling public content.

## 7. Calling, Privacy, and Safety Requirements

## 7.1 Call policy

- Calls must use in-app voice/video infrastructure, not exposed personal WhatsApp or phone contacts.
- A call begins only from an accepted scheduled appointment or accepted instant-consult request.
- Both sides can end a call at any time.
- Recording is off by default. If recording is offered, obtain explicit consent from both participants and explain storage/retention.
- Do not rely on a call log as a clinical record. Store appointment state, timestamps, and the vet's consultation note separately.

## 7.2 Emergency policy

- Prominently state that the app does not replace emergency veterinary treatment.
- Provide a persistent `Emergency care nearby` action on relevant symptom, booking, and call screens.
- Do not promise that an instant-consult vet will be available.
- Do not use automated symptom handling to diagnose or triage beyond safe guidance and emergency direction.

## 7.3 Data and consent

- Encrypt data in transit and at rest.
- Separate public social profile data from private health data.
- Require explicit owner consent before each new vet/clinic receives medical records.
- Log access to private records: who, what, when, and under which consent.
- Allow owners to download their data and manage account deletion requests subject to required medical/legal retention.
- Implement country-specific privacy, telemedicine, prescription, payment, and professional licensing requirements before serving that country.

## 7.4 Abuse prevention

- Vet verification and periodic re-verification.
- Appointment-only direct messages and calls.
- Report/block functions for owners, vets, posts, and community replies.
- Rate limits for appointment requests, instant-consult requests, and media uploads.
- Admin queue for professional verification, harmful advice, harassment, impersonation, and payment disputes.

## 8. Core Data Model Additions

The existing user, vet, pet, record, community, message, and appointment data should be expanded with the following concepts.

| Entity | Key fields |
| --- | --- |
| ProfessionalProfile | user ID, vet/clinic type, verification status, license info, specialities, service regions, public profile. |
| Clinic | owner/admins, location, hours, services, team, emergency policy, fees, payment configuration. |
| AvailabilitySlot | vet/clinic, consultation type, start/end time, duration, capacity, status. |
| Appointment | owner, pet, vet/clinic, type, reason, status, slot, fee/payment state, consent, attachments. |
| Consultation | appointment, join/start/end timestamps, technical status, private notes, owner-visible summary. |
| RecordShareGrant | pet, owner, vet/clinic, record scope, start/end, revocation state, audit metadata. |
| Prescription | consultation, vet, pet, medication items, instructions, issue date, attachment/status. |
| CarePlan | pet, vet/clinic, tasks, reminders, follow-up date, owner visibility. |
| PatientMessageThread | appointment/care relationship, owner, clinic/vet, follow-up deadline, resolution state. |
| AuditLog | actor, resource, action, time, consent/context, IP/device metadata where appropriate. |

## 9. API and Integration Requirements

### Required backend capabilities

- Role-aware registration, login, profile management, and workspace switching.
- Vet verification submission and admin approval workflow.
- Clinic/team management and permission roles.
- Vet search with location, speciality, service, and availability filters.
- Slot management and appointment lifecycle endpoints.
- Secure appointment attachments and owner record-sharing consent.
- Real-time appointment status and waiting-room events.
- In-app voice/video provider token generation that is authorized per appointment.
- Consultation notes, prescriptions, care plans, and follow-ups.
- Appointment-bound messaging with moderation/reporting.
- Notification delivery and preference management.
- Immutable audit logs for sensitive record access.

### Suggested integrations

| Need | Integration type |
| --- | --- |
| Voice/video | A managed real-time communications provider with mobile SDKs and token-based rooms. |
| Push notifications | Expo push notifications initially, with a robust provider as scale requires. |
| Payments | A provider that supports the countries, refunds, and marketplace-style payouts required. |
| Maps/search | Places and mapping provider for clinic location, distance, and directions. |
| File storage | Private object storage with signed URLs, virus scanning, and access control. |
| Identity/verification | Professional document verification workflow, initially admin-reviewed if automated verification is unavailable. |

## 10. Delivery Phases

## Phase 1: Care and scheduled consultations

Launch the trustworthy core.

- Owner, vet, and clinic onboarding.
- Vet verification workflow.
- Owner pet profiles, records, medications, vaccines, and reminders.
- Vet/clinic profiles and discovery.
- Scheduled in-clinic and voice consultations.
- Appointment acceptance, rescheduling, cancellation, and notifications.
- Appointment-bound record sharing and messages.
- Consultation notes, care plans, and follow-up reminders.
- Today dashboards for owner and vet.

## Phase 2: Video and practice operations

- Video consultation rooms.
- Clinic team accounts and permissions.
- Rich patient timeline and private professional notes.
- Prescription workflow after local legal review.
- Payments, invoices, refunds, and completed-appointment reviews.
- Owner-controlled ongoing care relationship and record sharing.

## Phase 3: Instant consult and community depth

- Vet availability toggle and instant-consult queue.
- Defined service-level targets and overflow behavior.
- Community vet badges and education tools.
- Local events, rescue flows, lost-and-found improvements, and playdates under Community.
- Posts, stories, and reels as community/profile features with moderation.

## 11. Success Metrics

Measure care usefulness and service quality before social engagement.

| Area | Metrics |
| --- | --- |
| Care retention | Pets with active reminders, weekly care-task completion, records uploaded per active pet. |
| Vet marketplace | Search-to-booking rate, booking acceptance rate, completed consultations, repeat bookings. |
| Consultation quality | Join success rate, call completion rate, follow-up completion, owner rating, vet response time. |
| Trust and safety | Verified-vet ratio, record-access audit exceptions, reports per consultation, dispute rate. |
| Community health | Questions answered, verified-answer rate, local-circle participation, lost-pet resolution rate. |
| Social support | Pet posts created, educational content saves, profile follows; do not optimize total time spent as the primary metric. |

## 12. Explicit Product Decisions

- FurrCircle is not positioned as a replacement for Instagram.
- The default home is Today, not a generic social feed.
- Posts, stories, and reels are retained as community and pet-identity tools.
- A vet call is appointment-based or availability-based, never an unrestricted call to every doctor.
- Vet identity verification, record consent, and emergency guidance are launch requirements, not later polish.
- Health records remain private by default and are separate from public pet/owner social profiles.
