# CLAUDE.md (mobile)

Read `AGENTS.md` first. Notes below are durable learnings.

## Play Console: "DEX code optimization is below our threshold" (T-0005, release 1.0.14 build 43)
- Cause: release build shipped with R8 minify/obfuscation off (Obfuscation 1%, needs >= 25%).
- Fix: `expo-build-properties` plugin in `app.json` -> `android.enableMinifyInReleaseBuilds: true`,
  `enableShrinkResourcesInReleaseBuilds: true`, plus `extraProguardRules` (keep attributes, hermes/fbjni, firebase; dontwarn okhttp/okio/facebook).
  Prebuild writes these to `android/gradle.properties` and `android/app/proguard-rules.pro` (generated, git-ignored `android/`). Do not edit those by hand; edit `app.json`.
- If a release crashes or misbehaves after R8, add `-keep` rules in `extraProguardRules` (check logcat for ClassNotFound/NoSuchMethod). Upload `android/app/build/outputs/mapping/release/mapping.txt` to Play Console for readable crash stacks (EAS builds do this via the AAB).
- Not yet smoke-tested on device; do a release APK/AAB sanity run (home, products, basket, push, login) before the next submission.

## Play recommendations (open, not changed)
- Edge-to-edge deprecated APIs (Window.setStatusBarColor etc.): come from React Native `StatusBarModule`/`WindowUtil` and Material `BottomSheetDialog`/`EdgeToEdgeUtils` internals; the app JS does not call them. Resolves by upgrading RN/Expo/material libs, not app code.
- `orientation: "portrait"` in `app.json` locks MainActivity; Android 16 ignores it on large screens. Removing needs layout QA on tablets/foldables.
