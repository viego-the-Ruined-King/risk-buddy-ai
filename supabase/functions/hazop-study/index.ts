import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 3000;
const MAX_NODES = 20;

// Sanitize input to prevent prompt injection
function sanitizeInput(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input.trim();
  sanitized = sanitized
    .replace(/```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[<>]/g, '');
  return sanitized;
}

interface ProcessNode {
  node_id: string;
  description: string;
  boundary_from: string;
  boundary_to: string;
  operating_mode: string;
}

interface OperatingParameters {
  flow_normal?: string;
  flow_min?: string;
  flow_max?: string;
  flow_units?: string;
  pressure_normal?: string;
  pressure_design?: string;
  pressure_mawp?: string;
  pressure_units?: string;
  temp_normal?: string;
  temp_min?: string;
  temp_max?: string;
  temp_units?: string;
  level_normal?: string;
  level_high?: string;
  level_low?: string;
  composition?: string;
}

interface UploadedImage {
  base64: string;
  type: string;
  name: string;
}

interface ExistingDeviation {
  deviation_id: string;
  parameter: string;
  guideword: string;
  node_id: string;
}

// Validate and sanitize all inputs
function validateInputs(body: unknown): {
  title: string;
  study_description: string;
  purpose: string;
  scope_in: string;
  scope_out: string;
  facility_type: string;
  lifecycle_phase: string;
  operating_parameters: OperatingParameters;
  pnid_information: string;
  pnid_equipment: string;
  pnid_control_loops: string;
  nodes: ProcessNode[];
  images: UploadedImage[];
  existing_deviations: ExistingDeviation[];
  generate_additional: boolean;
} {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body: expected an object');
  }

  const data = body as Record<string, unknown>;

  const title = sanitizeInput(data.title as string);
  if (!title || title.length === 0) {
    throw new Error('Title is required');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  const study_description = sanitizeInput(data.study_description as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const purpose = sanitizeInput(data.purpose as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const scope_in = sanitizeInput(data.scope_in as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const scope_out = sanitizeInput(data.scope_out as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const facility_type = sanitizeInput(data.facility_type as string).slice(0, 200);
  const lifecycle_phase = sanitizeInput(data.lifecycle_phase as string).slice(0, 200);
  const pnid_information = sanitizeInput(data.pnid_information as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const pnid_equipment = sanitizeInput(data.pnid_equipment as string).slice(0, MAX_DESCRIPTION_LENGTH);
  const pnid_control_loops = sanitizeInput(data.pnid_control_loops as string).slice(0, MAX_DESCRIPTION_LENGTH);

  const operating_parameters: OperatingParameters = {};
  if (data.operating_parameters && typeof data.operating_parameters === 'object') {
    const params = data.operating_parameters as Record<string, unknown>;
    operating_parameters.flow_normal = sanitizeInput(params.flow_normal as string);
    operating_parameters.flow_min = sanitizeInput(params.flow_min as string);
    operating_parameters.flow_max = sanitizeInput(params.flow_max as string);
    operating_parameters.flow_units = sanitizeInput(params.flow_units as string);
    operating_parameters.pressure_normal = sanitizeInput(params.pressure_normal as string);
    operating_parameters.pressure_design = sanitizeInput(params.pressure_design as string);
    operating_parameters.pressure_mawp = sanitizeInput(params.pressure_mawp as string);
    operating_parameters.pressure_units = sanitizeInput(params.pressure_units as string);
    operating_parameters.temp_normal = sanitizeInput(params.temp_normal as string);
    operating_parameters.temp_min = sanitizeInput(params.temp_min as string);
    operating_parameters.temp_max = sanitizeInput(params.temp_max as string);
    operating_parameters.temp_units = sanitizeInput(params.temp_units as string);
    operating_parameters.level_normal = sanitizeInput(params.level_normal as string);
    operating_parameters.level_high = sanitizeInput(params.level_high as string);
    operating_parameters.level_low = sanitizeInput(params.level_low as string);
    operating_parameters.composition = sanitizeInput(params.composition as string);
  }

  const nodes: ProcessNode[] = [];
  if (Array.isArray(data.nodes)) {
    for (const node of data.nodes.slice(0, MAX_NODES)) {
      if (node && typeof node === 'object') {
        const n = node as Record<string, unknown>;
        nodes.push({
          node_id: sanitizeInput(n.node_id as string) || `N-${nodes.length + 1}`.padStart(5, '0'),
          description: sanitizeInput(n.description as string),
          boundary_from: sanitizeInput(n.boundary_from as string),
          boundary_to: sanitizeInput(n.boundary_to as string),
          operating_mode: sanitizeInput(n.operating_mode as string) || 'Normal',
        });
      }
    }
  }

  const images: UploadedImage[] = Array.isArray(data.images)
    ? data.images.slice(0, 5).filter((img: unknown) => {
        if (!img || typeof img !== 'object') return false;
        const i = img as Record<string, unknown>;
        return typeof i.base64 === 'string' && typeof i.type === 'string';
      })
    : [];

  // Parse existing deviations for "generate more" functionality
  const existing_deviations: ExistingDeviation[] = [];
  if (Array.isArray(data.existing_deviations)) {
    for (const dev of data.existing_deviations) {
      if (dev && typeof dev === 'object') {
        const d = dev as Record<string, unknown>;
        existing_deviations.push({
          deviation_id: sanitizeInput(d.deviation_id as string),
          parameter: sanitizeInput(d.parameter as string),
          guideword: sanitizeInput(d.guideword as string),
          node_id: sanitizeInput(d.node_id as string),
        });
      }
    }
  }

  const generate_additional = data.generate_additional === true;

  return {
    title,
    study_description,
    purpose,
    scope_in,
    scope_out,
    facility_type,
    lifecycle_phase,
    operating_parameters,
    pnid_information,
    pnid_equipment,
    pnid_control_loops,
    nodes,
    images,
    existing_deviations,
    generate_additional,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting HAZOP study generation...');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const requestBody = await req.text();
    console.log('Request body length:', requestBody.length);

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      title,
      study_description,
      purpose,
      scope_in,
      scope_out,
      facility_type,
      lifecycle_phase,
      operating_parameters,
      pnid_information,
      pnid_equipment,
      pnid_control_loops,
      nodes,
      images,
      existing_deviations,
      generate_additional,
    } = validateInputs(parsedBody);

    console.log('Validated input - Title:', title.substring(0, 50));
    console.log('Number of nodes:', nodes.length);
    console.log('Generate additional:', generate_additional);
    console.log('Existing deviations count:', existing_deviations.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build nodes context
    let nodesContext = '';
    if (nodes.length > 0) {
      nodesContext = `
=== PROCESS NODES TO ANALYZE ===
${nodes.map((n, i) => `
Node ${i + 1}:
- Node ID: ${n.node_id}
- Description: ${n.description}
- Boundaries: From "${n.boundary_from}" to "${n.boundary_to}"
- Operating Mode: ${n.operating_mode}
`).join('\n')}
`;
    }

    // Build operating parameters context
    let paramsContext = '';
    if (Object.values(operating_parameters).some(v => v)) {
      paramsContext = `
=== OPERATING PARAMETERS ===
Flow:
  - Normal: ${operating_parameters.flow_normal || 'N/A'} ${operating_parameters.flow_units || ''}
  - Min: ${operating_parameters.flow_min || 'N/A'} ${operating_parameters.flow_units || ''}
  - Max: ${operating_parameters.flow_max || 'N/A'} ${operating_parameters.flow_units || ''}

Pressure:
  - Normal: ${operating_parameters.pressure_normal || 'N/A'} ${operating_parameters.pressure_units || ''}
  - Design: ${operating_parameters.pressure_design || 'N/A'} ${operating_parameters.pressure_units || ''}
  - MAWP: ${operating_parameters.pressure_mawp || 'N/A'} ${operating_parameters.pressure_units || ''}

Temperature:
  - Normal: ${operating_parameters.temp_normal || 'N/A'} ${operating_parameters.temp_units || ''}
  - Min: ${operating_parameters.temp_min || 'N/A'} ${operating_parameters.temp_units || ''}
  - Max: ${operating_parameters.temp_max || 'N/A'} ${operating_parameters.temp_units || ''}

Level:
  - Normal: ${operating_parameters.level_normal || 'N/A'}
  - High Alarm: ${operating_parameters.level_high || 'N/A'}
  - Low Alarm: ${operating_parameters.level_low || 'N/A'}

Composition/Phase: ${operating_parameters.composition || 'N/A'}
`;
    }

    // Build P&ID context
    let pnidContext = '';
    if (pnid_information || pnid_equipment || pnid_control_loops) {
      pnidContext = `
=== P&ID INFORMATION ===
P&ID Numbers: ${pnid_information || 'N/A'}
Equipment and Lines: ${pnid_equipment || 'N/A'}
Control Loops: ${pnid_control_loops || 'N/A'}
`;
    }

    // Build image analysis context
    let imageAnalysisContext = '';
    if (images.length > 0) {
      imageAnalysisContext = `
=== IMAGE ANALYSIS REQUIREMENTS ===
${images.length} image(s) have been provided (P&IDs, equipment photos, site layouts, process diagrams).
CRITICAL: You MUST analyze ALL provided images and:
1. Identify all equipment, piping, instrumentation, and systems shown
2. Note any visible safety concerns, missing guards, improper configurations
3. Reference specific elements from the images in deviation descriptions
4. Consider layout and spatial relationships for risk assessment
5. Include image-derived deviations in your output
`;
    }

    // Build existing deviations context for generating additional
    let existingDeviationsContext = '';
    if (generate_additional && existing_deviations.length > 0) {
      const nextDevNum = existing_deviations.length + 1;
      existingDeviationsContext = `
=== EXISTING DEVIATIONS (DO NOT DUPLICATE) ===
The following deviations have already been generated. You MUST generate 10 NEW, DIFFERENT deviations.
Start deviation numbering from D-${String(nextDevNum).padStart(3, '0')}.

Already covered combinations (node_id | parameter | guideword):
${existing_deviations.map(d => `- ${d.node_id} | ${d.parameter} | ${d.guideword}`).join('\n')}

IMPORTANT: Generate deviations for DIFFERENT parameter-guideword combinations than those listed above.
Consider less common but credible scenarios, startup/shutdown modes, maintenance activities, and human factors.
`;
    }

    const prompt = `You are a certified HAZOP Facilitator conducting a HAZOP Study in accordance with IEC 61882, EGPC-PSM-GL-005 (HAZOP Guideline – May 2022), and international best practices.

=== STUDY INFORMATION ===
Title: ${title}
Study Description: ${study_description || 'Not provided'}
Purpose: ${purpose || 'Not provided'}
Scope (In): ${scope_in || 'Not provided'}
Scope (Out): ${scope_out || 'Not provided'}
Facility Type: ${facility_type || 'Not specified'}
Lifecycle Phase: ${lifecycle_phase || 'Not specified'}

${paramsContext}
${pnidContext}
${nodesContext}
${imageAnalysisContext}
${existingDeviationsContext}

=== IEC 61882 HAZOP METHODOLOGY ===

STANDARD GUIDEWORDS (Apply to each parameter):
- NO/NONE: Complete negation of design intent
- MORE: Quantitative increase (higher flow, pressure, temperature, level, speed)
- LESS: Quantitative decrease (lower flow, pressure, temperature, level, speed)
- AS WELL AS: Qualitative modification/addition (extra phase, impurities, additional component)
- PART OF: Qualitative decrease (composition change, only part of what should happen)
- REVERSE: Logical opposite (backflow, reverse reaction, reverse rotation)
- OTHER THAN: Complete substitution (wrong material, wrong operation, wrong timing)
- EARLY: Time-related deviation (premature action/event)
- LATE: Time-related deviation (delayed action/event)
- BEFORE: Sequence deviation (step occurs before it should)
- AFTER: Sequence deviation (step occurs after it should)

PARAMETERS TO CONSIDER:
- Flow, Pressure, Temperature, Level, Composition, Phase, Viscosity, pH, Reaction, Time, Sequence, Speed, Frequency, Mixing, Addition, Separation, Information, Communication

=== EGPC CORPORATE RISK MATRIX ===

LIKELIHOOD SCALE (use NUMBER only):
1 = Rare (May occur only in exceptional circumstances)
2 = Unlikely (Could occur at some time)
3 = Possible (Might occur at some time)
4 = Likely (Will probably occur in most circumstances)
5 = Very Likely (Expected to occur in most circumstances)
6 = Almost Certain (Expected to occur frequently)

SEVERITY SCALE (use LETTER only):
A = Disastrous (Multiple fatalities, Massive environmental damage, >$50M loss)
B = Catastrophic (Single fatality or permanent disability, Major environmental damage, $10-50M loss)
C = Major (Lost time injury, Significant environmental impact, $1-10M loss)
D = Serious (Medical treatment injury, Moderate environmental impact, $100K-1M loss)
E = Minor (First aid injury, Minor environmental impact, $10-100K loss)
F = Notable (Near miss, Negligible environmental impact, <$10K loss)

RISK CALCULATION:
- Risk = Likelihood × Severity (format: "3C", "1A", "5B", etc.)
- Level determination based on EGPC Matrix:
  * HIGH: Any A or B severity, OR likelihood >= 4 with C/D severity
  * MEDIUM: C/D severity with likelihood 2-3, OR E severity with likelihood >= 4
  * LOW: E/F severity with likelihood 1-3

=== ASSESS FOR CATEGORIES ===
For each deviation, specify what is being assessed:
- People (injuries, fatalities)
- Environment (spills, emissions, contamination)
- Assets (equipment damage, production loss)
- Reputation (public image, regulatory standing)
Use comma-separated list if multiple apply, e.g., "People, Assets"

=== INTERNATIONAL STANDARDS REFERENCES ===
Each safeguard and recommendation MUST reference specific standards:
- OSHA 1910.119 (PSM), 1910.147 (LOTO), 1910.146 (Confined Space)
- API RP 14C, API RP 752, API RP 520/521, API RP 2001, API 510, API 570
- ISO 45001:2018, ISO 17776
- IEC 61511, IEC 61508
- IEEE 1584, IEEE 80
- NFPA 30, NFPA 70E, NFPA 484
- ATEX 2014/34/EU
- ASME B31.3, ASME BPVC

=== OUTPUT REQUIREMENTS ===

Generate a complete HAZOP WORKSHEET per EGPC Annex C format.

${generate_additional ? 'Generate EXACTLY 10 NEW deviations that are DIFFERENT from existing ones.' : `For EACH node provided, generate AT LEAST 5 deviations covering different parameters and guidewords.
${nodes.length === 0 ? 'Since no specific nodes were provided, create 3 logical process nodes based on the study description and generate 5 deviations for each.' : ''}`}

=== COMPREHENSIVENESS REQUIREMENTS ===
For EACH deviation, be VERY DETAILED and COMPREHENSIVE:

1. CAUSES (5-7 per deviation): Include equipment failures, human errors, control system failures, external factors, maintenance issues, design deficiencies
2. EXISTING SAFEGUARDS (4-6 per deviation): Each must reference international standard (e.g., "PSV-001 set at 75 barg per API RP 520")
3. RECOMMENDATIONS (3-5 per deviation): Specific, actionable, each with standard reference and implementation details
4. ACTION PARTY: Be specific - "Operations Supervisor", "Maintenance Engineer", "Process Engineering", "HSE Department", "Instrumentation & Control"
5. CONSEQUENCES: Detailed description of ALL potential impacts without crediting safeguards

=== RISK ASSESSMENT STRUCTURE ===
Each deviation requires THREE separate risk assessments:

1. INITIAL RISK: Risk WITHOUT any safeguards (unmitigated scenario)
2. CURRENT RISK: Risk WITH existing safeguards in place (after safeguards, before recommendations)
3. RESIDUAL RISK: Risk AFTER implementing recommendations

=== TARGET DATE LOGIC ===
- 30 DAYS: Severity A or B, OR Likelihood >= 4, OR MAH scenario
- 60 DAYS: Severity C with Likelihood >= 3, OR Severity D with Likelihood >= 4
- 90 DAYS: All other cases

OUTPUT FORMAT (JSON only):
{
  "deviations": [
    {
      "node_id": "N-001",
      "node_description": "Feed Gas Inlet Header",
      "deviation_id": "D-001",
      "parameter": "Flow",
      "guideword": "No",
      "deviation": "No Flow",
      "design_intent": "Maintain continuous gas flow at 100 m³/hr ± 10% to downstream processing units",
      "causes": [
        "Upstream valve XV-001 fails closed due to instrument air failure",
        "Line blockage from hydrate formation in cold weather conditions",
        "Compressor K-001 trips on high vibration or motor overload",
        "Pig stuck in pipeline during routine pigging operation",
        "Operator error - wrong valve lineup during shift handover",
        "Control valve FV-001 fails closed due to actuator failure",
        "Upstream facility emergency shutdown activated"
      ],
      "assess_for": "People, Assets, Environment",
      "consequences_unmitigated": "Complete loss of feed gas resulting in: (1) Downstream unit trip due to low flow protection, (2) Potential equipment damage from thermal shock in heat exchangers, (3) Production loss estimated at $50K/hour, (4) Flare load increase from pressure relief, (5) Potential oxygen ingress if vacuum conditions develop",
      "initial_risk": {
        "likelihood": 4,
        "severity": "C",
        "risk": "4C",
        "level": "High"
      },
      "existing_safeguards": [
        "Flow transmitter FT-001 with low/low-low alarm per API RP 14C Section 5.2",
        "Automated shutdown on low-low flow per IEC 61511 SIL 2 requirement",
        "Check valve XV-002 prevents backflow per API RP 520",
        "Operating procedure OPS-101 for valve lineup verification per OSHA 1910.119",
        "Shift handover checklist per ISO 45001:2018 requirements"
      ],
      "current_risk": {
        "likelihood": 2,
        "severity": "D",
        "risk": "2D",
        "level": "Low"
      },
      "recommendations": [
        "Install redundant flow transmitter FT-001B with 2oo3 voting logic per IEC 61511 SIL 2 requirements",
        "Implement predictive maintenance for compressor K-001 vibration monitoring per API 670",
        "Install hydrate inhibitor injection system at pipeline inlet per API RP 14E",
        "Add real-time flow monitoring on control room DCS with automatic alert to operations per OSHA 1910.119",
        "Conduct formal HAZOP refresher training for all operations personnel per IEC 61882"
      ],
      "residual_risk": {
        "likelihood": 1,
        "severity": "E",
        "risk": "1E",
        "level": "Low"
      },
      "action_party": "Process Engineering / Instrumentation",
      "remarks": "Critical deviation - requires SIL verification study per IEC 61511",
      "target_date": "Within 30 days"
    }
  ]
}

IMPORTANT RULES:
- Do NOT invent site-specific data beyond what's provided
- Use conservative, industry-accepted assumptions
- Maintain professional, regulatory, and audit-ready language
- Ensure consistency with EGPC terminology
- Consequences MUST be described WITHOUT crediting safeguards
- All safeguards and recommendations MUST reference international standards
- likelihood MUST be a NUMBER (1-6)
- severity MUST be a LETTER (A-F)
- risk MUST be in format "NumberLetter" (e.g., "3C")
- level MUST be "High", "Medium", or "Low"
`;

    console.log('Calling Lovable AI Gateway...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt }
    ];

    for (const img of images) {
      contentArray.push({
        type: 'image_url',
        image_url: { url: img.base64 }
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: contentArray }
        ],
        temperature: 0.7,
        max_tokens: 20000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from AI');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean and parse the JSON from the response
    let result;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Extract JSON block
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Function to escape newlines inside JSON string values
      function escapeNewlinesInStrings(str: string): string {
        let result = '';
        let inString = false;
        let escape = false;
        
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          
          if (escape) {
            result += char;
            escape = false;
            continue;
          }
          
          if (char === '\\') {
            result += char;
            escape = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString && char === '\n') {
            result += '\\n';
            continue;
          }
          
          if (inString && char === '\r') {
            result += '\\r';
            continue;
          }
          
          if (inString && char === '\t') {
            result += '\\t';
            continue;
          }
          
          result += char;
        }
        
        return result;
      }

      // Escape newlines inside strings
      jsonStr = escapeNewlinesInStrings(jsonStr);

      // Remove trailing commas before } or ]
      jsonStr = jsonStr.replace(/,(\s*[\}\]])/g, '$1');

      try {
        result = JSON.parse(jsonStr);
      } catch (firstError) {
        console.log('First parse attempt failed:', firstError);
        console.log('Attempting character-by-character extraction...');
        
        // Extract deviations array using bracket matching
        const deviationsStart = jsonStr.indexOf('"deviations"');
        if (deviationsStart === -1) {
          throw new Error('No deviations array found in response');
        }
        
        // Find the array start
        const arrayStart = jsonStr.indexOf('[', deviationsStart);
        if (arrayStart === -1) {
          throw new Error('No deviations array found');
        }
        
        // Find matching array end using bracket counting
        let depth = 0;
        let arrayEnd = -1;
        for (let i = arrayStart; i < jsonStr.length; i++) {
          if (jsonStr[i] === '[') depth++;
          if (jsonStr[i] === ']') depth--;
          if (depth === 0) {
            arrayEnd = i;
            break;
          }
        }
        
        if (arrayEnd === -1) {
          throw new Error('Malformed deviations array');
        }
        
        const deviationsArrayStr = jsonStr.substring(arrayStart, arrayEnd + 1);
        
        try {
          const deviations = JSON.parse(deviationsArrayStr);
          result = { deviations };
          console.log(`Recovered ${deviations.length} deviations via bracket matching`);
        } catch (arrayError) {
          console.error('Array extraction failed:', arrayError);
          throw new Error('Could not parse deviations array');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content length:', content.length);
      console.error('Content preview:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }

    if (!result.deviations || result.deviations.length === 0) {
      throw new Error('No deviations generated. Please try again with more details.');
    }

    console.log('Successfully parsed HAZOP deviations:', result.deviations.length);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in hazop-study function:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
