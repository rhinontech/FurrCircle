# Post-Signup Onboarding Wizard (5 steps)

## Context
After signup, users currently land straight in `/(tabs)` with an empty app. `app/onboarding.tsx` exists but is a static welcome carousel that only shows slide 1 and is never navigated to. We're replacing it with a functional 5-step wizard shown to **new signups only**: enable location/notifications → add first pet → complete profile → join circles → done. Backend support already exists (`POST /auth/onboarding-complete` sets `hasCompletedOnboarding=true`; the field is already on the user model and in the app's `AuthPayload`).

User decisions: new signups only (no gate for existing users); 5 steps including a profile step.

## Files to change

### 1. `services/auth/authApi.ts` — add wrapper
```ts
export const completeOnboarding = async (): Promise<AuthPayload> => {
  const res = await PrivateAxios.post('/auth/onboarding-complete');
  return res.data;
};
```

### 2. `src/lib/auth-store.ts` — transient flag
Add `justSignedUp: boolean` + `setJustSignedUp(v)` — plain in-memory state, **not persisted** (so a restart never re-triggers onboarding).

### 3. `app/_layout.tsx` — auth guard (~line 303–312)
The guard currently does `user && inAuthGroup → router.replace("/(tabs)")`, which would race any manual navigation from signup. Change to:
```ts
} else if (user && inAuthGroup) {
  router.replace(justSignedUp ? "/onboarding" : "/(tabs)");
}
```
`"onboarding"` stays out of `inAuthGroup` (verified it isn't there), so the guard leaves the wizard alone once on it. Screen is already registered with `presentation: "fullScreenModal"`; add `gestureEnabled: false`.

### 4. `app/signup.tsx` (~line 140)
Before `await setSession(regRes)`: `useAuthStore.getState().setJustSignedUp(true)`. Guard then lands on `/onboarding`.

### 5. `app/otp-verify.tsx` (5× `router.replace("/(tabs)")` at lines ~155/159/210/214/237)
Set `justSignedUp=true` + route to `/onboarding` **only for the signup-verification branches**; login/2FA branches for existing users keep `/(tabs)`. Distinguish via the screen's existing flow/mode param (inspect each branch during implementation).

### 6. `app/onboarding.tsx` — full rewrite (one file, local step components)
Button-driven (no swipe), progress dots, "Skip" top-right on steps 1–4, primary Continue button. Glass design system throughout: `PageContainer`/`AmbientBackground`, `glassSurface(tk)`/`GlassCard`, `useTokens()`, icons from `src/components/ui/icons`, Poppins/Inter fonts.

- **Step 1 — Location & notifications**: two glass cards. Location → `LocationPickerModal` / `fetchLiveLocation` + `updateLocation` from `src/lib/location-store.ts`; show resolved city on success. Notifications → `requestNotificationPermissionEarly()` (`helpers/requestNotificationPermission.ts`). Denials show muted state, never block.
- **Step 2 — Add your first pet**: slim inline form (photo optional via `uploadImage(uri,'pets')`, name, species chips, breed optional) → `petApi.createPet` (copy patterns from `app/add-pet.tsx`). Success shows a small confirmation; failure → Alert + retry or Skip.
- **Step 3 — Complete your profile**: avatar circle (image picker → `userApi.uploadImage(uri, 'profiles')`) + bio input → `userApi.updateProfile({ avatar_url, bio })` (both exist in `services/user/userApi.ts:38,43`). Optional; Continue always enabled.
- **Step 4 — Join circles**: `circleApi.getTrending()` (fallback `getAllCircles()`), top ~6 as glass rows with Join/Joined toggle → `circleApi.joinCircle(id)` (optimistic, silent revert on failure). Error/empty → skip copy.
- **Step 5 — You're all set**: summary (profile/pet/circles), "Get started" → `finish()`.

`finish()` (used by step-5 button and skip-all):
```ts
try { const res = await completeOnboarding();
      await setSession({ ...user, ...res, token: user?.token ?? res.token }); } // token merge is critical — losing it logs the user out
catch {} // never block
setJustSignedUp(false);
router.replace("/(tabs)");
```

## Edge cases
- Android hardware back: step>0 → previous step; step 0 → ignore (don't return to signup).
- Skip-all still calls `completeOnboarding()` so the server flag flips.
- Any API failure (updateProfile/createPet/joinCircle/completeOnboarding) → at most an Alert, never blocks reaching `/(tabs)`.

## Verification
1. Fresh signup (auto-token path) → lands on /onboarding; complete all steps → profile photo/bio saved, pet visible in Profile tab, joined circles in Circles tab.
2. Signup-via-OTP path → /onboarding; existing-user login (incl. 2FA OTP) → straight to /(tabs)).
3. Skip on every step + skip-all → /(tabs); kill & relaunch app → no onboarding (flag not persisted, server flag true).
4. Deny both permissions → wizard still completable.
5. Network off during finish → still lands in /(tabs); relaunch keeps session (token preserved).
6. `npx tsc --noEmit` clean; check light + dark mode rendering.
