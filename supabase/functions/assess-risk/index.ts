import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ACTIVITY_TYPE_LENGTH = 100;
const MAX_LOCATION_LENGTH = 200;
const MAX_EXISTING_HAZARDS_LENGTH = 100000;

// Sanitize input to prevent prompt injection
function sanitizeInput(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove potential prompt injection patterns
  sanitized = sanitized
    .replace(/```/g, '')  // Remove code blocks
    .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
    .replace(/[<>]/g, '');  // Remove angle brackets that could be used for injection
  
  return sanitized;
}

interface UploadedImage {
  base64: string;
  type: string;
  name: string;
}

// Validate and sanitize all inputs
function validateInputs(body: unknown): { 
  title: string; 
  description: string; 
  activity_type: string; 
  location: string;
  existing_hazards: string;
  generate_new: boolean;
  images: UploadedImage[];
} {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body: expected an object');
  }

  const data = body as Record<string, unknown>;

  // Validate title (required)
  const title = sanitizeInput(data.title as string);
  if (!title || title.length === 0) {
    throw new Error('Title is required');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  // Validate description (optional but limited)
  const description = sanitizeInput(data.description as string);
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  // Validate activity_type (optional but limited)
  const activity_type = sanitizeInput(data.activity_type as string);
  if (activity_type.length > MAX_ACTIVITY_TYPE_LENGTH) {
    throw new Error(`Activity type must be less than ${MAX_ACTIVITY_TYPE_LENGTH} characters`);
  }

  // Validate location (optional but limited)
  const location = sanitizeInput(data.location as string);
  if (location.length > MAX_LOCATION_LENGTH) {
    throw new Error(`Location must be less than ${MAX_LOCATION_LENGTH} characters`);
  }

  // Validate existing_hazards (optional but limited)
  const existing_hazards = sanitizeInput(data.existing_hazards as string);
  if (existing_hazards.length > MAX_EXISTING_HAZARDS_LENGTH) {
    throw new Error(`Existing hazards must be less than ${MAX_EXISTING_HAZARDS_LENGTH} characters`);
  }

  // Validate generate_new (boolean)
  const generate_new = data.generate_new === true;

  // Parse images (optional, max 5)
  const images: UploadedImage[] = Array.isArray(data.images)
    ? data.images.slice(0, 5).filter((img: unknown) => {
        if (!img || typeof img !== 'object') return false;
        const i = img as Record<string, unknown>;
        return typeof i.base64 === 'string' && typeof i.type === 'string';
      })
    : [];

  return { title, description, activity_type, location, existing_hazards, generate_new, images };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting risk assessment generation...');
    
    // Verify user authentication
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

    // Parse and validate inputs
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, description, activity_type, location, existing_hazards, generate_new, images } = validateInputs(parsedBody);
    console.log('Validated input - Title:', title.substring(0, 50), 'Images:', images.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build image analysis instructions if images are provided
    let imageAnalysisContext = '';
    if (images.length > 0) {
      imageAnalysisContext = `
=== IMAGE ANALYSIS REQUIREMENTS ===
${images.length} image(s) have been provided (equipment photos, site layouts, work area images, process diagrams).
CRITICAL: You MUST analyze ALL provided images and:
1. Identify all equipment, tools, materials, and work areas shown
2. Note any visible safety concerns, missing guards, improper configurations, housekeeping issues
3. Reference specific elements from the images in hazard descriptions
4. Consider layout and spatial relationships for risk assessment
5. Include image-derived hazards in your output
`;
    }

    const prompt = `You are a professional risk assessment expert specializing in workplace safety and international safety standards compliance. You MUST use the EGPC Corporate Risk Matrix for all risk assessments.

Activity: ${title}
Description: ${description}
Activity Type: ${activity_type}
Location: ${location}
${imageAnalysisContext}

CRITICAL REQUIREMENTS FOR HAZARD DESCRIPTIONS:
1. Each hazard description must be accurate, practical, and scientifically detailed
2. Use precise technical terminology relevant to the specific industry and activity type
3. Include specific details about the mechanism of harm, energy sources, or failure modes
4. Reference actual equipment, processes, materials, or conditions specific to the activity
5. Avoid generic descriptions - be specific to the exact scenario described

CRITICAL REQUIREMENTS FOR EXISTING CONTROLS:
1. Describe actual, specific safety measures currently in place
2. Include details about engineering controls (guards, barriers, ventilation systems, etc.)
3. Specify administrative controls (procedures, training programs, permits, inspections)
4. Detail PPE requirements with specific types (e.g., "Class 2 safety helmets with chin straps" not just "helmets")
5. Reference specific standards being followed (e.g., "OSHA-compliant lockout/tagout procedures")
6. NEVER use vague or generic statements like "basic safety measures" or "standard precautions"
7. If no controls exist, explicitly state "No existing controls identified" rather than leaving blank

CRITICAL - EGPC Corporate Risk Matrix Guidelines:

LIKELIHOOD SCALE (use these exact terms with numerical values):
- Rare (1): ≥ 0.0001% to < 0.001% probability (A similar event has not yet occurred)
- Unlikely (2): ≥ 0.001% to < 0.01% probability (A similar event has occurred somewhere in our industry but not in ENTITIES)
- Possible (3): ≥ 0.01% to < 0.1% probability (A similar event has occurred at least once in ENTITIES)
- Likely (4): ≥ 0.1% to < 1% probability (The event likely to occur within the lifetime of 10 similar COMPANIES)
- Very Likely (5): ≥ 1% to < 10% probability (Has occurred once or twice in the lifetime of the COMPANY)
- Almost Certain (5): ≥ 10% to ≤ 100% probability (The event likely to occur several times in the lifetime of the COMPANY)

SEVERITY SCALE (use these exact terms with numerical values):
- Notable/F (1): First Aid Case, slight non-prolonged health effect
- Minor/E (2): Medical Treatment Case, possible short disruption
- Serious/D (3): Lost Time Injury, reversible disability, minor damage
- Major/C (4): 2-3 lost-time injuries, partial irreversible disabilities, major damage
- Catastrophic/B (5): Single fatality potential, serious injury to public, extensive damage
- Disastrous/A (5): Multiple fatalities potential, catastrophic damage

NUMERICAL RISK LEVEL CALCULATION:
- Calculate Risk Level = Likelihood (1-5) × Severity (1-5)
- Numerical range: 1-25

RISK LEVEL CALCULATION (based on EGPC matrix):
- Level 1 - High (Intolerable): Red zones on matrix - immediate action required within 30 days
- Level 2 - Medium/High (Tolerable if ALARP): Orange zones - ALARP study required, senior management signoff
- Level 3 - Medium (Tolerable if ALARP): Yellow zones - monitor and improve controls
- Low (Broadly acceptable): Green zones - low priority monitoring

Requirements:
1. ${generate_new ? `CRITICAL: Generate 10 NEW hazards that are COMPLETELY DIFFERENT from these existing ones: ${existing_hazards}. DO NOT repeat or include any hazard similar to the existing ones. Focus on different aspects, different equipment, different processes, different locations within the facility.` : 'Identify at least 10 distinct hazards'}
2. For each hazard, provide comprehensive analysis including:
   - Hazard Description: MUST be accurate, practical, and scientifically detailed. Include specific technical details about the mechanism of harm, energy sources involved, specific equipment or materials, and exact conditions that create the hazard. Use industry-specific terminology.
   - Who Might Be Harmed: identify people at risk (e.g., operators, maintenance staff, visitors, contractors, environment)
   - Consequences: outline potential outcomes or injuries using EGPC severity definitions
   - Likelihood: MUST use EGPC terms (Rare, Unlikely, Possible, Likely, Very Likely, Almost Certain)
   - Likelihood Score: numerical value (1-5) based on EGPC scale
   - Severity: MUST use EGPC terms (Notable/F, Minor/E, Serious/D, Major/C, Catastrophic/B, Disastrous/A)
   - Severity Score: numerical value (1-5) based on EGPC scale
   - Risk Level: MUST use EGPC levels (Level 1 - High, Level 2 - Medium/High, Level 3 - Medium, Low)
   - Numerical Risk Level: calculated as Likelihood Score × Severity Score (1-25)
   - Existing Controls: MUST be practical and specific, clearly describing actual measures or actions currently in place. Include specific details about engineering controls, administrative procedures, PPE requirements with exact specifications, and reference relevant standards being followed. AVOID vague statements like "basic precautions" or "standard measures". If no controls exist, state "No existing controls identified".
   - Proposed Controls: recommended additional controls and improvements that MUST explicitly reference international safety standards
   
3. Control Measures Requirements:
   - Existing Controls: List current safety measures already implemented
   - Proposed Controls: Each proposed control MUST be linked to one or more international standards or best practices
   - Reference standards including: OSHA, HSE, ILO, IEEE, ISO, EU-OSHA, CCOHS, TEAMA, API, DGUV
   - Include engineering controls, administrative controls, and PPE recommendations where applicable
   - Example format: "Use lockout/tagout procedures as per OSHA 1910.147 and ISO 14118"
   
4. Residual Risk Assessment (after applying all proposed controls):
   - Residual Likelihood: MUST use EGPC terms (Rare, Unlikely, Possible, Likely, Very Likely, Almost Certain)
   - Residual Likelihood Score: numerical value (1-5)
   - Residual Severity: MUST use EGPC terms (Notable/F, Minor/E, Serious/D, Major/C, Catastrophic/B, Disastrous/A)
   - Residual Severity Score: numerical value (1-5)
   - Residual Risk Level: MUST use EGPC levels (Level 1 - High, Level 2 - Medium/High, Level 3 - Medium, Low)
   - Residual Numerical Risk Level: calculated as Residual Likelihood Score × Residual Severity Score (1-25)

Format your response as JSON with the following structure:
{
  "hazards": [
    {
      "description": "Clear hazard description",
      "who_might_be_harmed": "Specific groups at risk",
      "consequences": "Potential outcomes or injuries based on EGPC severity definitions",
      "likelihood": "EGPC term: Rare/Unlikely/Possible/Likely/Very Likely/Almost Certain",
      "likelihood_score": 1-5,
      "severity": "EGPC term: Notable (F)/Minor (E)/Serious (D)/Major (C)/Catastrophic (B)/Disastrous (A)",
      "severity_score": 1-5,
      "risk_level": "EGPC level: Level 1 - High/Level 2 - Medium High/Level 3 - Medium/Low",
      "numerical_risk_level": "Likelihood Score × Severity Score (1-25)",
      "existing_controls": "Current safety measures already in place",
      "proposed_controls": "Recommended additional measures with explicit references to international standards (e.g., OSHA 1910.147, ISO 45001)",
      "residual_likelihood": "EGPC term: Rare/Unlikely/Possible/Likely/Very Likely/Almost Certain",
      "residual_likelihood_score": 1-5,
      "residual_severity": "EGPC term: Notable (F)/Minor (E)/Serious (D)/Major (C)/Catastrophic (B)/Disastrous (A)",
      "residual_severity_score": 1-5,
      "residual_risk_level": "EGPC level: Level 1 - High/Level 2 - Medium High/Level 3 - Medium/Low",
      "residual_numerical_risk_level": "Residual Likelihood Score × Residual Severity Score (1-25)"
    }
  ]
}`;

    console.log('Calling Lovable AI Gateway...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

    // Build multimodal content array
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt }
    ];

    // Add images if provided
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
    console.log('AI response received, parsing...');
    
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsedContent = JSON.parse(content);
    console.log('Successfully generated', parsedContent.hazards?.length || 0, 'hazards');

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assess-risk function:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout. The generation is taking too long. Please try again.' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Return validation errors as 400 Bad Request
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
