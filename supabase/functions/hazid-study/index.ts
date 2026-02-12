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

const MAX_OPTIONAL_LENGTH = 3000;

// Validate and sanitize all inputs
function validateInputs(body: unknown): { 
  title: string; 
  executive_summary: string; 
  purpose: string; 
  scope: string;
  process_design_parameters: string;
  material_hazard_data: string;
  key_instrument_list: string;
  organizational_context: string;
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

  // Optional advanced inputs
  const process_design_parameters = sanitizeInput(data.process_design_parameters as string).slice(0, MAX_OPTIONAL_LENGTH);
  const material_hazard_data = sanitizeInput(data.material_hazard_data as string).slice(0, MAX_OPTIONAL_LENGTH);
  const key_instrument_list = sanitizeInput(data.key_instrument_list as string).slice(0, MAX_OPTIONAL_LENGTH);
  const organizational_context = sanitizeInput(data.organizational_context as string).slice(0, MAX_OPTIONAL_LENGTH);

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

  return { 
    title, 
    executive_summary, 
    purpose, 
    scope, 
    process_design_parameters,
    material_hazard_data,
    key_instrument_list,
    organizational_context,
    existing_hazards, 
    start_number, 
    images 
  };
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

    const { 
      title, 
      executive_summary, 
      purpose, 
      scope, 
      process_design_parameters,
      material_hazard_data,
      key_instrument_list,
      organizational_context,
      existing_hazards, 
      start_number, 
      images 
    } = validateInputs(parsedBody);
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

    // Build advanced inputs context
    let advancedInputsContext = '';
    if (process_design_parameters || material_hazard_data || key_instrument_list || organizational_context) {
      advancedInputsContext = `
=== ADVANCED TECHNICAL INPUTS ===
${process_design_parameters ? `
**Process Design Parameters:**
${process_design_parameters}
Use these parameters to identify hazards related to operating outside design limits (overpressure, over-temperature, flow excursions).
` : ''}
${material_hazard_data ? `
**Material Hazard Data:**
${material_hazard_data}
Use this data to identify chemical/substance-specific hazards (toxicity, flammability, reactivity, corrosivity).
` : ''}
${key_instrument_list ? `
**Key Instrument List:**
${key_instrument_list}
Use this list to identify instrumentation failure hazards, SIS failures, and alarm management issues.
` : ''}
${organizational_context ? `
**Organizational/Human Factor Context:**
${organizational_context}
Use this context to identify human factors hazards (fatigue, training gaps, communication failures, staffing issues).
` : ''}
`;
    }

    const prompt = `You are a Senior Process Safety Management (PSM) Consultant conducting a HAZID Study per EGPC-PSM-GL-001 "Hazard Identification (HAZID) Guideline" and aligned with the EGPC Corporate Risk Matrix. The output MUST match the Annex C - HAZID Worksheet Template format.

INPUTS:
- Title: ${title}
- Executive Summary: ${executive_summary}
- Purpose: ${purpose}
- Scope: ${scope}
${existingContext}
${imageAnalysisContext}
${advancedInputsContext}

=== REFERENCE STANDARD: EGPC-PSM-GL-001 ===
This HAZID study follows EGPC-PSM-GL-001 "Hazard Identification (HAZID) Guideline" and uses ISO 17776 Hazard List as guideword reference.

=== ISO 17776 HAZARD LIST (GUIDEWORDS) ===
Use these ISO 17776 hazard categories as guidewords. Select the MOST RELEVANT ones based on context analysis:
H-1: Crude Oil / Natural Gas / Hydrocarbons
H-2: Refined Hydrocarbons (Diesel, Gasoline, LPG, Naphtha)
H-3: Other Flammable Materials (Methanol, Glycol, Lube Oil, Hydraulic Fluid)
H-4: Explosives / Explosive Atmosphere
H-5: Pressure (High/Low Pressure Systems, Pressure Vessels)
H-6: Heights / Falling Objects
H-7: Objects Under Stress (Structural Loads, Vibration, Fatigue)
H-8: Dynamic Situations (Vehicles, Cranes, Lifting, Marine Operations)
H-9: Environmental Hazards (Weather, Earthquake, Flood, Lightning)
H-10: Hot/Cold Surfaces (Burns, Cryogenic)
H-11: Open Flame / Fire
H-12: Electrical (Shock, Arc Flash, Static, Lightning)
H-13: Radiation (Ionizing, Non-Ionizing, RF, UV, Laser)
H-14: Asphyxiates (Nitrogen, CO2, Inert Gas)
H-15: Toxic Gas (H2S, CO, SO2, Ammonia, Chlorine)
H-16: Toxic Liquid (Chemicals, Solvents, Mercury)
H-17: Toxic Solid (Asbestos, Lead, Catalysts)
H-18: Corrosive Substances (Acids, Caustics)
H-19: Biological Hazards (Legionella, Biohazards)
H-20: Ergonomic Hazards (Manual Handling, Repetitive Strain)
H-21: Psychological Hazards (Stress, Fatigue, Isolation)
H-22: Security Threats (Sabotage, Theft, Unauthorized Access)
H-23: Sand / Dust Hazards
H-24: Water / Flooding Hazards
H-25: Soil / Ground Stability
H-26: Natural Resources (Flora, Fauna, Protected Areas)
H-27: Medical Hazards (Remote Location, Evacuation)
H-28: Noise / Vibration
H-29: Confined Space Entry
H-30: Simultaneous Operations (SIMOPS)

=== CONTEXT ANALYSIS ===
Analyze the Title, Executive Summary, Purpose, Scope, and any images to determine:
1. Activity type, equipment/systems involved, operational phase, industry context
2. Select the most relevant ISO 17776 guidewords for this specific context
3. Generate hazards covering a diverse range of applicable guidewords

=== EGPC CORPORATE RISK MATRIX ===

LIKELIHOOD SCALE (L - Numerical Code):
1 = Rare (May occur only in exceptional circumstances)
2 = Unlikely (Could occur at some time)
3 = Possible (Might occur at some time)
4 = Likely (Will probably occur in most circumstances)
5 = Very Likely (Expected to occur in most circumstances)
6 = Almost Certain (Expected to occur frequently)

SEVERITY SCALE (S - Letter Code):
A = Disastrous (Multiple fatalities, Massive environmental damage, >$50M loss)
B = Catastrophic (Single fatality or permanent disability, Major environmental damage, $10-50M loss)
C = Major (Lost time injury, Significant environmental impact, $1-10M loss)
D = Serious (Medical treatment injury, Moderate environmental impact, $100K-1M loss)
E = Minor (First aid injury, Minor environmental impact, $10-100K loss)
F = Notable (Near miss, Negligible environmental impact, <$10K loss)

RISK RANKING (RR) CATEGORIES:
- HIGH (Red): 3A, 4A, 5A, 6A, 4B, 5B, 6B, 5C, 6C, 6D
- M/H ALARP (Orange): 2A, 3B, 3C, 4C, 4D, 5D, 5E, 6E, 6F
- M ALARP (Yellow): 1A, 1B, 2B, 2C, 2D, 3D, 3E, 4E, 4F, 5F
- LOW (Green): 1C, 1D, 1E, 1F, 2E, 2F, 3F

RISK RANKING FORMAT: "[Number][Letter] ([Likelihood Term]/[Severity Term])"
Examples: "3C (Possible/Major)", "1A (Rare/Disastrous)", "5B (Very Likely/Catastrophic)"

=== CATEGORY FIELD ===
For each hazard, assign one or more categories from: Safety, Environment, Asset, Reputation

=== SAFEGUARD (BARRIER) TYPE ===
Classify existing controls by barrier type: Hardware, Software, Human, Process Containment, Administrative, or combination.

=== ISD (INHERENTLY SAFER DESIGN) OPPORTUNITIES ===
For each hazard, identify ISD opportunities such as: Minimize, Substitute, Moderate, Simplify, or "None identified".

=== DYNAMIC TARGET DATE ASSIGNMENT ===
- **30 DAYS**: MAH = "Yes", Severity A/B, Likelihood >= 4, or HIGH risk ranking
- **60 DAYS**: Medium-high risk, Severity C with L >= 3, M/H ALARP
- **90 DAYS**: Lower risk, Severity D/E/F with L <= 3, M ALARP or LOW

=== INTERNATIONAL STANDARDS FOR RECOMMENDATIONS ===
Each recommendation MUST reference at least one standard with clause:
- OSHA 1910, API RP, ISO 45001, IEEE, ILO, HSE, NFPA, ATEX, IEC, ASME
Format: "[Action] per [Standard] [Clause]"

=== EXISTING CONTROLS FORMAT ===
Each control should reference the standard: "Emergency shutdown system (per IEC 61511 SIL 2)"

=== MAH HANDLING ===
If MAH = "Yes", recommendations MUST include strategic safety studies (QRA, Bow Tie, LOPA, SIL, etc.)

=== OUTPUT REQUIREMENTS ===
Generate 15 NEW hazards starting from H-${startNum}.

For each hazard provide ALL fields:
- h_no: "H-${startNum}", "H-${(start_number + 1).toString().padStart(3, '0')}", etc.
- guideword: ISO 17776 hazard category code and name (e.g., "H-5: Pressure")
- hazard_description: detailed description
- source_location: hazard source / activity location
- company_specific_source: specific source
- possible_causes: threat/causes
- top_event: the top event
- consequences: credible consequences (safety/environment/asset/reputation)
- assess_for: what to assess
- category: "Safety" / "Environment" / "Asset" / "Reputation" (can be comma-separated)
- risk_ranking_initial: EGPC format e.g. "3C (Possible/Major)"
- initial_risk: { likelihood: "Possible", severity: "Major" }
- mah: "Yes" or "No"
- existing_controls: current controls WITH STANDARD REFERENCES
- safeguard_barrier_type: "Hardware" / "Software" / "Human" / "Process Containment" / "Administrative" or combination
- current_risk: { likelihood: "", severity: "" }
- risk_ranking_current: EGPC format e.g. "2C (Unlikely/Major)"
- recommendations: array of EXACTLY 5 recommendations, EACH WITH STANDARD REFERENCE
- isd_opportunities: ISD opportunity description or "None identified"
- residual_risk: { likelihood: "", severity: "" }
- risk_ranking_residual: EGPC format e.g. "1D (Rare/Serious)"
- action_party: responsible party
- target_date: "Within 30 days", "Within 60 days", or "Within 90 days"
- remarks: any additional notes or observations

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