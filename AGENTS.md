# AGENTS.md

## Purpose
This file defines how future AI agents should work in this repository.
Follow these rules before changing code.

## Project Snapshot
- App type: Expo + React Native + expo-router.
- Language: TypeScript.
- UI direction: Arabic (RTL) first.
- Data layer: React Query + `fetch`.
- Contexts: auth, basket, favorites, selling point.

## Directory Structure
- `app/_layout.tsx`: global providers, splash, update check, push setup, global font defaults.
- `app/(tabs)/_layout.tsx`: bottom tab navigator configuration.
- `app/(tabs)/home.tsx`: currently reuses products screen.
- `app/(tabs)/products.tsx`: product listing, filters, pagination.
- `app/product/[id].tsx`: product details.
- `app/(tabs)/basket.tsx`: basket, checkout modal, order submission.
- `app/(tabs)/store.tsx`: selling point selection.
- `app/(tabs)/account.tsx`: login/profile screen.
- `app/(tabs)/account-register.tsx`: register screen UI flow.
- `app/(tabs)/favorites.tsx`: favorites listing and actions.
- `app/(tabs)/orders.tsx`: orders tab view.
- `components/BrandedHeader.tsx`: shared branded header used across screens.
- `contexts/AuthContext.tsx`: auth session and profile state.
- `contexts/BasketContext.tsx`: basket persistence and mutations.
- `contexts/FavoritesContext.tsx`: favorites persistence.
- `contexts/SellingPointContext.tsx`: selling points and selected store.
- `services/httpClient.ts`: auth-aware HTTP wrapper (credentials include + refresh retry).
- `services/auth.ts`: auth service methods.
- `services/api.ts`: products/brands/version/product details APIs.
- `services/notifications.ts`: push registration calls.
- `utils/availability.ts`: selling-point stock helpers.
- `utils/formatPrice.ts`: price/Arabic numeral formatting.

## Env And Build Rules
- Dev env file: `.env.local`
- Production env file: `.env.production`
- Required public env: `EXPO_PUBLIC_API_BASE_URL`
- Production APK command:
  - `npm run build:apk:prod`
  - Uses `scripts/build-apk-prod.ps1` (forces production API URL + production mode)

## API Contract (Current)
### Main endpoints used by app
- `GET /api/v1/products`
- `GET /api/v1/brands`
- `GET /api/v1/selling-points`
- `POST /api/v1/selling-orders/client-initialization`
- `POST /api/v1/auth/client-version/validate`

### Auth endpoints
- `POST /api/v1/auth/token`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Auth mode (must keep)
- Cookie-based auth only.
- Always send credentials (`credentials: 'include'`).
- Do not add Bearer token header for protected requests.
- `httpClient` handles one refresh retry on 401.

## Product Rules
- Selling point impacts product availability.
- Product quantity in basket should respect available quantity for selected selling point.
- Keep showing availability in list/details where implemented.

## Checkout Rules
- Selected selling point is required before checkout.
- Basket checkout supports:
  - Logged-in checkout (prefilled from profile: name/email/phone)
  - Guest checkout option (from basket footer)
- Validate checkout form fields consistently with inline errors.

## Navigation Rules
- Use `BrandedHeader` consistently.
- Tabs currently include: home, products, favorites, basket, orders, store, account.
- Preserve existing route names and tab behavior unless explicitly requested.

## Arabic/RTL Safety Rules (Critical)
- Do not paste corrupted mojibake text (examples: `Ø`, `Ù`, `�`).
- Prefer one of:
  - direct Arabic literals, or
  - JS Unicode expressions like `{'\u0627\u0644\u0633\u0644\u0629'}`
- For `TextInput` placeholders, if using unicode escapes, use JS expression form:
  - correct: `placeholder={'\u0623\u062f\u062e\u0644 ...'}`
  - avoid: `placeholder="\u0623\u062f\u062e\u0644 ..."` (renders raw escapes on web in this codebase)

## Debug Rules
- HTTP debug toggle: `EXPO_PUBLIC_DEBUG_HTTP=true`
- Auth debug toggle: `EXPO_PUBLIC_DEBUG_AUTH=true`
- Remove noisy debug logs after issue is resolved unless user asks to keep.

## Change Discipline For Agents
1. Read affected screen/context/service first.
2. Keep business behavior unchanged unless request says otherwise.
3. Prefer minimal edits in existing files.
4. Run `npx tsc --noEmit` after changes.
5. If text is Arabic, visually verify no corruption markers remain.
6. Do not revert unrelated user changes.

## Known Constraints
- Expo Go has push-notification limitations; do not treat that warning as app logic failure.
- Local EAS build is not supported on Windows; local APK is built via Android Gradle (`assembleRelease`).

## If You Add New Features
- Reuse existing contexts before creating new global state.
- Add endpoints in `services/api.ts` or `services/auth.ts` (auth-related).
- Keep auth-protected flows aligned with cookie-based backend contract.
- Update this AGENTS.md when architecture or rules change.
