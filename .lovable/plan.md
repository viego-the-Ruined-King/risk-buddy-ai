

# Enterprise-Ready UI/UX & Pricing Overhaul

## Overview
Five changes to make the app enterprise-ready: rename AI buttons, add compliance disclaimers, add data security messaging, build a pricing page, and add testimonial social proof.

## 1. UX/Terminology Overhaul — Rename "Generate" Buttons

**Files:** `src/i18n/en.ts`, `src/i18n/ar.ts`

Update all translation keys:
- `forms.hazid.generateStudy`: "Generate HAZID Study" → "Draft HAZID Analysis"
- `forms.hazid.generating`: → "Drafting HAZID Analysis..."
- `forms.hazop.generateStudy`: → "Initialize HAZOP Study"
- `forms.hazop.generatingStudy`: → "Initializing HAZOP Study..."
- `forms.lopa.generateLopa`: → "Draft LOPA Analysis"
- `forms.lopa.generatingLopa`: → "Drafting LOPA Analysis..."
- `forms.qra.generateStudy` / `qra.generating`: → "Initialize QRA Study" / "Initializing..."
- `results.risk.generateMore` / `results.hazid.generateMore` / `results.hazop.generateMore`: → "Suggest 10 More" / "Suggest 15 More" / "Suggest 10 More"
- Same changes for Arabic translations

**AI-Assisted Hint:** Add a `Tooltip` on each submit button in `HazidForm`, `HazopForm`, `LopaForm`, `QraForm` wrapping the button with text: "AI-Assisted Draft. Please review and approve."
- Also add the same tooltip text as a small `<p>` below the button for mobile visibility.

## 2. LOPA Engineering Disclaimer Banner

**File:** `src/components/LopaForm.tsx` (or `src/pages/LopaStudy.tsx` at the top)

Add an `Alert` component with `variant="default"` styled with amber/warning colors at the top of the LOPA page:
```
⚠ Engineering Disclaimer: The Probability of Failure on Demand (PFD) and failure rate values provided are estimations based on standard databases. All values must be reviewed, verified, and certified by a qualified Process Safety Engineer prior to final reporting.
```
Use `AlertTriangle` icon, amber background (`bg-amber-500/10 border-amber-500/50 text-amber-200`).

Add translation keys for both English and Arabic.

## 3. Data Security Notice on File Upload

**File:** `src/components/FileUpload.tsx`

After the file upload drop zone (after the `</div>` closing the drag area, around line 186), add:
```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
  <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
  <span>Enterprise-Grade Security: Your documents are processed temporarily in-memory and instantly deleted after analysis. We strictly do not store your files or train our AI models on your proprietary data.</span>
</div>
```
Add translation keys for both languages.

## 4. Pricing Page (`/pricing`)

**New file:** `src/pages/Pricing.tsx`

- Monthly/Annual toggle (annual shows "Save 16%")
- 3 tier cards with glassmorphism dark-mode styling:
  - **Consultant / Freelance** — $149/mo ($125/mo annual). 1 User, 10 studies/mo, HAZID & HAZOP, PDF & Excel exports.
  - **Boutique EPC / Agency** — $699/mo ($587/mo annual). "Most Popular" badge. 5 Users, Unlimited studies, All modules, Custom Risk Matrix, Priority Support.
  - **Enterprise** — Custom Pricing. Unlimited users, On-Premise/Private Cloud, SLA & NDA, API Integration. "Contact Sales" CTA.
- Use `Check` icon for feature lists, emerald accent for the featured card ring.

**Modify:** `src/App.tsx` — Add `/pricing` as a public route (no `ProtectedRoute`).
**Modify:** `src/components/AppSidebar.tsx` — Optionally add a "Pricing" link in the footer area.
**Modify:** `src/i18n/en.ts`, `src/i18n/ar.ts` — Add pricing translation keys.

## 5. Testimonials / Social Proof Section

**New file:** `src/components/Testimonials.tsx`

A section titled "Trusted by Process Safety Experts" with 3 placeholder testimonial cards in a responsive grid. Each card has:
- Placeholder avatar (initials circle)
- Name, Title, Company
- Quote text
- Star rating

Styled with glassmorphism cards matching the app's dark theme.

**Modify:** `src/pages/Pricing.tsx` — Place the testimonials section below the pricing cards on the pricing page (since there's no separate landing page — the root `/` goes straight to the Risk Assessment module).

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/i18n/en.ts` — Rename generate labels, add disclaimer/security/pricing translations |
| Modify | `src/i18n/ar.ts` — Same for Arabic |
| Modify | `src/components/FileUpload.tsx` — Add security notice |
| Modify | `src/pages/LopaStudy.tsx` — Add engineering disclaimer alert |
| Modify | `src/components/HazidForm.tsx` — Add AI-assisted tooltip hint |
| Modify | `src/components/HazopForm.tsx` — Add AI-assisted tooltip hint |
| Modify | `src/components/LopaForm.tsx` — Add AI-assisted tooltip hint |
| Modify | `src/components/QraForm.tsx` — Add AI-assisted tooltip hint |
| Modify | `src/components/RiskAssessmentForm.tsx` — Add AI-assisted tooltip hint |
| Create | `src/pages/Pricing.tsx` — Full pricing page with toggle + 3 tiers + testimonials |
| Create | `src/components/Testimonials.tsx` — Social proof component |
| Modify | `src/App.tsx` — Add `/pricing` route |

