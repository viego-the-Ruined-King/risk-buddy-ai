-- Create lopa_studies table for Layer of Protection Analysis
CREATE TABLE public.lopa_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- HAZOP Linkage
  hazop_study_id UUID REFERENCES public.hazop_studies(id) ON DELETE SET NULL,
  hazop_deviation_id TEXT,
  
  -- Scenario Identification (per EGPC Annex D)
  scenario_number TEXT NOT NULL,
  equipment_number TEXT,
  scenario_title TEXT NOT NULL,
  
  -- Consequence Data
  consequence_description TEXT,
  consequence_category TEXT, -- People, Environment, Assets
  severity_level TEXT, -- Disastrous, Catastrophic, Major, Serious, Minor, Notable
  
  -- TMEL (per EGPC Table 1)
  tmel DECIMAL,
  tmel_basis TEXT,
  
  -- HAZOP Source Data
  hazop_node_id TEXT,
  hazop_deviation TEXT,
  hazop_causes JSONB DEFAULT '[]'::jsonb,
  hazop_consequences TEXT,
  hazop_existing_safeguards JSONB DEFAULT '[]'::jsonb,
  hazop_initial_risk JSONB,
  
  -- Initiating Events (per EGPC Annex A)
  initiating_events JSONB DEFAULT '[]'::jsonb,
  -- Format: [{name: string, frequency: number, source: string}]
  
  -- Independent Protection Layers (per EGPC Annex B)
  ipls JSONB DEFAULT '[]'::jsonb,
  -- Format: [{type: string, name: string, pfd: number, source: string}]
  
  -- Enabling Conditions
  enabling_conditions JSONB DEFAULT '{}'::jsonb,
  -- Format: {description: string, probability: number}
  
  -- Conditional Modifiers (per EGPC Annex C)
  conditional_modifiers JSONB DEFAULT '{}'::jsonb,
  -- Format: {time_at_risk: number, ignition_probability: number, vulnerability: number}
  
  -- Calculated Results
  iel_per_initiating_event JSONB DEFAULT '[]'::jsonb,
  -- Format: [{initiating_event: string, iel: number}]
  total_iel DECIMAL,
  frequency_mitigated_consequences DECIMAL,
  total_mitigated_event_frequency DECIMAL,
  
  -- SIF Requirements
  pfd_target DECIMAL,
  pfd_target_safety DECIMAL,
  pfd_target_environment DECIMAL,
  pfd_target_financial DECIMAL,
  sil_required TEXT, -- None, SIL-1, SIL-2, SIL-3, SIL-4
  sil_safety TEXT,
  sil_environment TEXT,
  sil_financial TEXT,
  
  -- Recommendations and Notes
  recommendations TEXT,
  notes_assumptions TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'draft', -- draft, completed, approved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lopa_studies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own LOPA studies"
ON public.lopa_studies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own LOPA studies"
ON public.lopa_studies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LOPA studies"
ON public.lopa_studies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LOPA studies"
ON public.lopa_studies
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lopa_studies_updated_at
BEFORE UPDATE ON public.lopa_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();