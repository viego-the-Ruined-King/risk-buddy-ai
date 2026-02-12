

# HAZID Study Alignment with EGPC-PSM-GL-001 and Annex C Worksheet

## Overview
Restructure the HAZID study results table to exactly match the Annex C - HAZID Worksheet Template from EGPC-PSM-GL-001 guideline. This includes adding new data fields, restructuring the table with multi-level headers and Risk Evaluation sub-columns (L, S, RR), and updating the AI prompt to generate data matching the new format following ISO 17776 Hazard List guidewords.

## Changes Required

### 1. Update HazidHazard Data Model (src/pages/HazidStudy.tsx)
Add new fields to match Annex C columns:
- `category` (Safety / Environment / Asset / Reputation)
- `safeguard_barrier_type` (Hardware, Software, Human, Process Containment, etc.)
- `isd_opportunities` (Inherently Safer Design opportunities)
- `remarks`
- Rename/clarify existing fields to match Annex C terminology

### 2. Restructure HazidResults Table (src/components/HazidResults.tsx)
Rebuild the desktop table to match the exact Annex C worksheet layout with:
- **Multi-level header rows**: A top header row with merged cells for "Risk Evaluation" spanning L, S, RR sub-columns
- **Three Risk Evaluation column groups**: Initial, Current, and Residual - each with L (Likelihood number), S (Severity letter), RR (Risk Ranking) sub-columns
- **Column order per Annex C**:
  1. Hazard Ref. No.
  2. Hazard/Issue (Guidewords)
  3. Hazard Source / Activity
  4. Threat (Causes)
  5. Top Event
  6. Credible Consequence(s)
  7. Category
  8. Risk Evaluation - Initial (L | S | RR)
  9. Initial Risk (Worst Credible) - color-coded
  10. Existing Controls
  11. Safeguard (Barrier) Type
  12. Risk Evaluation - Current (L | S | RR)
  13. Current Risk - color-coded
  14. Recommendations
  15. ISD Opportunities
  16. Action Party
  17. Risk Evaluation - Residual (L | S | RR)
  18. Residual Risk - color-coded
  19. Remarks

- Color-code risk cells: RED for HIGH, ORANGE for M/H ALARP, YELLOW for M ALARP, GREEN for LOW
- Update mobile card view to show the new fields

### 3. Update Edge Function Prompt (supabase/functions/hazid-study/index.ts)
- Add EGPC-PSM-GL-001 as the reference standard in the prompt header
- Include ISO 17776 Hazard List categories as guideword reference
- Update output fields to include: `category`, `safeguard_barrier_type`, `isd_opportunities`, `remarks`
- Update risk format to output separate L (number), S (letter), and RR (combined) values
- Add risk ranking labels: HIGH, M/H ALARP, M ALARP, LOW based on the EGPC Risk Matrix

### 4. Update Translation Files (src/i18n/en.ts, src/i18n/ar.ts)
Add new translation keys for all new column headers:
- `category`, `safeguardBarrierType`, `isdOpportunities`, `remarks`
- `threat`, `credibleConsequences`, `worstCredible`
- Risk level labels: HIGH, M/H ALARP, M ALARP, LOW
- Sub-column headers: L, S, RR

### 5. Update CSV Export (src/utils/exportHazidToExcel.ts)
Add the new columns to the CSV export to match the Annex C format with all sub-columns for Risk Evaluation.

### 6. Update Hazid Study Database Schema
The `hazid_studies` table stores hazards as JSONB, so no schema migration is needed - the new fields will be included in the JSON structure automatically.

## Technical Details

### Risk Matrix Color Coding (per EGPC)
- **HIGH** (Red): L x S combinations like 3A, 4A, 5A, 6A, 4B, 5B, 6B, 5C, 6C, 6D
- **M/H ALARP** (Orange): 2A, 3B, 4C, 5D, 6E, 3C, 4D, 5E, 6F
- **M ALARP** (Yellow): 1A, 2B, 2C, 3D, 4E, 5F, 1B, 2D, 3E, 4F
- **LOW** (Green): 1C, 1D, 1E, 1F, 2E, 2F, 3F

### ISO 17776 Hazard List Integration
The AI prompt will reference the full ISO 17776 hazard categories (H-1 through H-30) covering:
Hydrocarbons, Refined Hydrocarbons, Other Flammable Materials, Explosives, Pressure Hazards, Height Hazards, Objects Under Stress, Dynamic Situations, Environmental Hazards, Hot/Cold Surfaces, Open Flame, Electricity, Radiation, Asphyxiates, Toxic Gas/Liquid/Solid, Corrosive Substances, Biological Hazards, Ergonomic, Psychological, Security, Natural Resources, Medical, and Noise.

### Files to Modify
1. `src/pages/HazidStudy.tsx` - Update HazidHazard interface
2. `src/components/HazidResults.tsx` - Rebuild table layout
3. `supabase/functions/hazid-study/index.ts` - Update AI prompt
4. `src/i18n/en.ts` - Add English translations
5. `src/i18n/ar.ts` - Add Arabic translations
6. `src/utils/exportHazidToExcel.ts` - Update export columns

