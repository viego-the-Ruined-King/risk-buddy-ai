-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only admins can view)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create system_logs table
CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert logs"
ON public.system_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create ai_usage_stats table
CREATE TABLE public.ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    function_name TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    request_count INTEGER DEFAULT 1,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all AI usage"
ON public.ai_usage_stats FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own AI usage"
ON public.ai_usage_stats FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage"
ON public.ai_usage_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create user_activity table
CREATE TABLE public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    metadata JSONB DEFAULT '{}',
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity"
ON public.user_activity FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own activity"
ON public.user_activity FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
ON public.user_activity FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create admin view for users (excludes sensitive auth data)
CREATE VIEW public.admin_users_view
WITH (security_invoker = on)
AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    ur.role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Grant access to the view
GRANT SELECT ON public.admin_users_view TO authenticated;

-- Create function to get user stats for admin
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_today BIGINT,
    total_ai_requests BIGINT,
    total_tokens_used BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_activity WHERE created_at > now() - interval '24 hours') as active_today,
    (SELECT COALESCE(SUM(request_count), 0) FROM public.ai_usage_stats) as total_ai_requests,
    (SELECT COALESCE(SUM(tokens_used), 0) FROM public.ai_usage_stats) as total_tokens_used
$$;