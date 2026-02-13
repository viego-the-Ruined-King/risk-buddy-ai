

# Quantitative Risk Assessment (QRA) Study Page - EGPC-PSM-GL-008

## Overview
Build a new QRA Study module following the EGPC-PSM-GL-008 "Quantitative Risk Assessment (QRA) Guideline" structure. The module will guide users through the full QRA methodology: scope definition, assumption register, hazard/failure case identification, consequence assessment, frequency assessment, risk analysis (Individual and Societal Risk), risk evaluation against EGPC tolerance criteria, and ALARP demonstration.

## Architecture

### New Files to Create
1. `src/pages/QraStudy.tsx` - Main QRA study page
2. `src/components/QraForm.tsx` - Multi-step input form (Scope, Assumptions, Facility Data)
3. `src/components/QraResults.tsx` - Results display with failure cases, consequence summary, risk analysis
4. `src/components/QraRiskContourChart.tsx` - LSIR/IRPA risk visualization using Recharts
5. `src/components/QraFnCurveChart.tsx` - FN Curve (Societal Risk) chart using Recharts
6. `src/components/QraToleranceCriteria.tsx` - EGPC Annex E tolerance criteria display
7. `src/components/QraAlarpDemonstration.tsx` - ALARP demonstration section
8. `supabase/functions/qra-study/index.ts` - Edge function for AI-powered QRA generation
9. `src/utils/exportQraToExcel.ts` - CSV/Excel export utility

### Files to Modify
1. `src/App.tsx` - Add `/qra` route
2. `src/components/AppSidebar.tsx` - Add QRA navigation item
3. `src/components/MobileBottomNav.tsx` - Add QRA to mobile nav
4. `src/i18n/en.ts` - Add English translations
5. `src/i18n/ar.ts` - Add Arabic translations
6. `src/components/OnboardingGuide.tsx` - Add QRA step to onboarding

### Database
- Create `qra_studies` table with RLS policies (stores study data as JSONB)

## Detailed Design

### 1. QRA Form (`QraForm.tsx`) - Multi-Tab Input
Following EGPC-PSM-GL-008 Sections 8.1-8.2, the form has 4 tabs:

**Tab 1 - Study Details & Scope (Section 8.1)**
- Study Title
- Facility Description (type, location, materials handled)
- QRA Objective (legal requirement, engineering, safety case, decision support)
- Types of Risk to Evaluate (Individual, Societal, or both)
- Boundaries (facilities/personnel included/excluded)
- Lifecycle Phase (Greenfield Concept / FEED / Detailed Engineering / Brownfield)
- File upload for P&IDs, plot plans, PFDs

**Tab 2 - Facility & Process Data (Section 8.3)**
- Hazardous Materials Inventory (material, phase, quantity, conditions)
- Isolatable Sections description
- Equipment list (vessels, piping, tanks, pipelines)
- Operating parameters (pressure, temperature, flow)
- Manning/population data (onsite workers, nearby public)

**Tab 3 - Assumption Register (Section 8.2)**
- Hole sizes for failure cases (Small/Medium/Large/Rupture per 8.3.2)
- Weather/meteorological data
- Ignition probability assumptions
- Indoor/outdoor vulnerability assumptions
- Software/model to be used
- Height of interest for consequences

**Tab 4 - Risk Criteria (Annex E)**
- Individual Risk Tolerance (IRPA): default 10^-3 workers, 10^-4 public
- Societal Risk (FN Curve) criteria
- Broadly Acceptable criterion: 10^-6/yr

### 2. Edge Function (`qra-study/index.ts`)
The AI generates a structured QRA output following the methodology:

**Output Structure:**
```text
{
  "study_summary": { objective, scope, facility_description },
  "assumption_register": [ { category, assumption, reference } ],
  "failure_cases": [
    {
      "id": "FC-001",
      "isolatable_section": "...",
      "equipment": "...",
      "material": "...",
      "phase": "Gas/Liquid/Two-Phase",
      "hole_sizes": [
        { "category": "Small", "diameter_mm": 5, "rate_kg_s": ... },
        { "category": "Medium", "diameter_mm": 25, "rate_kg_s": ... },
        { "category": "Large", "diameter_mm": 100, "rate_kg_s": ... },
        { "category": "Rupture", "diameter_mm": 200, "rate_kg_s": ... }
      ],
      "frequency_per_year": ...,
      "frequency_source": "IOGP 434-1 / OGP / Company data"
    }
  ],
  "consequence_assessment": [
    {
      "failure_case_id": "FC-001",
      "hole_size": "Medium",
      "outcomes": [
        {
          "type": "Jet Fire",
          "probability": 0.065,
          "effects": {
            "flame_length_m": ...,
            "distance_1_6kw": ...,
            "distance_4_7kw": ...,
            "distance_12_5kw": ...,
            "distance_37_5kw": ...
          }
        },
        {
          "type": "Flash Fire",
          "probability": 0.04,
          "effects": { "lfl_distance_m": ... }
        },
        {
          "type": "VCE",
          "probability": 0.02,
          "effects": {
            "distance_70mbar": ...,
            "distance_200mbar": ...,
            "distance_500mbar": ...
          }
        },
        {
          "type": "Toxic Dispersion",
          "probability": 1.0,
          "effects": {
            "idlh_distance_m": ...,
            "erpg2_distance_m": ...,
            "erpg3_distance_m": ...
          }
        }
      ]
    }
  ],
  "risk_analysis": {
    "individual_risk": {
      "irpa_workers": [ { "group": "...", "irpa_value": ..., "status": "Acceptable/ALARP/Intolerable" } ],
      "irpa_public": [ { "location": "...", "irpa_value": ..., "status": "..." } ],
      "lsir_contours": [ { "risk_level": 1e-4, "description": "..." } ]
    },
    "societal_risk": {
      "pll": ...,
      "fn_curve_data": [ { "n": 1, "f": ... }, { "n": 10, "f": ... } ]
    }
  },
  "risk_evaluation": {
    "overall_status": "Acceptable / ALARP / Intolerable",
    "major_risk_contributors": [ "..." ],
    "comparison_to_criteria": "..."
  },
  "alarp_demonstration": {
    "risk_reduction_measures": [
      {
        "measure": "...",
        "type": "Prevention/Mitigation",
        "hierarchy": "Eliminate/Substitute/Engineering/Administrative/PPE",
        "risk_reduction_factor": ...,
        "cost_estimate": "...",
        "standard_reference": "..."
      }
    ],
    "residual_risk_status": "ALARP demonstrated"
  },
  "recommendations": [ { "id": "REC-001", "description": "...", "priority": "High/Medium/Low", "reference": "..." } ]
}
```

### 3. Results Display (`QraResults.tsx`)
Organized in expandable sections following the QRA report structure:

- **Study Summary** - Header card with objective, scope, facility
- **Assumption Register** - Table per Section 8.2
- **Failure Cases** - Table with isolatable sections, hole sizes, frequencies (per 8.3)
- **Consequence Assessment** - Table with physical effects distances (per 8.4, Annex D Table D1)
- **Risk Analysis Charts:**
  - IRPA bar chart comparing worker groups against tolerance criteria lines
  - FN Curve (log-log scatter) with EGPC tolerance criteria overlay (Annex E)
  - Risk contribution pie chart showing major contributors
- **Risk Evaluation** - Status card (Acceptable/ALARP/Intolerable) per Annex E
- **ALARP Demonstration** - Risk reduction measures table with hierarchy of controls
- **Recommendations** - Prioritized action items with standard references

### 4. Visualization Components

**IRPA Chart (`QraRiskContourChart.tsx`)**
- Horizontal bar chart using Recharts
- Worker groups on Y-axis, IRPA values on X-axis (log scale)
- Red line at 10^-3 (maximum tolerable for workers)
- Green line at 10^-6 (broadly acceptable)
- Color-coded bars: red (intolerable), yellow (ALARP), green (acceptable)

**FN Curve (`QraFnCurveChart.tsx`)**
- Log-log scatter chart using Recharts
- N (fatalities) on X-axis, F (cumulative frequency) on Y-axis
- EGPC tolerance criteria lines: intolerable boundary and broadly acceptable boundary
- ALARP region shaded between the two lines

### 5. Database Table

```sql
CREATE TABLE qra_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  facility_description TEXT,
  objective TEXT,
  lifecycle_phase TEXT,
  scope_boundaries TEXT,
  risk_types TEXT,
  assumption_register JSONB DEFAULT '[]',
  failure_cases JSONB DEFAULT '[]',
  consequence_assessment JSONB DEFAULT '[]',
  risk_analysis JSONB DEFAULT '{}',
  risk_evaluation JSONB DEFAULT '{}',
  alarp_demonstration JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies (same pattern as other study tables)
ALTER TABLE qra_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own QRA studies" ON qra_studies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own QRA studies" ON qra_studies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own QRA studies" ON qra_studies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own QRA studies" ON qra_studies
  FOR DELETE USING (auth.uid() = user_id);
```

### 6. Navigation & Translations
- Add QRA route `/qra` to `App.tsx`
- Add QRA nav item with `BarChart3` icon to sidebar and mobile nav
- Add full English and Arabic translations for all QRA form fields, results labels, chart legends, and tolerance criteria descriptions
- Add QRA step to the onboarding guide

### 7. Export (`exportQraToExcel.ts`)
Export the full QRA report to CSV with sections:
- Study Details
- Assumption Register
- Failure Cases with hole sizes and frequencies
- Consequence Assessment (physical effects distances per Annex D Table D1)
- Risk Analysis (IRPA values, PLL, FN data)
- Risk Evaluation summary
- ALARP recommendations

## Implementation Sequence
1. Database migration (create `qra_studies` table with RLS)
2. Edge function (`qra-study/index.ts`)
3. QRA form component
4. QRA results + chart components
5. QRA page assembly
6. Navigation, translations, export utility
7. Deploy edge function and test

