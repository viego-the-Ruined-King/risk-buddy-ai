import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Languages, Eye, EyeOff } from 'lucide-react';
import wolfLogo from '@/assets/wolf-logo.jpg';
import wolfIcon from '@/assets/wolf-icon.png';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters" }).max(72);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateInputs = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t.auth.loginFailed,
            description: error.message.includes('Invalid login credentials')
              ? t.auth.invalidCredentials
              : error.message,
            variant: "destructive",
          });
          return;
        }
        toast({ title: t.auth.welcomeBackToast, description: t.auth.loginSuccess });
        navigate('/');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: error.message.includes('User already registered') ? t.auth.accountExists : t.auth.signUpFailed,
            description: error.message.includes('User already registered')
              ? t.auth.accountExistsDesc
              : error.message,
            variant: "destructive",
          });
          return;
        }
        toast({ title: t.auth.accountCreated, description: t.auth.signUpSuccess });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[hsl(160,20%,8%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[hsl(160,20%,8%)] p-4 overflow-hidden">
      {/* Language toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="fixed top-4 end-4 z-50 gap-2 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
      >
        <Languages className="h-4 w-4" />
        {language === 'en' ? t.arabic : t.english}
      </Button>

      {/* Main container */}
      <div className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 h-[min(90vh,700px)]">
        
        {/* ===== LEFT COLUMN — Media Panel ===== */}
        <div className="relative overflow-hidden hidden md:block bg-[hsl(160,20%,6%)]">
          {/* Static image (always rendered behind video) */}
          <img
            src={wolfLogo}
            alt="W.O.L.F"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Video (fades out when finished) */}
          <video
            autoPlay
            muted
            playsInline
            onEnded={() => setIsVideoFinished(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              isVideoFinished ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <source src="/videos/wolf-intro.mp4" type="video/mp4" />
          </video>

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top-left quote label */}
          <div className="absolute top-8 left-8 z-10">
            <p className="text-white/70 text-xs tracking-[0.25em] uppercase font-medium">
              A Wise Quote
            </p>
            <hr className="mt-2 border-white/30 w-16" />
          </div>

          {/* Bottom-left heading */}
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <h2 className="font-serif text-3xl md:text-4xl text-white font-semibold leading-tight">
              Get Everything<br />You Want
            </h2>
            <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
              You can get everything you want if you work hard, trust the process, and stick to the plan.
            </p>
          </div>
        </div>

        {/* ===== RIGHT COLUMN — Form Panel ===== */}
        <div className="bg-white flex flex-col justify-center px-8 py-10 md:px-12 md:py-14 overflow-y-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={wolfIcon} alt="W.O.L.F Logo" className="h-16 w-auto object-contain" />
          </div>

          {/* Heading */}
          <h1 className="font-serif text-2xl md:text-3xl text-[hsl(160,20%,10%)] text-center font-semibold">
            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
          </h1>
          <p className="text-center text-[hsl(160,10%,50%)] text-sm mt-2 mb-8">
            {isLogin ? t.auth.signInDescription : t.auth.signUpDescription}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[hsl(160,20%,15%)] text-sm font-medium">
                {t.auth.email}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder={t.auth.emailPlaceholder}
                disabled={isLoading}
                className={`bg-[hsl(0,0%,97%)] border-[hsl(0,0%,90%)] text-[hsl(160,20%,10%)] placeholder:text-[hsl(0,0%,60%)] focus-visible:ring-primary ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[hsl(160,20%,15%)] text-sm font-medium">
                {t.auth.password}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder={t.auth.passwordPlaceholder}
                  disabled={isLoading}
                  className={`bg-[hsl(0,0%,97%)] border-[hsl(0,0%,90%)] text-[hsl(160,20%,10%)] placeholder:text-[hsl(0,0%,60%)] pr-10 focus-visible:ring-primary ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0,0%,50%)] hover:text-[hsl(160,20%,10%)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Remember me + Forgot */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="border-[hsl(0,0%,80%)]" />
                  <Label htmlFor="remember" className="text-sm text-[hsl(0,0%,40%)] font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button type="button" className="text-sm text-[hsl(160,20%,15%)] hover:underline">
                  Forgot Password
                </button>
              </div>
            )}

            {/* Sign In button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[hsl(160,20%,10%)] text-white hover:bg-[hsl(160,20%,15%)] rounded-lg h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                  {isLogin ? t.auth.signingIn : t.auth.creatingAccount}
                </>
              ) : (
                isLogin ? t.auth.signIn : t.auth.signUp
              )}
            </Button>
          </form>

          {/* Footer toggle */}
          <p className="mt-8 text-center text-sm text-[hsl(0,0%,50%)]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="font-semibold text-[hsl(160,20%,10%)] hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
