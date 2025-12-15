import { ShieldCheck, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { 
    title: "Risk Assessment", 
    url: "/", 
    icon: ShieldCheck,
    description: "AI-powered risk analysis"
  },
  { 
    title: "HAZID Study", 
    url: "/hazid-study", 
    icon: FileText,
    description: "Hazard identification"
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          collapsed && "justify-center"
        )}>
          <div className="p-2 rounded-xl bg-primary/10 shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground">AI Hazard Guard</span>
              <span className="text-xs text-sidebar-foreground/60">Risk Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-2">
              Modules
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent/50",
                        isActive(item.url) 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-sidebar-foreground/70"
                      )}
                      activeClassName=""
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive(item.url) ? "text-primary" : "text-sidebar-foreground/60"
                      )} />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-sidebar-foreground/50">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-center gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
