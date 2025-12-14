import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_PURPOSE_LENGTH = 1000;
const MAX_SCOPE_LENGTH = 2000;

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

interface ExistingHazard {
  h_no: string;
  hazard_description: string;
  guideword: string;
}

interface UploadedImage {
  base64: string;
  type: string;
  name: string;
}

// Validate and sanitize all inputs
function validateInputs(body: unknown): { 
  title: string; 
  executive_summary: string; 
  purpose: string; 
  scope: string;
  existing_hazards: ExistingHazard[];
  start_number: number;
  images: UploadedImage[];
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

  const executive_summary = sanitizeInput(data.executive_summary as string);
  if (executive_summary.length > MAX_SUMMARY_LENGTH) {
    throw new Error(`Executive summary must be less than ${MAX_SUMMARY_LENGTH} characters`);
  }

  const purpose = sanitizeInput(data.purpose as string);
  if (purpose.length > MAX_PURPOSE_LENGTH) {
    throw new Error(`Purpose must be less than ${MAX_PURPOSE_LENGTH} characters`);
  }

  const scope = sanitizeInput(data.scope as string);
  if (scope.length > MAX_SCOPE_LENGTH) {
    throw new Error(`Scope must be less than ${MAX_SCOPE_LENGTH} characters`);
  }

  const existing_hazards: ExistingHazard[] = Array.isArray(data.existing_hazards) 
    ? data.existing_hazards.slice(0, 100)
    : [];
  
  const start_number = typeof data.start_number === 'number' ? data.start_number : 1;

  const images: UploadedImage[] = Array.isArray(data.images)
    ? data.images.slice(0, 5).filter((img: unknown) => {
        if (!img || typeof img !== 'object') return false;
        const i = img as Record<string, unknown>;
        return typeof i.base64 === 'string' && typeof i.type === 'string';
      })
    : [];

  return { title, executive_summary, purpose, scope, existing_hazards, start_number, images };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting HAZID study generation...');
    
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

    const { title, executive_summary, purpose, scope, existing_hazards, start_number, images } = validateInputs(parsedBody);
    console.log('Validated input - Title:', title.substring(0, 50));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build existing hazards context
    let existingContext = '';
    if (existing_hazards.length > 0) {
      const hazardsList = existing_hazards.map(h => 
        `- ${h.h_no}: ${h.guideword} - ${h.hazard_description}`
      ).join('\n');
      existingContext = `
EXISTING HAZARDS (DO NOT REPEAT THESE - generate completely different hazards):
${hazardsList}

IMPORTANT: Generate 15 NEW and UNIQUE hazards that are DIFFERENT from the ones listed above.
`;
    }

    const startNum = start_number.toString().padStart(3, '0');

    // Build image analysis instructions
    let imageAnalysisContext = '';
    if (images.length > 0) {
      imageAnalysisContext = `
=== IMAGE ANALYSIS REQUIREMENTS ===
${images.length} image(s) have been provided (P&IDs, equipment photos, site layouts, process diagrams).
CRITICAL: You MUST analyze ALL provided images and:
1. Identify all equipment, piping, instrumentation, and systems shown
2. Note any visible safety concerns, missing guards, improper configurations
3. Reference specific elements from the images in hazard descriptions
4. Consider layout and spatial relationships for risk assessment
5. Include image-derived hazards in your output
`;
    }

    const prompt = `You are a Senior Process Safety Management (PSM) Consultant conducting a HAZID Study aligned with EGPC Corporate Risk Matrix standards and international safety regulations.

INPUTS:
- Title: ${title}
- Executive Summary: ${executive_summary}
- Purpose: ${purpose}
- Scope: ${scope}
${existingContext}
${imageAnalysisContext}

=== CRITICAL: CONTEXT ANALYSIS FOR DYNAMIC GUIDEWORDS ===
You MUST carefully analyze the Title, Executive Summary, Purpose, Scope, and any attached images to determine:

1. **ACTIVITY TYPE**: What type of activity/operations are being studied?
   - Examples: Drilling, Production, Maintenance, Construction, Commissioning, Hot Work, Lifting, Confined Space Entry, Electrical Work, Processing, Transportation, Storage

2. **EQUIPMENT/SYSTEMS**: What equipment, machinery, or systems are involved?
   - Examples: Pressure Vessels, Rotating Equipment, Piping, Electrical Systems, Instrumentation, Heat Exchangers, Compressors, Pumps, Tanks, Wellhead, BOP, Cranes, HVAC

3. **OPERATIONAL PHASE**: What phase of operation is being assessed?
   - Examples: Normal Operation, Start-up, Shutdown, Emergency, Maintenance Mode, Commissioning, Testing, Idle/Standby

4. **INDUSTRY CONTEXT**: What industry or sector does this apply to?
   - Examples: Oil & Gas, Petrochemical, Power Generation, Manufacturing, Construction, Mining, Maritime

Based on your analysis, generate DYNAMIC GUIDEWORDS that are:
- Specific to the identified activities (e.g., "Kick" for drilling, "Arc Flash" for electrical)
- Relevant to the equipment mentioned (e.g., "Tube Rupture" for heat exchangers, "Cavitation" for pumps)
- Appropriate for the operational phase (e.g., "Cold Equipment" for start-up, "Residual Energy" for shutdown)
- Industry-specific where applicable

=== GUIDEWORD REQUIREMENTS ===
You MUST use BOTH:
1. BASE HAZOP GUIDEWORDS (Always include these):
   - No/None (No flow, No reaction, No power)
   - More (Higher pressure, temperature, flow rate, speed)
   - Less (Lower pressure, temperature, flow rate, speed)
   - Reverse (Reverse flow, backflow, reverse rotation)
   - Part Of (Composition change, contamination, partial operation)
   - As Well As (Additional phase, impurities, unexpected substances)
   - Other Than (Wrong material, wrong operation, human error)
   - Utility Failure (Power outage, instrument air failure, cooling water loss)
   - Management of Change (Equipment modifications, procedure changes)

2. CONTEXT-DERIVED GUIDEWORDS (Generate based on your analysis):
   Examples based on context:
   - For Drilling: Kick, Well Control Loss, Stuck Pipe, Lost Circulation, BOP Failure
   - For Electrical Work: Arc Flash, Electrocution, Ground Fault, Short Circuit
   - For Confined Space: Oxygen Deficiency, Toxic Atmosphere, Engulfment
   - For Lifting: Dropped Load, Overload, Rigging Failure, Crane Tip-Over
   - For Pressure Vessels: Overpressure, Vacuum, Brittle Fracture, Fatigue
   - For Start-up Phase: Improper Sequence, Cold Equipment, Purging Failure
   - For Maintenance: Isolation Failure, LOTO Breach, Residual Hazards

=== EGPC CORPORATE RISK MATRIX REFERENCE ===

LIKELIHOOD SCALE (Numerical Code):
1 = Rare (May occur only in exceptional circumstances)
2 = Unlikely (Could occur at some time)
3 = Possible (Might occur at some time)
4 = Likely (Will probably occur in most circumstances)
5 = Very Likely (Expected to occur in most circumstances)
6 = Almost Certain (Expected to occur frequently)

SEVERITY SCALE (Letter Code):
A = Disastrous (Multiple fatalities, Massive environmental damage, >$50M loss)
B = Catastrophic (Single fatality or permanent disability, Major environmental damage, $10-50M loss)
C = Major (Lost time injury, Significant environmental impact, $1-10M loss)
D = Serious (Medical treatment injury, Moderate environmental impact, $100K-1M loss)
E = Minor (First aid injury, Minor environmental impact, $10-100K loss)
F = Notable (Near miss, Negligible environmental impact, <$10K loss)

RISK RANKING FORMAT: Use "[Number][Letter] ([Likelihood Term]/[Severity Term])"
Examples: "3C (Possible/Major)", "1A (Rare/Disastrous)", "5B (Very Likely/Catastrophic)", "2D (Unlikely/Serious)"

=== INTERNATIONAL STANDARDS FOR RECOMMENDATIONS ===
Each recommendation MUST reference at least one of these international standards with specific clause/section:
- OSHA 1910 (e.g., OSHA 1910.119 - PSM, OSHA 1910.147 - LOTO, OSHA 1910.146 - Confined Space)
- API RP guidelines (e.g., API RP 14C, API RP 752, API RP 2001, API 510, API 570)
- ISO 45001 (e.g., ISO 45001:2018 Clause 6.1.2 - Hazard Identification)
- IEEE codes (e.g., IEEE 1584 - Arc Flash, IEEE 80 - Grounding)
- ILO safety conventions (e.g., ILO C167 - Construction Safety, ILO C155 - OSH)
- HSE guidance notes (e.g., HSE HSG65, HSE INDG344, HSE L8)
- KOSHA regulations (e.g., KOSHA Guide P-series, KOSHA Guide G-series)
- NFPA codes (e.g., NFPA 30, NFPA 70E, NFPA 484)
- ATEX directives (e.g., ATEX 2014/34/EU, ATEX 1999/92/EC)
- IEC standards (e.g., IEC 61511 - SIS, IEC 61508 - Functional Safety)
- ASME codes (e.g., ASME B31.3, ASME PCC-1, ASME BPVC)

FORMAT EACH RECOMMENDATION AS:
"[Action description] per [Standard] [Clause/Section]"
Example: "Install gas detection system per API RP 14C Section 4.3.2"
Example: "Implement LOTO procedure per OSHA 1910.147(c)(4)"
Example: "Conduct arc flash study per IEEE 1584 and NFPA 70E Article 130"

=== EXISTING CONTROLS FORMAT ===
Each existing control should also reference the standard it aligns with:
Example: "Emergency shutdown system (per IEC 61511 SIL 2)"
Example: "Pressure relief valve (per API 520/521)"
Example: "Fire detection system (per NFPA 72)"

=== STRATEGIC MAH (MAJOR ACCIDENT HAZARD) HANDLING ===
If a hazard is classified as MAH = "Yes", the recommendations MUST include at least one strategic safety study:
- "Conduct Quantitative Risk Assessment (QRA) per ISO 17776"
- "Perform Bow Tie Analysis for [specific hazard] per CCPS Guidelines"
- "Review Fire & Gas (F&G) Mapping adequacy per ISA 84.00.07"
- "Conduct Layer of Protection Analysis (LOPA) per CCPS/IEC 61511"
- "Perform SIL Classification/Verification Study per IEC 61508/61511"
- "Update Safety Case documentation per COMAH/Seveso III"

=== OUTPUT REQUIREMENTS ===
Generate 15 NEW hazards starting from H-${startNum}.
IMPORTANT: Use your context analysis to generate DYNAMIC guidewords specific to the inputs provided.
Ensure coverage across base HAZOP guidewords AND context-derived guidewords.

For each hazard provide ALL fields:
- h_no: hazard number (H-${startNum}, H-${(start_number + 1).toString().padStart(3, '0')}, etc.)
- guideword: the guideword category (MUST include context-specific guidewords derived from your analysis)
- hazard_description: detailed description specific to the activity/equipment/phase
- source_location: location/activity
- company_specific_source: specific source
- possible_causes: realistic causes specific to the context
- top_event: the top event
- consequences: safety/environment/asset impacts
- assess_for: what to assess
- risk_ranking_initial: EGPC format e.g. "3C (Possible/Major)"
- initial_risk: { likelihood: "Possible", severity: "Major" }
- mah: "Yes" or "No"
- existing_controls: current controls WITH STANDARD REFERENCES (e.g., "PSV set at 150 psig per API 520")
- current_risk: { likelihood: "", severity: "" }
- risk_ranking_current: EGPC format e.g. "2C (Unlikely/Major)"
- recommendations: array of EXACTLY 5 recommendations, EACH WITH STANDARD REFERENCE
- residual_risk: { likelihood: "", severity: "" }
- risk_ranking_residual: EGPC format e.g. "1D (Rare/Serious)"
- action_party: responsible party
- target_date: deadline

OUTPUT FORMAT (JSON only):
{
  "hazards": [
    { ...hazard object with all fields... }
  ]
}`;

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
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('AI Gateway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
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
      
      throw new Error(`AI Gateway request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received, parsing content...');
    
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No content returned from AI');
    }
    
    console.log('Content length:', content.length);
    
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content preview:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const hazardCount = parsedContent.hazards?.length || 0;
    console.log('Successfully generated', hazardCount, 'hazards');
    
    const responseBody = JSON.stringify(parsedContent);
    console.log('Response body length:', responseBody.length);

    return new Response(
      responseBody,
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hazid-study function:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout. The generation is taking too long. Please try again.' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (error instanceof Error && (
      error.message.includes('required') || 
      error.message.includes('must be less than') ||
      error.message.includes('Invalid')
    )) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});