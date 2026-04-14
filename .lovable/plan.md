

# Refactor Auth Page — Split-Screen Login with Video-to-Image Transition

## Overview
Replace the current centered-card login page with a cinematic split-screen layout: left panel shows the uploaded video (auto-playing, then fading to the logo image), right panel contains a clean white-background login form. Preserves all existing auth logic (signIn, signUp, validation, redirects, language toggle).

## Layout Structure

```text
┌─────────────────────────────────────────────────┐
│  Dark page background (min-h-screen, flex center)│
│  ┌──────────────────┬──────────────────┐        │
│  │  LEFT (50%)      │  RIGHT (50%)     │        │
│  │  Video → Image   │  White form      │        │
│  │  + text overlays │  Logo, inputs,   │        │
│  │  + gradient      │  actions, footer │        │
│  └──────────────────┴──────────────────┘        │
│  (rounded-3xl, shadow, overflow-hidden)          │
└─────────────────────────────────────────────────┘
```

On mobile: stacks vertically (left panel shorter, right panel full).

## Changes

### 1. Copy uploaded assets into project
- `user-uploads://Logo.jpg` → `src/assets/wolf-logo.jpg`
- `user-uploads://W.O.L.F_2.mp4` → `public/videos/wolf-intro.mp4`

Video goes to `public/` (large binary, no bundling needed). Logo goes to `src/assets/` for import.

### 2. Add a serif font
Add `Playfair Display` to the Google Fonts import in `src/index.css` and register it in `tailwind.config.ts` as `font-serif`.

### 3. Rewrite `src/pages/Auth.tsx`

**State additions:**
- `isVideoFinished` — flips on `<video onEnded>`
- `showPassword` — toggles password visibility (eye icon)

**Left column:**
- `relative overflow-hidden` container, dark background
- `<video>` with `autoPlay muted playsInline` covering the container; on `onEnded` → fade out via `opacity-0 transition-opacity duration-1000`
- `<img>` of the W.O.L.F logo positioned absolutely behind/under the video, always visible
- Bottom gradient overlay (`bg-gradient-to-t from-black/70`)
- Text overlays (absolute, white):
  - Top-left: small-caps "A WISE QUOTE" + thin `<hr>`
  - Bottom-left: serif heading "Get Everything You Want"
  - Paragraph below heading

**Right column:**
- `bg-white` (forced light panel regardless of dark mode), rounded corners
- Centered logo placeholder at top (W.O.L.F icon or ShieldCheck)
- "Welcome Back" heading in serif font
- Gray subtitle
- Email input with `bg-gray-50`, minimal border
- Password input with eye toggle icon (Eye/EyeOff from lucide-react)
- "Remember me" checkbox + "Forgot Password" link row
- Full-width black "Sign In" button
- Full-width white-bordered "Sign In with Google" button (visual only for now)
- Footer: "Don't have an account? **Sign Up**" toggle

**Preserved logic:** All existing `handleSubmit`, `validateInputs`, `signIn`/`signUp`, toast messages, error display, language toggle, and auth redirect logic remain unchanged.

### 4. Responsive behavior
- Desktop (`md:` and up): `grid grid-cols-2` side by side
- Mobile: single column stack, left media panel has `h-48` or `h-64`, right panel takes remaining space

### Files Modified/Created
| Action | File |
|--------|------|
| Copy | `user-uploads://Logo.jpg` → `src/assets/wolf-logo.jpg` |
| Copy | `user-uploads://W.O.L.F_2.mp4` → `public/videos/wolf-intro.mp4` |
| Modify | `src/index.css` — Add Playfair Display font import |
| Modify | `tailwind.config.ts` — Add `serif` font family |
| Rewrite | `src/pages/Auth.tsx` — Full split-screen layout |

