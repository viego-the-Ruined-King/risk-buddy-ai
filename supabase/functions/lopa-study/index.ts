import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EGPC-PSM-GL-015 Reference Data

// Table 1 - TMEL by Severity Level (per year)
const TMEL_BY_SEVERITY = {
  'Disastrous': 1e-6,    // 1.00E-06
  'Catastrophic': 1e-5,  // 1.00E-05
  'Major': 1e-4,         // 1.00E-04
  'Serious': 1e-3,       // 1.00E-03
  'Minor': 1e-2,         // 1.00E-02
  'Notable': 1e-1,       // 1.00E-01
};

// Annex A - Initiating Event Frequencies (per year)
const INITIATING_EVENT_FREQUENCIES = {
  // Process Equipment Failures
  'Control valve failure (dangerous)': 0.1,
  'Control valve failure (spurious)': 0.1,
  'Pressure regulator failure (dangerous)': 0.1,
  'Pressure regulator failure (spurious)': 0.1,
  'Basic process control loop failure': 0.1,
  'Basic process control loop failure - small system': 0.1,
  'Cooling water failure (single pump)': 0.1,
  'Cooling water failure (dual pump)': 0.01,
  'Loss of instrument air': 0.1,
  'Loss of electric power': 0.1,
  'Loss of steam': 0.1,
  'Pump failure (single pump)': 0.1,
  'Pump failure (dual pump)': 0.01,
  'Compressor failure': 0.1,
  'Heat exchanger leak (internal)': 0.01,
  'Heat exchanger tube rupture': 0.001,
  'Gasket/packing blowout': 0.01,
  'Turbine/engine overspeed': 0.01,
  'Spontaneous combustion in vessels': 0.01,
  
  // Human Error
  'Operator error during routine operation': 0.1,
  'Operator error during non-routine operation': 1.0,
  'Maintenance error': 0.1,
  'Loading/unloading error': 0.01,
  
  // External Events
  'Third party intervention (vehicle impact)': 0.01,
  'Lightning strike (direct)': 0.001,
  'Earthquake (major)': 0.0001,
  'Flooding': 0.01,
  'High wind/hurricane': 0.01,
  
  // Piping Failures
  'Piping leak (10% of pipe diameter)': 0.001,
  'Piping rupture (full bore)': 0.0001,
  'Hose failure': 0.01,
  'Flange leak': 0.01,
  
  // Vessel/Tank Failures
  'Atmospheric tank failure': 0.0001,
  'Pressure vessel failure': 0.00001,
  'Tank overfill': 0.01,
  'Tank roof collapse': 0.001,
  
  // Relief Device Failures
  'PRV fails to open': 0.01,
  'PRV opens spuriously': 0.01,
  'Rupture disk fails to open': 0.001,
  'Rupture disk spurious failure': 0.01,
  
  // Level/Flow Control
  'Level control loop failure': 0.1,
  'Flow control loop failure': 0.1,
  'Temperature control loop failure': 0.1,
  'Pressure control loop failure': 0.1,
  
  // Miscellaneous
  'External fire': 0.01,
  'Corrosion-induced failure': 0.01,
  'Erosion-induced failure': 0.01,
  'Fatigue failure': 0.001,
  'Thermal expansion damage': 0.01,
  'Waterhammer': 0.01,
};

// Annex B - IPL PFD Values
const IPL_PFD_VALUES = {
  // Passive IPLs
  'Dike/containment': 0.01,
  'Underground drainage system': 0.01,
  'Open vent (no valve)': 0.01,
  'Flame arrestor': 0.01,
  'Blast wall/barrier': 0.01,
  'Fireproofing': 0.01,
  'Overflow line (no impediment)': 0.001,
  'Overflow line (possible impediment)': 0.1,
  'Dikes, berms, bunds': 0.01,
  'Drainage to remote impoundment': 0.01,
  'Permanent mechanical stop': 0.01,
  'Fire-resistant insulation': 0.01,
  
  // Active IPLs - BPCS
  'BPCS control loop': 0.1,
  'Safety control loop': 0.1,
  'Safety interlock': 0.1,
  
  // Active IPLs - SIS
  'SIS SIL-1': 0.1,
  'SIS SIL-2': 0.01,
  'SIS SIL-3': 0.001,
  'SIS SIL-4': 0.0001,
  
  // Active IPLs - Relief Devices
  'PRV spring-operated (no block valve)': 0.01,
  'PRV spring-operated (with block valve)': 0.1,
  'Dual PRVs (single isolation)': 0.01,
  'Dual PRVs (common isolation)': 0.1,
  'Pilot-operated PRV': 0.01,
  'Rupture disk': 0.01,
  'Rupture disk + PRV series': 0.01,
  
  // Active IPLs - Human Response
  'Operator response to alarm (well-designed)': 0.1,
  'Operator response to alarm (excellent conditions)': 0.01,
  'Operator routine inspection (continuous)': 0.1,
  'Operator routine inspection (hourly)': 0.1,
  
  // Active IPLs - Detection/Suppression
  'Fire detection system': 0.1,
  'Gas detection system': 0.1,
  'Automatic fire suppression': 0.1,
  'Deluge system': 0.1,
  
  // Active IPLs - Mechanical
  'Check valve': 0.1,
  'Pressure reducing regulator': 0.1,
  'Excess flow valve': 0.1,
  'Emergency isolation valve (EIV)': 0.1,
  'Mechanical overspeed trip': 0.1,
};

// Annex C - Conditional Modifiers
const CONDITIONAL_MODIFIERS = {
  // Time at Risk
  time_at_risk: {
    'Continuous operation': 1.0,
    'Intermittent (50% of time)': 0.5,
    'Intermittent (10% of time)': 0.1,
    'Batch operation (1 day/month)': 0.033,
    'Infrequent (<1% of time)': 0.01,
  },
  
  // Probability of Ignition (for flammable releases)
  ignition_probability: {
    'Continuous ignition source present': 1.0,
    'Process area with hot work': 0.3,
    'Process area without hot work': 0.1,
    'Well-ventilated open area': 0.03,
    'Remote area, no ignition sources': 0.01,
    'LNG/LPG release (immediate ignition)': 0.08,
    'LNG/LPG release (delayed ignition)': 0.04,
    'Gasoline/naphtha release': 0.03,
    'Diesel/kerosene release': 0.01,
    'Heavy oil release': 0.003,
  },
  
  // Vulnerability (Probability of Injury/Fatality)
  vulnerability: {
    'Direct exposure, no escape': 1.0,
    'Partially enclosed area': 0.5,
    'Open area, limited escape': 0.3,
    'Open area, good escape routes': 0.1,
    'Control room with HVAC protection': 0.01,
    'Remote personnel': 0.001,
  },
};

// SIL Level Mapping per EGPC Table 3
const SIL_MAPPING = {
  'SIL-1': { min_pfd: 0.01, max_pfd: 0.1, rrf_min: 10, rrf_max: 100 },
  'SIL-2': { min_pfd: 0.001, max_pfd: 0.01, rrf_min: 100, rrf_max: 1000 },
  'SIL-3': { min_pfd: 0.0001, max_pfd: 0.001, rrf_min: 1000, rrf_max: 10000 },
  'SIL-4': { min_pfd: 0.00001, max_pfd: 0.0001, rrf_min: 10000, rrf_max: 100000 },
};

function determineSIL(pfd: number): string {
  if (pfd >= 0.1) return 'None';
  if (pfd >= 0.01) return 'SIL-1';
  if (pfd >= 0.001) return 'SIL-2';
  if (pfd >= 0.0001) return 'SIL-3';
  return 'SIL-4';
}

function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 5000);
}

function extractJsonCandidate(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock?.[1]) return codeBlock[1].trim();

  const startIdx = raw.indexOf('{');
  const endIdx = raw.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return raw.slice(startIdx, endIdx + 1).trim();
  }

  return raw.trim();
}

function repairJsonCandidate(input: string): string {
  let s = input.replace(/\r\n/g, "\n");

  // Remove control chars but keep \t/\n so we can still use line-based repairs.
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Remove trailing commas before closing brackets/braces.
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Insert missing commas between properties (common LLM mistake):
  //   "is_valid": false\n      "validation_notes": "..."
  s = s.replace(
    /(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|"[^"\n]*"|\]|\})\s*\n(\s*")/g,
    "$1,\n$2"
  );

  // Same idea, but when the next key is on the same line.
  s = s.replace(
    /(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|"[^"\n]*"|\]|\})\s+("(?=[^"]+"\s*:))/g,
    "$1, $2"
  );

  return s.trim();
}

function parseJsonFromAiContent(content: string): any {
  const candidate = extractJsonCandidate(content);

  try {
    return JSON.parse(candidate);
  } catch {
    const repaired = repairJsonCandidate(candidate);
    try {
      return JSON.parse(repaired);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      const m = msg.match(/position\s+(\d+)/i);
      if (m) {
        const pos = Number(m[1]);
        const start = Math.max(0, pos - 140);
        const end = Math.min(repaired.length, pos + 140);
        console.log('JSON parse context:', repaired.slice(start, end));
      }
      throw e2;
    }
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const {
      hazop_study_id,
      hazop_deviation_id,
      hazop_node_id,
      hazop_deviation,
      hazop_causes,
      hazop_consequences,
      hazop_existing_safeguards,
      hazop_initial_risk,
      scenario_title,
      equipment_number,
      consequence_category,
      severity_level,
      user_provided_initiating_events,
      user_provided_ipls,
      user_provided_enabling_conditions,
      user_provided_conditional_modifiers,
    } = requestData;

    // Build LOPA analysis prompt following EGPC-PSM-GL-015 methodology
    const systemPrompt = `You are an advanced Process Safety Analysis engine specialized in Layer of Protection Analysis (LOPA).

You SHALL strictly follow the Egyptian General Petroleum Corporation (EGPC) guideline:
"EGPC-PSM-GL-015 – Layer of Protection Analysis (LOPA) Guideline", Revision 0, Nov 2022,
including all definitions, methodology, equations, assumptions, data tables, and annexes.

Your role is to generate a LOPA study based on HAZOP scenario input.

=== EGPC-PSM-GL-015 REFERENCE DATA ===

TABLE 1 - TMEL BY SEVERITY (per year):
${Object.entries(TMEL_BY_SEVERITY).map(([k, v]) => `- ${k}: ${v.toExponential(2)}`).join('\n')}

ANNEX A - INITIATING EVENT FREQUENCIES (per year):
${Object.entries(INITIATING_EVENT_FREQUENCIES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

ANNEX B - IPL PFD VALUES:
${Object.entries(IPL_PFD_VALUES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

ANNEX C - CONDITIONAL MODIFIERS:

Time at Risk:
${Object.entries(CONDITIONAL_MODIFIERS.time_at_risk).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Ignition Probability:
${Object.entries(CONDITIONAL_MODIFIERS.ignition_probability).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Vulnerability:
${Object.entries(CONDITIONAL_MODIFIERS.vulnerability).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

SIL DETERMINATION (Table 3):
- SIL-1: 0.01 ≤ PFD < 0.1 (RRF: 10-100)
- SIL-2: 0.001 ≤ PFD < 0.01 (RRF: 100-1,000)
- SIL-3: 0.0001 ≤ PFD < 0.001 (RRF: 1,000-10,000)
- SIL-4: 0.00001 ≤ PFD < 0.0001 (RRF: 10,000-100,000)

=== LOPA METHODOLOGY (EGPC Section 7) ===

Apply the official EGPC LOPA methodology in the following exact order:
1. Scenario definition based on HAZOP output
2. Consequence category and severity
3. Target Mitigated Event Likelihood (TMEL) selection (per EGPC Table 1)
4. Initiating Events identification and frequency (Annex A)
5. Identification and validation of Independent Protection Layers (IPLs) (Annex B)
6. Enabling Conditions (Section 7.6)
7. Conditional Modifier (Annex C)
8. Intermediate Event Likelihood (IEL) calculation
9. Comparison of IEL versus TMEL
10. SIL requirement calculation (if applicable)

=== IEL CALCULATION (Section 7.8) ===

IEL = IEF × Π(PFD of IPLs) × PEC × PCM

Where:
- IEL = intermediate event likelihood
- IEF = Initiating Event Frequency
- PFD = Probability of Failure on Demand for each IPL
- PEC = probability of enabling condition
- PCM = probability of conditional modifiers

If IEL_total > TMEL:
- PFD_SIF = TMEL / IEL_total (before SIF credit)
- Select highest SIL among Safety, Environmental, Financial

=== IMPORTANT RULES ===
- Only credit safeguards that meet IPL independence criteria (Section 7.5)
- All PFD values MUST come from Annex B or justified site-specific data
- All initiating event frequencies MUST come from Annex A or justified sources
- Training, procedures, maintenance alone are NOT IPLs (Table 2)
- BPCS cannot be both initiating event and IPL for same scenario`;

    const userPrompt = `Generate a Layer of Protection Analysis (LOPA) study for the following HAZOP scenario.

=== HAZOP INPUT DATA ===

Study ID: ${sanitizeInput(hazop_study_id)}
Node ID: ${sanitizeInput(hazop_node_id)}
Deviation: ${sanitizeInput(hazop_deviation)}
Causes: ${Array.isArray(hazop_causes) ? hazop_causes.map(c => sanitizeInput(c)).join('; ') : sanitizeInput(hazop_causes)}
Consequences: ${sanitizeInput(hazop_consequences)}
Existing Safeguards: ${Array.isArray(hazop_existing_safeguards) ? hazop_existing_safeguards.map(s => sanitizeInput(s)).join('; ') : sanitizeInput(hazop_existing_safeguards)}
Initial Risk: ${hazop_initial_risk ? JSON.stringify(hazop_initial_risk) : 'Not specified'}

Scenario Title: ${sanitizeInput(scenario_title)}
Equipment Number: ${sanitizeInput(equipment_number)}
Consequence Category: ${sanitizeInput(consequence_category) || 'People (Safety)'}
Severity Level: ${sanitizeInput(severity_level) || 'To be determined based on consequences'}

${user_provided_initiating_events ? `User-specified Initiating Events: ${JSON.stringify(user_provided_initiating_events)}` : ''}
${user_provided_ipls ? `User-specified IPLs: ${JSON.stringify(user_provided_ipls)}` : ''}
${user_provided_enabling_conditions ? `User-specified Enabling Conditions: ${JSON.stringify(user_provided_enabling_conditions)}` : ''}
${user_provided_conditional_modifiers ? `User-specified Conditional Modifiers: ${JSON.stringify(user_provided_conditional_modifiers)}` : ''}

=== REQUIRED OUTPUT ===

Provide a complete LOPA analysis in STRICTLY valid JSON (no markdown/code fences, no commentary) following this EXACT structure:

{
  "scenario_number": "LOPA-XXX",
  "equipment_number": "...",
  "scenario_title": "...",
  "consequence_description": "...",
  "consequence_category": "People|Environment|Assets",
  "severity_level": "Disastrous|Catastrophic|Major|Serious|Minor|Notable",
  "tmel": <number>,
  "tmel_basis": "EGPC Table 1 - [Severity Level]",
  
  "initiating_events": [
    {
      "name": "...",
      "frequency": <number>,
      "source": "EGPC Annex A - [specific entry]"
    }
  ],
  
  "ipls": [
    {
      "type": "Passive|Active|Human",
      "name": "...",
      "pfd": <number>,
      "source": "EGPC Annex B - [specific entry]",
      "is_valid": true,
      "validation_notes": "..."
    }
  ],
  
  "enabling_conditions": {
    "description": "...",
    "probability": <number>
  },
  
  "conditional_modifiers": {
    "time_at_risk": <number>,
    "time_at_risk_basis": "...",
    "ignition_probability": <number>,
    "ignition_probability_basis": "...",
    "vulnerability": <number>,
    "vulnerability_basis": "..."
  },
  
  "iel_per_initiating_event": [
    {
      "initiating_event": "...",
      "ief": <number>,
      "ipls_product": <number>,
      "pec": <number>,
      "pcm": <number>,
      "iel": <number>
    }
  ],
  
  "total_iel": <number>,
  "iel_vs_tmel": "ACCEPTABLE|REQUIRES_ADDITIONAL_PROTECTION",
  
  "pfd_target_safety": <number or null>,
  "pfd_target_environment": <number or null>,
  "pfd_target_financial": <number or null>,
  "pfd_target": <number or null>,
  
  "sil_safety": "None|SIL-1|SIL-2|SIL-3|SIL-4",
  "sil_environment": "None|SIL-1|SIL-2|SIL-3|SIL-4",
  "sil_financial": "None|SIL-1|SIL-2|SIL-3|SIL-4",
  "sil_required": "None|SIL-1|SIL-2|SIL-3|SIL-4",
  
  "recommendations": "...",
  "notes_assumptions": "..."
}

Ensure all values are traceable to EGPC guideline clauses or annexes.`;

    console.log('Calling Lovable AI for LOPA analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('AI response received, parsing LOPA data...');
    console.log('Raw AI content length:', content.length);

    // Parse JSON from response (with a small, deterministic repair pass for common LLM JSON mistakes)
    let lopaData;
    try {
      lopaData = parseJsonFromAiContent(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw content (first 2000 chars):', content.substring(0, 2000));
      throw new Error('Failed to parse LOPA analysis results. AI response may be malformed.');
    }

    // Validate and enrich the response
    const enrichedLopaData = {
      ...lopaData,
      hazop_study_id,
      hazop_deviation_id,
      hazop_node_id: sanitizeInput(hazop_node_id),
      hazop_deviation: sanitizeInput(hazop_deviation),
      hazop_causes: Array.isArray(hazop_causes) ? hazop_causes : [hazop_causes],
      hazop_consequences: sanitizeInput(hazop_consequences),
      hazop_existing_safeguards: Array.isArray(hazop_existing_safeguards) ? hazop_existing_safeguards : [hazop_existing_safeguards],
      hazop_initial_risk,
      egpc_reference: 'EGPC-PSM-GL-015 Rev 0, Nov 2022',
    };

    console.log('LOPA analysis completed successfully');

    return new Response(
      JSON.stringify(enrichedLopaData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('LOPA study error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
