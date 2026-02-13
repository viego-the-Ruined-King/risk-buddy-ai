
-- Create QRA studies table
CREATE TABLE public.qra_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  facility_description TEXT,
  objective TEXT,
  lifecycle_phase TEXT,
  scope_boundaries TEXT,
  risk_types TEXT,
  assumption_register JSONB DEFAULT '[]'::jsonb,
  failure_cases JSONB DEFAULT '[]'::jsonb,
  consequence_assessment JSONB DEFAULT '[]'::jsonb,
  risk_analysis JSONB DEFAULT '{}'::jsonb,
  risk_evaluation JSONB DEFAULT '{}'::jsonb,
  alarp_demonstration JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qra_studies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create their own QRA studies" ON public.qra_studies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own QRA studies" ON public.qra_studies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own QRA studies" ON public.qra_studies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own QRA studies" ON public.qra_studies
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_qra_studies_updated_at
  BEFORE UPDATE ON public.qra_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
