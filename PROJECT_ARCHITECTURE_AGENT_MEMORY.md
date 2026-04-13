# PawsHub Project Architecture Agent Memory

Audit date: 2026-04-11

Use this file as durable project context for future agents and contributors. It summarizes what PawsHub is, how the codebase is organized, what functionality exists, and where the important contracts live.

## Product Summary

PawsHub is an all-in-one pet care platform. The core product combines:
- Pet profiles and multi-pet management.
- Pet health records, vaccines, medications, vitals, allergies, and reminders.
- Vet discovery and appointment booking.
- Community feed, events, comments, likes, saves, sharing, and chat.
- Adoption/foster discovery through public pet listings and interest chats.
- Vet-side dashboard for appointments and patients.
- Admin panel for users, vets, pets, adoptions, content moderation, events, and platform stats.
- Marketing website for public brand/content pages.

Primary user roles:
- `owner`: pet parent using the main mobile app.
- `shelter`: user-table account intended for rescue/shelter discovery.
- `veterinarian`: stored in the separate `vets` table and routed to vet mobile tabs.
- `admin`: user-table account with admin panel access.

Target mobile auth UX:
- Signup should show three role toggles: `Owner`, `Shelter`, and `Veterinarian`.
- Changing the signup toggle should change the form fields below it.
- Owner signup fields should focus on personal pet-parent details.
- Shelter signup fields should focus on shelter/rescue organization details.
- Veterinarian signup fields should focus on clinic/professional details and verification inputs.
- Login should also show the same three toggles: `Owner`, `Shelter`, and `Veterinarian`.
- Changing the login toggle should change the login heading/helper copy and should make the selected account type explicit before submit.
- Login may still reuse email/password fields, but it should validate or route according to the selected role so owner, shelter, and vet login no longer feels like one shared ambiguous form.

## Repository Layout

Root:
- `mobile-expo/`: Expo Router mobile app for owners and vets.
- `backend/`: Express API with Sequelize/PostgreSQL models.
- `admin-panel/`: Next.js admin dashboard.
- `frontend/`: Next.js marketing/public website.
- `TailTrackr_Product_Documentation.md`: product overview/spec.
- `pawshub_design.md`: mobile design guidelines.
- `MISSING_FUNCTIONALITY_NEXT_STEPS.md`: latest audit and next-step roadmap.
- `PROJECT_ARCHITECTURE_AGENT_MEMORY.md`: this file.

## Local Commands

Backend:
- Folder: `backend`
- Dev: `npm run dev`
- Start: `npm start`
- Bootstrap admin: `npm run bootstrap-admin -- --email <email> --name <name>`
- Seed demo accounts: `npm run seed-demo`
- Type check: `npx tsc --noEmit`

Mobile:
- Folder: `mobile-expo`
- Start Expo: `npm start`
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`
- Type check: `npx tsc --noEmit`

Admin panel:
- Folder: `admin-panel`
- Dev: `npm run dev`
- Build: `npm run build`
- Type check: `npx tsc --noEmit`

Marketing frontend:
- Folder: `frontend`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`

## Environment And Config

Backend expects environment values through `backend/.env`; do not expose secrets in docs or logs.

Important backend env categories:
- Database connection values consumed by `backend/config/config.js`.
- `JWT_SECRET`.
- AWS S3 upload values: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, optional `AWS_S3_FOLDER_NAME`.
- `PORT`, defaulting to `5001`.

Mobile API base:
- `mobile-expo/services/api.ts` reads `EXPO_PUBLIC_API_URL` or `Constants.expoConfig.extra.apiUrl`.
- Fallback is `http://127.0.0.1:5001`.
- API root becomes `<base>/api`.

Admin API base:
- `admin-panel/src/lib/adminApiClient.ts` and `AdminAuthContext.tsx` read `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:5001`.
- API root becomes `<base>/api`.

Frontend:
- Mostly static marketing pages; no backend API dependency identified in the reviewed files.

## Backend Architecture

Backend stack:
- Node.js with ESM.
- Express 5.
- Sequelize 6.
- PostgreSQL via `pg`.
- JWT auth with `jsonwebtoken`.
- Password hashing with `bcryptjs`.
- S3 uploads using AWS SDK.
- Socket.IO server is initialized, but no socket event handlers are currently wired.

Backend entry:
- `backend/app.ts`

Startup behavior:
- Loads env with `dotenv/config`.
- Creates Express app and HTTP server.
- Creates Socket.IO server with permissive CORS.
- Registers API routes.
- Authenticates Sequelize.
- Runs `sequelize.sync({ alter: true })`.
- Listens on `0.0.0.0:<PORT>`.

Registered route roots:
- `GET /`: health text response.
- `/api/auth`: auth/profile/role lookup.
- `/api/pets`: pet CRUD and discover listings.
- `/api/health`: vitals, vaccines, meds, records, allergies.
- `/api/appointments`: vet listing and appointment flows.
- `/api/vets`: currently mounts appointment routes too, meaning vet listing under this mount would be `/api/vets/vets`.
- `/api/community`: feed, posts, events, chats.
- `/api/reminders`: reminder CRUD/toggle.
- `/api/admin`: admin dashboard endpoints.
- `/api/upload`: S3 image upload.

## Backend Auth Model

Files:
- `backend/controllers/authController.ts`
- `backend/middleware/authMiddleware.ts`

Two account tables:
- `users`: owner, shelter, admin.
- `vets`: veterinarian accounts.

JWT payload:
- `{ id, userType }`
- `userType` is either `user` or `vet`.

Auth middleware:
- `protect`: verifies Bearer token, loads from `users` or `vets`, attaches `req.user` and `req.userType`.
- `adminOnly`: requires `req.user.role === "admin"`.
- `vetOnly`: requires `req.userType === "vet"`.
- `ownerOnly`: requires `req.user.role === "owner"`.
- `adminAndVetOnly`: exists but is not heavily used in reviewed routes.

Auth controller behavior:
- Owners and shelters self-register into `users`.
- Public registration blocks admin creation.
- Vets self-register into `vets` with `isVerified: false`.
- Login checks `users` first, then `vets`.
- Profile update supports both user and vet fields.
- `GET /api/auth/me` and `GET /api/auth/profile` return normalized profile payloads.
- Password reset endpoint is currently a placeholder response, not a full reset flow.

Target auth behavior:
- `mobile-expo/app/signup.tsx` should present role-specific signup toggles for owner, shelter, and veterinarian.
- `mobile-expo/app/login.tsx` should present role-specific login toggles for owner, shelter, and veterinarian.
- Owner and shelter can continue to authenticate against the `users` table.
- Veterinarian should authenticate against the `vets` table.
- If the login API keeps one endpoint, it should accept an optional selected role/user type and reject a successful credential match if it belongs to a different selected role.
- If separate endpoints are preferred later, keep the mobile service layer hiding that detail behind `authApi.login`.

## Backend Data Models

Model files live in `backend/models/`.

Core identity:
- `User.ts`: users table. Fields include id, name, email, password, role, verified mapped as `isVerified`, profile_photo mapped as `avatar_url`, phone_number mapped as `phone`, address, bio, city.
- `Vet.ts`: vets table. Fields include id, name, email, password, verified mapped as `isVerified`, hospital_name, profession, experience, working_hours, profile_photo mapped as `avatar_url`, phone, address, city, bio, rating.

Pets and health:
- `Pet.ts`: pets table. Owner relation, name, species, breed, gender, birth_date, weight, description, history, adoption/foster flags, age, city, microchip_id, healthStatus.
- `Vital.ts`: vitals table. Pet relation, weight, heartRate, temperature, bloodPressure, notes, timestamp.
- `Vaccine.ts`: vaccines table. Pet relation, name, dateAdministered, nextDueDate, status, manufacturer, notes.
- `Medication.ts`: medications table. Pet relation, name, dosage, frequency, startDate, endDate, status, notes.
- `MedicalRecord.ts`: medical_records table. Pet relation, date, type, description, veterinarian, notes.
- `Allergy.ts`: allergies table. Pet relation, allergen, severity, reaction, notes, diagnosedAt.

Appointments and vet reviews:
- `Appointment.ts`: appointments table. ownerId, vetId, petId, date, time, reason, status, notes.
- `VetReview.ts`: vet_reviews table. vetId, userId, rating, comment, date.

Community:
- `Post.ts`: posts table. userId, content, category, imageUrl, shareCount, status.
- `Comment.ts`: comments table. postId, userId, text.
- `Like.ts`: likes table. postId, userId, unique composite.
- `SavedPost.ts`: saved_posts table. postId, userId, userType, unique composite.
- `Conversation.ts`: conversations table. initiatorId/type, recipientId/type, petId, title.
- `Message.ts`: messages table. conversationId, senderId, senderType, text, petId.

Events and reminders:
- `Event.ts`: events table. organizerId, title, description, date, time, location, category, imageUrl.
- `EventBooking.ts`: event_bookings table. eventId, userId, userType, note, status, unique composite.
- `Reminder.ts`: reminders table. userId, petId, title, notes, time, date, recurrence, type, isDone.

Associations are wired in `backend/models/index.ts`.

Key associations:
- User has many pets, posts, comments, reminders, ownerAppointments, vetReviews.
- Pet belongs to owner and has many vitals, vaccines, medications, medical records, allergies, reminders, appointments.
- Appointment belongs to owner, vet, and pet.
- Post belongs to user author and has comments, likes, saved posts.
- Event belongs to organizer and has bookings.
- Conversation has messages and belongs to optional pet.
- Reminder belongs to user and optional pet.

## Backend API Surface

Auth routes:
- `POST /api/auth/register`: register owner/shelter/veterinarian.
- `POST /api/auth/login`: login user or vet.
- `POST /api/auth/reset-password`: placeholder reset response.
- `GET /api/auth/profile`: protected profile.
- `PUT /api/auth/profile`: protected profile update.
- `GET /api/auth/me`: protected profile alias.
- `GET /api/auth/users/:role`: role lookup, used for shelters/vets.

Pet routes:
- `GET /api/pets`: current owner's pets with next visit, reminder count, health score.
- `POST /api/pets`: create pet.
- `GET /api/pets/discover`: adoption/foster discover feed.
- `GET /api/pets/:id`: pet detail. Owner can view own pet; vet can view appointment-linked pet.
- `PUT /api/pets/:id`: update own pet.
- `DELETE /api/pets/:id`: delete own pet.
- `PATCH /api/pets/:id/listing`: toggle adoption/foster flags.

Health routes:
- `GET/POST /api/health/vitals/:petId`
- `GET/POST /api/health/vaccines/:petId`
- `GET/POST /api/health/meds/:petId`
- `GET/POST /api/health/records/:petId`
- `GET/POST /api/health/allergies/:petId`

Appointment routes:
- `GET /api/appointments/vets`: list verified vets.
- `POST /api/appointments`: owner books appointment.
- `GET /api/appointments/owner`: owner appointment list.
- `GET /api/appointments/vet`: vet appointment list.
- `GET /api/appointments/vet/stats`: vet dashboard stats.
- `PATCH /api/appointments/:id/status`: owner cancels; vet can update status.

Community routes:
- `GET /api/community/feed`: approved posts.
- `POST /api/community/posts`: create post.
- `GET /api/community/posts/:id`: post detail.
- `POST /api/community/posts/:id/like`: toggle like.
- `POST /api/community/posts/:id/save`: toggle save.
- `POST /api/community/posts/:id/share`: increment share count.
- `POST /api/community/posts/:id/comment`: add comment.
- `DELETE /api/community/comments/:id`: delete own comment.
- `GET /api/community/events`: list events.
- `GET /api/community/events/:id`: event detail.
- `POST /api/community/events/:id/book`: book event.
- `GET /api/community/chats`: list conversations.
- `GET /api/community/chats/:id`: conversation detail.
- `POST /api/community/chats/start`: start/reuse conversation.
- `POST /api/community/chats/:id/messages`: send message.

Reminder routes:
- `GET /api/reminders`: list current user's reminders.
- `POST /api/reminders`: create reminder.
- `PUT /api/reminders/:id`: update reminder.
- `PATCH /api/reminders/:id/toggle`: toggle done.
- `DELETE /api/reminders/:id`: delete reminder.

Admin routes:
- `GET /api/admin/stats`: platform stats.
- `GET /api/admin/users`: list users.
- `DELETE /api/admin/users/:userId`: delete user.
- `GET /api/admin/pets`: list pets.
- `GET /api/admin/adoptions`: list adoption-open pets.
- `GET /api/admin/vets`: list vets.
- `GET /api/admin/vets/pending`: list unverified vets.
- `PATCH /api/admin/vets/:vetId/verify`: verify vet.
- `DELETE /api/admin/vets/:vetId`: delete vet.
- `GET /api/admin/pending-posts`: pending community posts.
- `GET /api/admin/posts`: all community posts.
- `PATCH /api/admin/post-moderation/:postId`: approve/reject post.
- `GET /api/admin/events`: events with booking details.
- `POST /api/admin/events`: create event.
- `PATCH /api/admin/events/:eventId`: update event.
- `DELETE /api/admin/events/:eventId`: delete event.

Upload route:
- `POST /api/upload/:folder`: multipart image upload. Allowed folders: profiles, pets, posts, events.

## Mobile Expo Architecture

Mobile stack:
- Expo SDK 54.
- React Native 0.81.
- React 19.
- Expo Router 6.
- NativeWind.
- Gluestack dependencies are installed.
- Lucide icons.
- AsyncStorage for auth, onboarding, theme, and chat seen state.
- Expo image picker and S3 upload API for profile/pet/post images.

Global providers:
- `mobile-expo/contexts/ThemeContext.tsx`: light/dark theme and color tokens.
- `mobile-expo/contexts/AuthContext.tsx`: auth session, token storage, user refresh, onboarding completion.
- `mobile-expo/contexts/NotificationContext.tsx`: chat unread polling with AsyncStorage seen map.

Root layout:
- `mobile-expo/app/_layout.tsx`
- Wraps app with providers.
- Shows global header for logged-in users.
- Redirects based on onboarding, login state, and user role.
- Owners go to `/(tabs)`.
- Vets go to `/(vet-tabs)`.
- Prevents owners from vet tabs and vets from owner tabs.

Owner tabs:
- `mobile-expo/app/(tabs)/index.tsx`: home dashboard.
- `mobile-expo/app/(tabs)/pets.tsx`: pet list.
- `mobile-expo/app/(tabs)/discover.tsx`: vets, shelters, adoption/foster listings.
- `mobile-expo/app/(tabs)/community.tsx`: feed, events, chats, create post.
- `mobile-expo/app/(tabs)/profile.tsx`: owner profile/menu/theme/logout.

Vet tabs:
- `mobile-expo/app/(vet-tabs)/dashboard.tsx`: vet dashboard stats and today's schedule.
- `mobile-expo/app/(vet-tabs)/appointments.tsx`: appointment list and status updates.
- `mobile-expo/app/(vet-tabs)/patients.tsx`: patients derived from vet appointments.
- `mobile-expo/app/(vet-tabs)/community.tsx`: re-exports owner community screen.
- `mobile-expo/app/(vet-tabs)/profile.tsx`: vet profile/menu/theme/logout.

Auth/onboarding:
- `mobile-expo/app/onboarding.tsx`
- `mobile-expo/app/login.tsx`
- `mobile-expo/app/signup.tsx`

Target auth screen behavior:
- Signup uses three top toggles: owner, shelter, veterinarian.
- Signup fields change based on selected toggle.
- Login uses the same three top toggles.
- Login fields can remain email/password, but role-specific copy and returned-role validation should make the selected account type clear.

Pets:
- `mobile-expo/app/pets/add.tsx`: create/edit/delete pet; uploads pet image.
- `mobile-expo/app/pets/[id].tsx`: pet detail, listing toggles, health summary links.

Health:
- `mobile-expo/app/health/vaccines.tsx`
- `mobile-expo/app/health/add-vaccine.tsx`
- `mobile-expo/app/health/meds.tsx`
- `mobile-expo/app/health/add-med.tsx`
- `mobile-expo/app/health/vitals.tsx`
- `mobile-expo/app/health/add-vital.tsx`
- `mobile-expo/app/health/records.tsx`
- `mobile-expo/app/health/add-record.tsx`
- `mobile-expo/app/health/add-allergy.tsx`

Appointments:
- `mobile-expo/app/appointments/book.tsx`: owner books appointment with selected vet and pet.

Community:
- `mobile-expo/app/community/events.tsx`: events list.
- `mobile-expo/app/community/events/[id].tsx`: event detail/booking.
- `mobile-expo/app/community/posts/[id].tsx`: post detail, likes, saves, shares, comments.
- `mobile-expo/app/community/chat/[id].tsx`: chat detail and send message.

Profile/supporting:
- `mobile-expo/app/profile/edit.tsx`: owner/vet profile edit, image upload, location city helper.
- `mobile-expo/app/profile/pets.tsx`: legacy redirect to pets tab.
- `mobile-expo/app/profile/vets.tsx`: saved vets screen, currently static.
- `mobile-expo/app/profile/posts.tsx`: my posts screen, currently static.
- `mobile-expo/app/profile/security.tsx`: security settings, currently local/static.
- `mobile-expo/app/profile/settings.tsx`: app settings, currently local/static.
- `mobile-expo/app/reminders/index.tsx`: reminder list/toggle.
- `mobile-expo/app/notifications/index.tsx`: notification list, currently static.
- `mobile-expo/app/vets/[id].tsx`: vet detail, call, book appointment.

## Mobile Service Layer

Base API:
- `mobile-expo/services/api.ts`
- Provides `api.get/post/put/patch/delete`.
- Adds Bearer token from memory or AsyncStorage.

Upload:
- `mobile-expo/services/uploadApi.ts`
- Picks image from library.
- Uploads multipart to `/api/upload/:folder`.

Auth:
- `mobile-expo/services/auth/authApi.ts`
- `getMe`, `login`, `register`, `updateProfile`, `listShelters`.

User services:
- `mobile-expo/services/users/homeApi.ts`: combines pets, reminders, vets.
- `mobile-expo/services/users/petsApi.ts`: pet CRUD, discover pets, listing update.
- `mobile-expo/services/users/healthApi.ts`: health lists and creates.
- `mobile-expo/services/users/appointmentsApi.ts`: list vets, list owner appointments, book appointment.
- `mobile-expo/services/users/communityApi.ts`: feed/events/chats/posts/actions/messages.
- `mobile-expo/services/users/discoverApi.ts`: combines vets, shelters, discover pets; starts pet interest chat.
- `mobile-expo/services/users/remindersApi.ts`: list and toggle reminders.

Vet services:
- `mobile-expo/services/vets/homeApi.ts`: vet stats and appointments.
- `mobile-expo/services/vets/appointmentsApi.ts`: list/update appointments, stats, derive patients.

Normalizers:
- `mobile-expo/services/shared/normalizers.ts`
- Normalizes profiles, pets, vaccines, meds, allergies, records, appointments, reminders, posts, events, conversations, and vitals.

## Admin Panel Architecture

Admin stack:
- Next.js 16 App Router.
- React 19.
- Tailwind CSS 4.
- Lucide icons.
- LocalStorage session.

Admin auth:
- `admin-panel/src/contexts/AdminAuthContext.tsx`
- Logs in through `/api/auth/login`.
- Requires returned role to be `admin`.
- Stores session in `pawshub_admin_session`.
- Stores token in `pawshub_admin_token`.

Admin API client:
- `admin-panel/src/lib/adminApiClient.ts`
- Adds Bearer token from localStorage.
- Supports JSON requests and multipart upload.

Layout/components:
- `admin-panel/src/app/layout.tsx`
- `admin-panel/src/components/AdminLayout.tsx`
- `admin-panel/src/components/AdminLoginScreen.tsx`
- `admin-panel/src/components/AdminHeader.tsx`
- `admin-panel/src/components/Sidebar.tsx`

Admin pages:
- `admin-panel/src/app/page.tsx`: dashboard stats and pending vet preview.
- `admin-panel/src/app/users/page.tsx`: users list, search/filter, delete user.
- `admin-panel/src/app/vets/page.tsx`: vet list, pending/verified tabs, verify/delete vet.
- `admin-panel/src/app/pets/page.tsx`: pet database, search/filter.
- `admin-panel/src/app/adoptions/page.tsx`: adoption-open pet listings.
- `admin-panel/src/app/community/page.tsx`: pending/all posts, approve/reject.
- `admin-panel/src/app/events/page.tsx`: event CRUD, image upload, bookings drawer.
- `admin-panel/src/app/settings/page.tsx`: static settings/logs page.

Admin compile note:
- At audit time, `npx tsc --noEmit` fails because `AdminSession` lacks `title`, while header/sidebar read `admin?.title`.

## Marketing Frontend Architecture

Frontend stack:
- Next.js 16 App Router.
- React 19.
- Tailwind CSS 4.
- Framer Motion.
- Lucide and React Icons.

Pages:
- `frontend/app/page.tsx`: home.
- `frontend/app/about-us/page.tsx`: about.
- `frontend/app/services/page.tsx`: services.
- `frontend/app/contacts/page.tsx`: contact.

Main view folders:
- `frontend/Views/Home/*`
- `frontend/Views/About/*`
- `frontend/Views/Services/*`
- `frontend/Views/Contacts/*`

Shared components:
- `frontend/components/Common/Navbar.tsx`
- `frontend/components/Common/Footer.tsx`
- `frontend/components/Common/Button.tsx`
- `frontend/components/AnimationProvider.tsx`
- `frontend/components/ui/button.tsx`

Public assets:
- Hero animals, gallery images, service/about/contact images, logos/default assets.

Current behavior:
- Marketing site appears mostly static and presentational.
- Contact form inputs are not wired to a backend endpoint in reviewed files.

## Implemented Feature Inventory

Implemented or mostly implemented:
- Owner/vet login and registration.
- Onboarding state.
- Role-based mobile routing.
- Owner profile refresh/update.
- Vet profile refresh/update.
- Profile image upload.
- Pet create/edit/delete and image upload.
- Owner pet list and pet detail.
- Adoption/foster listing toggles on pet detail.
- Discover vets from verified vets endpoint.
- Discover shelters from role lookup.
- Discover adoption/foster pets.
- Start chat from adoption/foster interest.
- Book vet appointment.
- Vet appointment list.
- Vet status updates for appointments.
- Vet stats.
- Vet patients derived from appointments.
- Health vitals list/create.
- Vaccines list/create.
- Medications list/create.
- Medical records list/create.
- Allergies list/create.
- Reminder list/toggle.
- Community feed.
- Community post create with image upload.
- Post like/save/share/comment.
- Post detail.
- Event list/detail/booking.
- Chat list/detail/send.
- Chat unread count polling.
- Admin login.
- Admin stats.
- Admin user list/delete.
- Admin vet list/verify/delete.
- Admin pet list.
- Admin adoption listing list.
- Admin community post moderation UI.
- Admin event list/create/edit/delete/upload/booker view.
- Marketing website pages.

Partial or missing:
- Full password reset.
- Owner appointment list/history/cancel UI.
- Reminder create/edit/delete UI.
- Formal adoption/foster applications.
- Saved vets.
- My posts.
- Real notifications.
- Push notifications/background reminder scheduling.
- Vet reviews.
- Document/certificate uploads/downloads.
- Admin settings and audit logs.
- Admin global search/notifications.
- Production-grade environment validation/migrations/security.

## Important Known Mismatches

Event fields:
- Backend model uses `imageUrl`.
- Admin uses `image_url`.
- Admin uses `status`.
- Backend event model does not define `status`.
- Backend admin controller uses `createdBy`, but model uses `organizerId`.

Vet fields:
- Backend vet uses `hospital_name`, `profession`, `avatar_url`.
- Some frontend/admin code expects `clinic_name`, `specialty`, `avatar`.
- Mobile normalizers map these, but admin pages do not consistently normalize.

Post image fields:
- Backend post model uses `imageUrl`.
- Some admin code reads `image_url`.

Community author fields:
- Posts/comments/likes do not consistently store userType/authorType.
- Mobile serializer can resolve user or vet profiles in several places.
- Admin post include only resolves `users` as author.

Admin session:
- Type lacks `title`.
- Header/sidebar expect `title`.

## Suggested Mental Model For Future Work

When adding features:
- Prefer existing service files in `mobile-expo/services/`.
- Normalize API shape in `services/shared/normalizers.ts` rather than spreading field-name handling through screens.
- Keep backend route/controller/model naming consistent with existing folders.
- If both users and vets can perform an action, store both id and type.
- If admin needs to display a mixed user/vet actor, use an explicit resolver like community feed does.
- Avoid adding more runtime seed/demo behavior inside GET endpoints.
- For production data changes, prefer migrations over relying on `sync({ alter: true })`.

When debugging mobile:
- Check `AuthContext` first for role/user/token shape.
- Check `app/_layout.tsx` for redirect behavior.
- Check service normalizers before changing screen code.
- Remember owner routes and vet routes share some screens, especially community and pet detail access.

When debugging admin:
- Check `AdminAuthContext` and `adminApiClient` for token/API root.
- Check whether page field names match backend models.
- Run `npx tsc --noEmit`; admin had type errors at audit time.

When debugging backend:
- Check `backend/app.ts` route mounts.
- Check `models/index.ts` associations and dynamic model import.
- Check whether a model defines the field a controller is assigning.
- Check auth middleware and role guards before assuming a route is reachable by all roles.

## Latest Audit Pointers

For active missing functionality and recommended implementation order, read:
- `MISSING_FUNCTIONALITY_NEXT_STEPS.md`
