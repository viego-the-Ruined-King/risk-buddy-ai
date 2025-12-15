-- Create hazop_studies table for IEC 61882 / EGPC-compliant HAZOP Study workflow
CREATE TABLE public.hazop_studies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    study_description TEXT,
    purpose TEXT,
    scope_in TEXT,
    scope_out TEXT,
    facility_type TEXT,
    lifecycle_phase TEXT,
    operating_parameters JSONB DEFAULT '{}'::jsonb,
    pnid_information TEXT,
    pnid_equipment TEXT,
    pnid_control_loops TEXT,
    nodes JSONB DEFAULT '[]'::jsonb,
    deviations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hazop_studies ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own HAZOP studies" 
ON public.hazop_studies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own HAZOP studies" 
ON public.hazop_studies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HAZOP studies" 
ON public.hazop_studies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own HAZOP studies" 
ON public.hazop_studies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hazop_studies_updated_at
BEFORE UPDATE ON public.hazop_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();