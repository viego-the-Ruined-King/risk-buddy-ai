import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}
export function AppLayout({
  children,
  title,
  subtitle,
  icon
}: AppLayoutProps) {
  const isMobile = useIsMobile();
  return <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - hidden on mobile, visible on tablet/desktop */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {icon}
              {title && <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">{title}</h1>
                  {subtitle && <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
                </div>}
            </div>
            <UserMenu />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>;
}