import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FIELD_LENGTH = 3000;

function sanitizeInput(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/```/g, '').replace(/\n{3,}/g, '\n\n').replace(/[<>]/g, '');
}

interface UploadedImage {
  base64: string;
  type: string;
  name: string;
}

function validateInputs(body: unknown) {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  const data = body as Record<string, unknown>;

  const title = sanitizeInput(data.title as string);
  if (!title) throw new Error('Title is required');

  return {
    title,
    facility_description: sanitizeInput(data.facility_description as string).slice(0, MAX_FIELD_LENGTH),
    objective: sanitizeInput(data.objective as string).slice(0, MAX_FIELD_LENGTH),
    risk_types: sanitizeInput(data.risk_types as string).slice(0, 200),
    scope_boundaries: sanitizeInput(data.scope_boundaries as string).slice(0, MAX_FIELD_LENGTH),
    lifecycle_phase: sanitizeInput(data.lifecycle_phase as string).slice(0, 200),
    materials_inventory: sanitizeInput(data.materials_inventory as string).slice(0, MAX_FIELD_LENGTH),
    isolatable_sections: sanitizeInput(data.isolatable_sections as string).slice(0, MAX_FIELD_LENGTH),
    equipment_list: sanitizeInput(data.equipment_list as string).slice(0, MAX_FIELD_LENGTH),
    operating_parameters: sanitizeInput(data.operating_parameters as string).slice(0, MAX_FIELD_LENGTH),
    manning_data: sanitizeInput(data.manning_data as string).slice(0, MAX_FIELD_LENGTH),
    hole_sizes: sanitizeInput(data.hole_sizes as string).slice(0, MAX_FIELD_LENGTH),
    weather_data: sanitizeInput(data.weather_data as string).slice(0, MAX_FIELD_LENGTH),
    ignition_probability: sanitizeInput(data.ignition_probability as string).slice(0, MAX_FIELD_LENGTH),
    vulnerability_assumptions: sanitizeInput(data.vulnerability_assumptions as string).slice(0, MAX_FIELD_LENGTH),
    software_model: sanitizeInput(data.software_model as string).slice(0, 500),
    irpa_workers: sanitizeInput(data.irpa_workers as string).slice(0, 100) || '1e-3',
    irpa_public: sanitizeInput(data.irpa_public as string).slice(0, 100) || '1e-4',
    broadly_acceptable: sanitizeInput(data.broadly_acceptable as string).slice(0, 100) || '1e-6',
    images: Array.isArray(data.images) ? data.images.slice(0, 5).filter((img: unknown) => {
      if (!img || typeof img !== 'object') return false;
      const i = img as Record<string, unknown>;
      return typeof i.base64 === 'string' && typeof i.type === 'string';
    }) as UploadedImage[] : [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const requestBody = await req.text();
    let parsedBody: unknown;
    try { parsedBody = JSON.parse(requestBody); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const inputs = validateInputs(parsedBody);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompt = `You are a Senior QRA (Quantitative Risk Assessment) Specialist conducting a QRA Study per EGPC-PSM-GL-008 "Quantitative Risk Assessment (QRA) Guideline".

=== STUDY INPUTS ===
Title: ${inputs.title}
Facility Description: ${inputs.facility_description}
Objective: ${inputs.objective}
Risk Types to Evaluate: ${inputs.risk_types}
Scope/Boundaries: ${inputs.scope_boundaries}
Lifecycle Phase: ${inputs.lifecycle_phase}

=== FACILITY & PROCESS DATA (Section 8.3) ===
Hazardous Materials Inventory: ${inputs.materials_inventory}
Isolatable Sections: ${inputs.isolatable_sections}
Equipment List: ${inputs.equipment_list}
Operating Parameters: ${inputs.operating_parameters}
Manning/Population Data: ${inputs.manning_data}

=== ASSUMPTION REGISTER (Section 8.2) ===
Hole Sizes: ${inputs.hole_sizes || 'Default per EGPC Table 8.1: Small 5mm, Medium 25mm, Large 100mm, Rupture = full bore'}
Weather Data: ${inputs.weather_data}
Ignition Probability: ${inputs.ignition_probability}
Vulnerability Assumptions: ${inputs.vulnerability_assumptions}
Software/Model: ${inputs.software_model}

=== RISK TOLERANCE CRITERIA (Annex E) ===
IRPA Workers: ${inputs.irpa_workers} per year
IRPA Public: ${inputs.irpa_public} per year
Broadly Acceptable: ${inputs.broadly_acceptable} per year

=== REFERENCE STANDARD: EGPC-PSM-GL-008 ===
Follow the complete QRA methodology:
1. Scope Definition (Section 8.1)
2. Assumption Register (Section 8.2)
3. Hazard Identification & Failure Case Selection (Section 8.3)
4. Consequence Assessment (Section 8.4) - model physical effects per Annex D
5. Frequency Assessment (Section 8.5) - use IOGP 434-1 / OGP databases
6. Risk Analysis (Section 8.6) - Individual Risk (IRPA/LSIR) and Societal Risk (FN Curve)
7. Risk Evaluation (Section 8.7) - compare against EGPC Annex E criteria
8. ALARP Demonstration (Section 8.8) - hierarchy of controls

=== FAILURE CASE HOLE SIZES (per Section 8.3.2, Table 8.1) ===
For each isolatable section, define failure cases with:
- Small leak: 5mm hole (or as specified)
- Medium leak: 25mm hole
- Large leak: 100mm hole
- Rupture: Full bore diameter

=== CONSEQUENCE OUTCOMES (per Section 8.4, Annex D Table D1) ===
For flammable releases, consider event tree outcomes:
- Jet Fire: thermal radiation distances at 1.6, 4.7, 12.5, 37.5 kW/m²
- Pool Fire: thermal radiation distances
- Flash Fire: LFL distance
- VCE (Vapor Cloud Explosion): overpressure distances at 70, 200, 500 mbar
- Toxic Dispersion: IDLH, ERPG-2, ERPG-3 distances
- BLEVE/Fireball: if applicable

=== FREQUENCY DATA (per Section 8.5) ===
Use industry databases: IOGP Report 434-1, UKOPA, company-specific data.
Apply conditional probabilities for ignition, explosion, etc.

=== INDIVIDUAL RISK CRITERIA (Annex E) ===
- Maximum tolerable for workers: 1×10⁻³ per year
- Maximum tolerable for public: 1×10⁻⁴ per year
- Broadly acceptable: 1×10⁻⁶ per year
- ALARP region: between maximum tolerable and broadly acceptable

=== SOCIETAL RISK CRITERIA (Annex E) ===
FN Curve with:
- Intolerable line: F = 10⁻¹/N² (for N≥1)
- Broadly acceptable line: F = 10⁻³/N² (for N≥1)

=== OUTPUT FORMAT (JSON) ===
Generate a comprehensive QRA following this exact structure:
{
  "study_summary": {
    "objective": "...",
    "scope": "...",
    "facility_description": "...",
    "lifecycle_phase": "...",
    "risk_types": "..."
  },
  "assumption_register": [
    { "category": "Release Modeling / Weather / Ignition / Vulnerability / General", "assumption": "...", "reference": "EGPC / IOGP / API / ..." }
  ],
  "failure_cases": [
    {
      "id": "FC-001",
      "isolatable_section": "...",
      "equipment": "...",
      "material": "...",
      "phase": "Gas/Liquid/Two-Phase",
      "hole_sizes": [
        { "category": "Small", "diameter_mm": 5, "rate_kg_s": 0.1 },
        { "category": "Medium", "diameter_mm": 25, "rate_kg_s": 2.5 },
        { "category": "Large", "diameter_mm": 100, "rate_kg_s": 40 },
        { "category": "Rupture", "diameter_mm": 200, "rate_kg_s": 160 }
      ],
      "frequency_per_year": 0.001,
      "frequency_source": "IOGP 434-1"
    }
  ],
  "consequence_assessment": [
    {
      "failure_case_id": "FC-001",
      "hole_size": "Small/Medium/Large/Rupture",
      "outcomes": [
        {
          "type": "Jet Fire",
          "probability": 0.065,
          "effects": {
            "flame_length_m": 10,
            "distance_1_6kw": 50,
            "distance_4_7kw": 30,
            "distance_12_5kw": 15,
            "distance_37_5kw": 8
          }
        },
        {
          "type": "Flash Fire",
          "probability": 0.04,
          "effects": { "lfl_distance_m": 80 }
        },
        {
          "type": "VCE",
          "probability": 0.02,
          "effects": {
            "distance_70mbar": 120,
            "distance_200mbar": 60,
            "distance_500mbar": 30
          }
        },
        {
          "type": "Toxic Dispersion",
          "probability": 1.0,
          "effects": {
            "idlh_distance_m": 200,
            "erpg2_distance_m": 350,
            "erpg3_distance_m": 150
          }
        }
      ]
    }
  ],
  "risk_analysis": {
    "individual_risk": {
      "irpa_workers": [
        { "group": "Control Room Operators", "irpa_value": 5e-5, "status": "ALARP" }
      ],
      "irpa_public": [
        { "location": "Nearest Residence 500m", "irpa_value": 2e-6, "status": "ALARP" }
      ],
      "lsir_contours": [
        { "risk_level": 1e-4, "description": "Extends 50m from process area" },
        { "risk_level": 1e-5, "description": "Extends 150m from process area" },
        { "risk_level": 1e-6, "description": "Extends 300m from process area" }
      ]
    },
    "societal_risk": {
      "pll": 0.005,
      "fn_curve_data": [
        { "n": 1, "f": 1e-3 },
        { "n": 5, "f": 5e-4 },
        { "n": 10, "f": 1e-4 },
        { "n": 50, "f": 1e-5 },
        { "n": 100, "f": 1e-6 }
      ]
    }
  },
  "risk_evaluation": {
    "overall_status": "ALARP",
    "major_risk_contributors": ["..."],
    "comparison_to_criteria": "..."
  },
  "alarp_demonstration": {
    "risk_reduction_measures": [
      {
        "measure": "...",
        "type": "Prevention/Mitigation",
        "hierarchy": "Eliminate/Substitute/Engineering/Administrative/PPE",
        "risk_reduction_factor": 10,
        "cost_estimate": "...",
        "standard_reference": "..."
      }
    ],
    "residual_risk_status": "ALARP demonstrated"
  },
  "recommendations": [
    { "id": "REC-001", "description": "...", "priority": "High/Medium/Low", "reference": "..." }
  ]
}

IMPORTANT:
- Generate at least 5-8 failure cases covering different isolatable sections
- Include at least 15-20 consequence assessments across failure cases and hole sizes
- Provide realistic IRPA values for at least 3 worker groups and 2 public locations
- FN curve data must have at least 5 data points
- Include at least 8-10 ALARP risk reduction measures
- Include at least 5 recommendations
- All values must be realistic engineering estimates based on the facility description
- All frequencies must reference industry databases (IOGP 434-1, UKOPA, etc.)
- Output ONLY valid JSON, no markdown`;

    console.log('Calling Lovable AI Gateway for QRA study...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000);

    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: prompt }
    ];
    for (const img of inputs.images) {
      contentArray.push({ type: 'image_url', image_url: { url: img.base64 } });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: contentArray }],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI Gateway request failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from AI');

    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    // Sanitize control characters
    content = content.replace(/[\x00-\x1F\x7F]/g, (c: string) => c === '\n' || c === '\r' || c === '\t' ? c : '');

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Try to extract JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Track AI usage
    try {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await serviceClient.from('ai_usage_stats').insert({
        user_id: user.id,
        function_name: 'qra-study',
        model_used: 'google/gemini-2.5-flash',
        tokens_used: content.length,
        request_count: 1,
      });
    } catch (e) {
      console.error('Failed to track AI usage:', e);
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('QRA study generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate QRA study' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
