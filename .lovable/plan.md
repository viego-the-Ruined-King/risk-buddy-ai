# Global UI/UX Enhancement — Page Transitions, Settings Hub, Typewriter & Start Button

## Overview

Four enhancements: animated page transitions via framer-motion, an expanded Settings hub with theme/language/file-upload, a TypewriterReveal component, and a custom "Start Study" button (converted from styled-components to Tailwind).

## 1. Global Page Transitions (framer-motion)

**Files:** `src/components/AnimatedPage.tsx` (new), `src/App.tsx`

- Create `<AnimatedPage>` wrapper using `motion.div` with `AnimatePresence` — fade-in + slide-up on mount, fade-out on unmount.
- Wrap each `<Route>` element's page component in `<AnimatedPage>`.
- Add `useLocation` key to `<Routes>` for transition triggers.
- Add stagger animation utility: `<StaggerContainer>` and `<StaggerItem>` wrappers for card/list layouts.

## 2. Expanded Settings Page

**File:** `src/pages/SystemConfiguration.tsx` (modify)

The existing `/settings` page already has Standards + Risk Matrix tabs. Add:

- **Theme Toggle tab:** Light/Dark mode switch using Tailwind's `class` strategy. Toggle `dark` class on `<html>`. Persist to `localStorage`.
- **Language/RTL tab:** Already exists in `UserMenu` but replicate here with a prominent toggle. The existing `LanguageContext` already handles `dir` attribute on `<html>`.
- **File Upload tab: Two drag-and-drop zones (Custom Risk Matrix CSV, Custom References CSV).** 
  **CRITICAL REQUIREMENT: You MUST install and use** `papaparse` **to read and parse these CSV files. Under no circumstances should you use native string splitting (e.g., split by comma/newline), because our HSE engineering descriptions contain complex formatting, commas, and line breaks that native methods will corrupt. Display the safely parsed preview in a table.**

## 3. TypewriterReveal Component

**File:** `src/components/TypewriterReveal.tsx` (new)

- Props: `text: string`, `speed?: number` (ms per char, default 15), `onComplete?: () => void`
- Uses `useState` + `useEffect` with `setInterval` to reveal characters incrementally.
- Renders with a blinking cursor indicator while typing.
- Can be integrated into results components where AI output is displayed.

## 4. Custom "Start Study" Button

**File:** `src/components/StartStudyButton.tsx` (new)

The provided code uses `styled-components` which is not installed and conflicts with our Tailwind-first approach. Instead:

- Convert the button's visual design to a **Tailwind + inline CSS** component preserving the 3D flip animation, glow effects, and character animation.
- Props: `onClick`, `loading`, `disabled`, `label` (default "GET STARTED").
- Use CSS `@keyframes` in `src/index.css` for the complex animations (cover-open/close, char-in/out, wave, sparks, spin).
- Integrate as the primary action button in HAZID, HAZOP, LOPA, and QRA form submit areas, replacing the current submit buttons.

## Files Summary


| Action | File                                                                        |
| ------ | --------------------------------------------------------------------------- |
| Create | `src/components/AnimatedPage.tsx` — Page transition + stagger wrappers      |
| Create | `src/components/TypewriterReveal.tsx` — Letter-by-letter reveal             |
| Create | `src/components/StartStudyButton.tsx` — Custom 3D animated button           |
| Modify | `src/App.tsx` — Wrap routes with AnimatePresence + AnimatedPage             |
| Modify | `src/pages/SystemConfiguration.tsx` — Add Theme, Language, File Upload tabs |
| Modify | `src/index.css` — Add keyframes for StartStudyButton animations             |
| Modify | `src/components/HazidForm.tsx` — Use StartStudyButton                       |
| Modify | `src/components/HazopForm.tsx` — Use StartStudyButton                       |
| Modify | `src/components/LopaForm.tsx` — Use StartStudyButton                        |
| Modify | `src/components/QraForm.tsx` — Use StartStudyButton                         |


## Technical Notes

- **No new dependencies**: framer-motion already installed; CSV parsing via native `FileReader` + string split (per export strategy memory — dependency-free).
- **styled-components NOT installed**: The button will be rebuilt in Tailwind + raw CSS keyframes to match the project's styling approach.
- **Theme toggle**: Uses Tailwind `darkMode: ["class"]` (already configured). Toggle adds/removes `dark` class on `<html>`.
- **RTL**: Already handled by `LanguageContext` setting `dir` attribute. Settings page just surfaces the toggle more prominently.