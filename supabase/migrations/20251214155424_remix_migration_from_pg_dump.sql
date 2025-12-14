CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: hazid_studies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hazid_studies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    executive_summary text,
    purpose text,
    scope text,
    hazards jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: risk_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    activity_type text,
    location text,
    hazards jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hazid_studies hazid_studies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hazid_studies
    ADD CONSTRAINT hazid_studies_pkey PRIMARY KEY (id);


--
-- Name: risk_assessments risk_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT risk_assessments_pkey PRIMARY KEY (id);


--
-- Name: hazid_studies update_hazid_studies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hazid_studies_updated_at BEFORE UPDATE ON public.hazid_studies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: risk_assessments update_risk_assessments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hazid_studies Users can create their own HAZID studies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own HAZID studies" ON public.hazid_studies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: risk_assessments Users can create their own risk assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own risk assessments" ON public.risk_assessments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: hazid_studies Users can delete their own HAZID studies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own HAZID studies" ON public.hazid_studies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: risk_assessments Users can delete their own risk assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own risk assessments" ON public.risk_assessments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: hazid_studies Users can update their own HAZID studies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own HAZID studies" ON public.hazid_studies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: risk_assessments Users can update their own risk assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own risk assessments" ON public.risk_assessments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: hazid_studies Users can view their own HAZID studies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own HAZID studies" ON public.hazid_studies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: risk_assessments Users can view their own risk assessments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own risk assessments" ON public.risk_assessments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: hazid_studies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hazid_studies ENABLE ROW LEVEL SECURITY;

--
-- Name: risk_assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


