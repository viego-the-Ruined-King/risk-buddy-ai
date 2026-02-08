import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, ShieldCheck, Languages } from 'lucide-react';

// Input validation schemas
const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72, { message: "Password must be less than 72 characters" });

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateInputs = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Language toggle - top corner */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="fixed top-4 end-4 z-50 gap-2"
      >
        <Languages className="h-4 w-4" />
        {language === 'en' ? t.arabic : t.english}
      </Button>

      <Card className="w-full max-w-md bg-card/40 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
          </CardTitle>
          <CardDescription>
            {isLogin ? t.auth.signInDescription : t.auth.signUpDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
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
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder={t.auth.passwordPlaceholder}
                disabled={isLoading}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
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

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
