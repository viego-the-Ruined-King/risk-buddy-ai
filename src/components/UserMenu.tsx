import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Languages } from 'lucide-react';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Language toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="gap-2"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{language === 'en' ? t.arabic : t.english}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-[150px]">
              {user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            {t.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
