# Firebase Phone Authentication Plan For PawsHub

Created: 2026-04-12

Scope:
- `mobile-expo/`
- `backend/`
- Firebase Authentication

This plan describes how to move PawsHub signup and login to phone-number OTP authentication using Firebase, while keeping the existing PawsHub backend, roles, vet verification, JWT sessions, and app routing.

## Goal

During signup:
- Ask for mobile number as a required field.
- Send OTP to that number through Firebase Phone Authentication.
- Continue account creation only after OTP verification succeeds.
- Keep the remaining owner, shelter, and veterinarian flow mostly the same.

During login:
- Login should happen from phone number only.
- User enters phone number.
- Firebase sends OTP.
- User verifies OTP.
- Backend returns the same PawsHub JWT the app already uses.

## Recommended Architecture

Firebase should only prove the phone number.

The PawsHub backend should remain the source of truth for:
- User profile
- Role: owner, shelter, veterinarian, admin
- Vet verification status
- Pets
- Appointments
- Medical records
- Notifications
- PawsHub JWT session

Recommended flow:

1. Mobile app asks user for phone number.
2. Firebase sends OTP.
3. User enters OTP.
4. Firebase authenticates the phone number.
5. Mobile app gets Firebase ID token with `getIdToken()`.
6. Mobile app sends the Firebase ID token to PawsHub backend.
7. Backend verifies the ID token with Firebase Admin SDK.
8. Backend extracts verified Firebase data:
   - Firebase UID
   - verified phone number
9. Backend creates or finds the PawsHub account.
10. Backend returns the existing PawsHub auth payload and JWT.
11. Mobile app stores the PawsHub JWT exactly as it does today.

This keeps the app from becoming dependent on Firebase for app-specific authorization. Firebase authenticates identity; PawsHub authorizes behavior.

## Important Expo Note

For real Firebase phone authentication, this app should use an Expo development build, not Expo Go.

Reason:
- Phone auth through `@react-native-firebase/auth` uses native Firebase code.
- Expo Go has a fixed native runtime.
- Expo Go cannot include arbitrary native modules that were not already built into Expo Go.
- A custom Expo development build lets PawsHub include Firebase native code.

Development workflow should move from:

```txt
Expo Go QR scan
```

to:

```txt
Expo development build installed on device
```

## Current Auth State In PawsHub

Current mobile files:
- `mobile-expo/app/signup.tsx`
- `mobile-expo/app/login.tsx`
- `mobile-expo/contexts/AuthContext.tsx`
- `mobile-expo/services/auth/authApi.ts`

Current backend files:
- `backend/controllers/authController.ts`
- `backend/routes/authRoutes.ts`
- `backend/models/User.ts`
- `backend/models/Vet.ts`

Current behavior:
- Signup uses email and password.
- Login uses email and password.
- Owner and shelter accounts are stored in `users`.
- Veterinarian accounts are stored in `vets`.
- Backend issues a PawsHub JWT with `{ id, userType }`.
- Mobile stores the PawsHub JWT in AsyncStorage.
- Existing route guards depend on the PawsHub JWT, not Firebase.

That structure can stay. Firebase phone auth will sit before backend login/signup.

## Signup Flow

Recommended user flow:

1. User opens signup.
2. User chooses role:
   - Pet Owner
   - Shelter
   - Veterinarian
3. User enters required phone number.
4. User taps `Send OTP`.
5. Firebase sends SMS OTP.
6. User enters OTP.
7. Firebase verifies OTP.
8. App collects or confirms remaining profile fields:
   - Owner:
     - name
     - optional email
     - city if desired
   - Shelter:
     - shelter or organization name
     - optional email
     - city
     - address if desired
   - Veterinarian:
     - doctor name
     - clinic or hospital name
     - specialty/profession
     - city
     - optional email
     - phone is already verified
9. Mobile gets Firebase ID token.
10. Mobile calls backend signup endpoint.
11. Backend verifies Firebase ID token.
12. Backend creates account.
13. Backend returns PawsHub JWT.
14. App continues to the existing owner/shelter/vet route.

Vet rule:
- Veterinarian accounts should still be created as `isVerified: false`.
- Existing verification pending flow should remain.

## Login Flow

Recommended user flow:

1. User opens login.
2. User selects role if role-specific login remains:
   - Pet Owner
   - Shelter
   - Veterinarian
3. User enters phone number.
4. User taps `Send OTP`.
5. Firebase sends SMS OTP.
6. User enters OTP.
7. Firebase verifies OTP.
8. Mobile gets Firebase ID token.
9. Mobile calls backend login endpoint.
10. Backend verifies Firebase ID token.
11. Backend finds PawsHub account by Firebase UID or phone number.
12. Backend returns PawsHub JWT.
13. App continues with existing auth/session flow.

## Backend Changes

Install Firebase Admin SDK:

```bash
cd backend
npm install firebase-admin
```

Add Firebase Admin initialization:

```txt
backend/config/firebaseAdmin.ts
```

Recommended env style:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Alternative env style:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=
```

Do not commit the Firebase service account JSON.

## Backend Model Changes

Add these fields to `users`:

```txt
firebaseUid
phone
phoneVerifiedAt
```

`phone` already exists in `User.ts` and maps to `phone_number`, but we should verify database state and uniqueness.

Add these fields to `vets`:

```txt
firebaseUid
phone
phoneVerifiedAt
```

`phone` already exists in `Vet.ts` and maps to `phone_number`, but we should verify database state and uniqueness.

Recommended constraints:
- `firebaseUid` should be unique.
- `phone` should be unique within the account system, unless we intentionally allow one phone number to have multiple roles.

## Backend Endpoint Options

Option A: one combined endpoint:

```txt
POST /api/auth/firebase
```

Payload:

```json
{
  "idToken": "firebase-id-token",
  "mode": "signup",
  "role": "owner",
  "name": "User Name",
  "email": "optional@example.com",
  "extra": {
    "city": "Mumbai"
  }
}
```

Option B: separate endpoints:

```txt
POST /api/auth/phone/signup
POST /api/auth/phone/login
POST /api/auth/phone/complete-profile
```

Recommended:
- Use separate endpoints. It keeps validation clearer and makes mobile code easier to read.

## Backend Signup Behavior

For `POST /api/auth/phone/signup`:

1. Receive Firebase ID token and profile payload.
2. Verify token with Firebase Admin SDK.
3. Extract:
   - `decoded.uid`
   - `decoded.phone_number`
4. Reject if token has no phone number.
5. Check whether an account already exists for:
   - `firebaseUid`
   - verified phone number
6. If account exists, return a helpful error or log the user in, depending on product decision.
7. Create account in correct table:
   - `users` for owner/shelter
   - `vets` for veterinarian
8. Store:
   - `firebaseUid`
   - `phone`
   - `phoneVerifiedAt`
   - profile fields
9. For veterinarian:
   - set `isVerified: false`
10. Return PawsHub JWT using existing `generateToken`.

## Backend Login Behavior

For `POST /api/auth/phone/login`:

1. Receive Firebase ID token.
2. Verify token with Firebase Admin SDK.
3. Extract:
   - `decoded.uid`
   - `decoded.phone_number`
4. Find account by `firebaseUid`.
5. If missing, fallback to verified phone number.
6. If still missing, return account-not-found message.
7. If role was selected on login, verify returned account role matches selected role.
8. Return PawsHub JWT using existing `generateToken`.

## Mobile Changes

Install Firebase native modules:

```bash
cd mobile-expo
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

Install Expo development client:

```bash
npx expo install expo-dev-client
```

Add Firebase config files:

```txt
mobile-expo/google-services.json
mobile-expo/GoogleService-Info.plist
```

Update `mobile-expo/app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.pawshub"
    },
    "android": {
      "package": "com.yourcompany.pawshub"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth"
    ]
  }
}
```

The current Android package is:

```txt
com.anonymous.pawshub
```

Before adding Firebase apps, choose final identifiers.

Suggested final identifiers:

```txt
com.rhinon.pawshub
```

## Mobile Signup UI Changes

Update `mobile-expo/app/signup.tsx`.

New signup states:

```txt
enter-phone
enter-otp
complete-profile
submitting
```

Required fields:
- phone number
- OTP
- role
- name or organization/clinic name

Optional fields:
- email
- city
- address
- vet hospital name
- vet profession/specialty

Recommended UI behavior:
- Use E.164 phone format, for example `+919876543210`.
- Show country code helper.
- Disable submit until phone is valid.
- After OTP verification, keep phone read-only.
- After backend signup succeeds, call existing auth storage logic.

## Mobile Login UI Changes

Update `mobile-expo/app/login.tsx`.

Remove:
- email input
- password input
- forgot password link, unless password login remains temporarily

Add:
- phone number input
- send OTP button
- OTP input
- verify/login button

Recommended login states:

```txt
enter-phone
enter-otp
submitting
```

## Mobile Auth API Changes

Update `mobile-expo/services/auth/authApi.ts`.

Add:

```ts
phoneSignup(payload)
phoneLogin(payload)
```

Example payload:

```ts
{
  idToken: string;
  role?: "owner" | "shelter" | "veterinarian";
  name?: string;
  email?: string;
  extra?: Record<string, string>;
}
```

## Mobile AuthContext Changes

Update `mobile-expo/contexts/AuthContext.tsx`.

Add methods:

```ts
loginWithPhone(idToken: string, selectedRole?: UserRole): Promise<void>
registerWithPhone(payload): Promise<void>
```

These methods should:
- call backend phone auth endpoints
- receive PawsHub auth payload
- store `user_data`
- store `user_token`
- set in-memory auth token with `setAuthToken`
- set current user state

Existing app routing should keep working.

## Development Build Commands

After Firebase config is added:

```bash
cd mobile-expo
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

If EAS is not configured yet:

```bash
npx eas init
```

Local dev start after installing development build:

```bash
npx expo start --dev-client
```

## Firebase Details Needed

### 1. Firebase Project ID

How to get it:

1. Open Firebase Console.
2. Go to Project Settings.
3. Open General tab.
4. Copy `Project ID`.

Needed for:
- backend Firebase Admin SDK
- token audience verification

### 2. Android Package Name

Current:

```txt
com.anonymous.pawshub
```

Recommended final:

```txt
com.rhinon.pawshub
```

How to decide:
- Use a reverse-domain style namespace.
- Pick the final production package before publishing.
- Changing this later is painful once the app is live.

Needed for:
- Firebase Android app
- `mobile-expo/app.json`
- Android builds

### 3. iOS Bundle Identifier

Recommended final:

```txt
com.rhinon.pawshub
```

How to decide:
- Usually same as Android package.
- Must be unique in Apple Developer account.

Needed for:
- Firebase iOS app
- `mobile-expo/app.json`
- iOS builds

### 4. Firebase Android Config

File:

```txt
google-services.json
```

How to get it:

1. Firebase Console.
2. Project Settings.
3. General tab.
4. Add Android app.
5. Enter Android package name.
6. Download `google-services.json`.
7. Place it at:

```txt
mobile-expo/google-services.json
```

### 5. Firebase iOS Config

File:

```txt
GoogleService-Info.plist
```

How to get it:

1. Firebase Console.
2. Project Settings.
3. General tab.
4. Add iOS app.
5. Enter iOS bundle identifier.
6. Download `GoogleService-Info.plist`.
7. Place it at:

```txt
mobile-expo/GoogleService-Info.plist
```

### 6. Firebase Admin Service Account

How to get it:

1. Firebase Console.
2. Project Settings.
3. Service accounts.
4. Click `Generate new private key`.
5. Download JSON.

Important:
- Do not commit this JSON.
- Store it in backend environment variables.

Recommended backend env:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

If multiline private key causes deployment issues, use:

```env
FIREBASE_SERVICE_ACCOUNT_BASE64=
```

### 7. Enable Phone Authentication

How to enable:

1. Firebase Console.
2. Authentication.
3. Sign-in method.
4. Enable Phone provider.

Also configure SMS region policy:

1. Firebase Console.
2. Authentication.
3. Settings or SMS region policy.
4. Allow target regions.

For PawsHub, likely allow India first if launch/testing is in India.

### 8. Firebase Test Phone Numbers

How to add:

1. Firebase Console.
2. Authentication.
3. Sign-in method.
4. Phone.
5. Open Phone numbers for testing.
6. Add test number and OTP.

Example:

```txt
Phone: +911234567890
OTP: 123456
```

Use test numbers during development to avoid SMS quota and delivery issues.

### 9. Android SHA-1 And SHA-256

Needed for Android phone auth app verification.

How to get them:

Option A: EAS credentials
- Use EAS credentials/build setup.
- Get Android signing certificate fingerprints.
- Add them in Firebase Console under Android app settings.

Option B: local native signing report
- After prebuild/native Android project exists, run signing report.
- Copy SHA-1 and SHA-256 into Firebase Console.

Firebase location:

```txt
Firebase Console > Project Settings > Your Android App > SHA certificate fingerprints
```

### 10. Apple Developer / APNs Setup For iOS

For iOS phone auth, Firebase uses silent APNs verification when possible and can fall back to reCAPTCHA.

For best production behavior:

1. Open Apple Developer account.
2. Go to Certificates, Identifiers & Profiles.
3. Create or use APNs Auth Key.
4. Upload APNs key to Firebase project settings.

This is not always needed for early dev with test numbers, but it matters before production release.

## Product Decisions Needed

### 1. Should Email Be Optional Or Removed?

Recommendation:
- Make email optional during signup.
- Do not use email for login.
- Keep email as contact/profile field.

### 2. Can One Phone Number Have Multiple Roles?

Example:
- Same phone number as owner and veterinarian.

Recommendation:
- Start with one account role per phone number.
- This is simpler, safer, and avoids confusing login resolution.

Later option:
- Allow role-specific accounts under same phone, but require role selection at login.

### 3. What Happens To Existing Email/Password Accounts?

Options:

Option A:
- Phone auth applies only to new users.
- Existing users continue with email/password temporarily.

Option B:
- Existing users must verify phone once.
- After verification, they login by phone only.

Recommendation:
- Support migration.
- Existing users can login with old method temporarily, add/verify phone, then future login is phone-only.

### 4. Should Password Login Remain Temporarily?

Recommendation:
- Keep email/password as fallback during migration.
- Hide it from normal UI later.
- Remove it only after existing users have migrated.

### 5. Should Signup Ask Profile Details Before Or After OTP?

Option A:
- Ask phone first.
- Verify OTP.
- Then ask profile details.

Option B:
- Ask full form first.
- Then verify OTP.

Recommendation:
- Ask role + phone first.
- Verify OTP.
- Then ask profile details.

This avoids users filling a long form before discovering OTP cannot be delivered.

## Implementation Order

1. Decide final Android package name and iOS bundle ID.
2. Add Android and iOS apps in Firebase Console.
3. Download Firebase config files.
4. Enable Firebase Phone provider.
5. Add test phone numbers.
6. Add Android SHA-1 and SHA-256 when available.
7. Add Firebase Admin SDK to backend.
8. Add Firebase Admin config/env loading.
9. Add `firebaseUid` and `phoneVerifiedAt` fields to `users` and `vets`.
10. Add phone signup/login backend endpoints.
11. Add mobile Firebase packages.
12. Add Expo development client.
13. Update `app.json` plugins and app identifiers.
14. Update `authApi`.
15. Update `AuthContext`.
16. Rebuild signup flow with phone + OTP.
17. Rebuild login flow with phone + OTP.
18. Build and install Expo development build.
19. Test with Firebase test phone numbers.
20. Test with real phone numbers.

## QA Checklist

Owner signup:
- Select owner.
- Enter phone.
- Receive OTP.
- Verify OTP.
- Complete profile.
- User lands in owner app.
- PawsHub JWT persists after reload.

Shelter signup:
- Select shelter.
- Enter phone.
- Verify OTP.
- Complete shelter profile.
- User lands in correct shelter/owner-compatible flow.

Veterinarian signup:
- Select veterinarian.
- Enter phone.
- Verify OTP.
- Complete vet profile.
- Account is created with `isVerified: false`.
- User lands on verification pending screen.

Owner login:
- Enter phone.
- Verify OTP.
- User lands in owner tabs.

Vet login:
- Enter phone.
- Verify OTP.
- Verified vet lands in vet tabs.
- Unverified vet lands in verification pending screen.

Session:
- Close app and reopen.
- PawsHub session remains active.
- `/api/auth/me` still works.

Backend:
- Firebase ID token verification rejects invalid tokens.
- Backend rejects signup if phone is already used.
- Backend rejects login if phone has no PawsHub account.
- Backend preserves existing role restrictions.

## Security Notes

- Never trust phone number sent directly by the mobile app.
- Only trust phone number extracted from verified Firebase ID token.
- Never store Firebase Admin service account JSON in git.
- PawsHub JWT should still be generated only by backend.
- Phone-number-only auth is convenient but less secure than multi-factor or password plus phone because phone numbers can be transferred.
- Consider account recovery and phone number change flows before production.

## Future Work

After basic phone auth works:

- Add phone number change flow.
- Add account recovery flow.
- Add optional email verification.
- Add support for multiple roles under one verified phone if product needs it.
- Add SMS abuse limits at backend.
- Add Firebase App Check later for stronger client protection.

## Useful References

- Firebase Admin ID token verification: `https://firebase.google.com/docs/auth/admin/verify-id-tokens`
- Firebase Android phone auth setup: `https://firebase.google.com/docs/auth/android/phone-auth`
- React Native Firebase phone auth: `https://rnfirebase.io/auth/phone-auth`
- Expo development builds: `https://docs.expo.dev/develop/development-builds/introduction/`
