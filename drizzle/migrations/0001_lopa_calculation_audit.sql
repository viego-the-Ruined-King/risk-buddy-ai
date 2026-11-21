CREATE TABLE public.lopa_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lopa_study_id uuid REFERENCES public.lopa_studies(id) ON DELETE SET NULL,
  engine_version text NOT NULL,
  methodology text NOT NULL,
  reference_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  inputs jsonb NOT NULL,
  input_hash text NOT NULL,
  outputs jsonb NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lopa_calculations TO authenticated;
GRANT ALL ON public.lopa_calculations TO service_role;
ALTER TABLE public.lopa_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own LOPA calculations" ON public.lopa_calculations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX lopa_calculations_study_idx ON public.lopa_calculations(lopa_study_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_lopa_calculation_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.lopa_study_id IS NULL THEN
    RAISE EXCEPTION 'LOPA calculation records are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.lopa_study_id IS NULL AND OLD.lopa_study_id IS NOT NULL
     AND NEW.id = OLD.id AND NEW.outputs = OLD.outputs AND NEW.inputs = OLD.inputs THEN
    RETURN NEW; -- allow ON DELETE SET NULL from parent study
  END IF;
  RAISE EXCEPTION 'LOPA calculation records are immutable';
END $$;
CREATE TRIGGER lopa_calculations_immutable
  BEFORE UPDATE OR DELETE ON public.lopa_calculations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_lopa_calculation_mutation();

ALTER TABLE public.lopa_studies
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS latest_calculation_id uuid REFERENCES public.lopa_calculations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS engine_version text;

CREATE OR REPLACE FUNCTION public.protect_approved_lopa_study()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.approved_at IS NOT NULL THEN RAISE EXCEPTION 'Approved LOPA studies cannot be deleted'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'Approved LOPA studies are locked; create a new revision instead';
  END IF;
  IF coalesce(auth.role(), '') <> 'service_role' AND (
       NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
    OR NEW.latest_calculation_id IS DISTINCT FROM OLD.latest_calculation_id
    OR NEW.engine_version IS DISTINCT FROM OLD.engine_version) THEN
    RAISE EXCEPTION 'Approval and calculation fields can only be set by the backend';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lopa_studies_protect_approved
  BEFORE UPDATE OR DELETE ON public.lopa_studies
  FOR EACH ROW EXECUTE FUNCTION public.protect_approved_lopa_study();

CREATE OR REPLACE FUNCTION public.guard_lopa_study_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.approved_at := NULL; NEW.approved_by := NULL; NEW.approval_status := 'draft';
    NEW.latest_calculation_id := NULL; NEW.engine_version := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lopa_studies_guard_insert
  BEFORE INSERT ON public.lopa_studies
  FOR EACH ROW EXECUTE FUNCTION public.guard_lopa_study_insert();