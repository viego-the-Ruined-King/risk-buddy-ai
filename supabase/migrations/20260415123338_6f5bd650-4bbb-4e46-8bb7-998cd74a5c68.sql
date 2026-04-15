
-- Fix 1: Lock down user_roles table - only admins can manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Admin-only SELECT
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only INSERT
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only UPDATE
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only DELETE
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Add admin role check to get_admin_user_stats
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(total_users bigint, active_today bigint, total_ai_requests bigint, total_tokens_used bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_activity WHERE created_at > now() - interval '24 hours') as active_today,
    (SELECT COALESCE(SUM(request_count), 0)::bigint FROM public.ai_usage_stats) as total_ai_requests,
    (SELECT COALESCE(SUM(tokens_used), 0)::bigint FROM public.ai_usage_stats) as total_tokens_used;
END;
$$;
