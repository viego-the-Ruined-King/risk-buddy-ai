import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnimatedPage } from "@/components/AnimatedPage";
import Index from "./pages/Index";
import HazidStudy from "./pages/HazidStudy";
import HazopStudy from "./pages/HazopStudy";
import LopaStudy from "./pages/LopaStudy";
import QraStudy from "./pages/QraStudy";
import Auth from "./pages/Auth";
import SystemConfiguration from "./pages/SystemConfiguration";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminLogs from "./pages/admin/AdminLogs";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<AnimatedPage><Auth /></AnimatedPage>} />
        <Route path="/pricing" element={<AnimatedPage><Pricing /></AnimatedPage>} />
        
        {/* Hidden Admin routes */}
        <Route path="/ctrl-panel-x9k2m" element={<ProtectedRoute><AnimatedPage><AdminDashboard /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ctrl-panel-x9k2m/users" element={<ProtectedRoute><AnimatedPage><AdminUsers /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ctrl-panel-x9k2m/activity" element={<ProtectedRoute><AnimatedPage><AdminActivity /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ctrl-panel-x9k2m/logs" element={<ProtectedRoute><AnimatedPage><AdminLogs /></AnimatedPage></ProtectedRoute>} />
        
        {/* Protected app routes */}
        <Route path="/" element={<ProtectedRoute><AnimatedPage><Index /></AnimatedPage></ProtectedRoute>} />
        <Route path="/hazid" element={<ProtectedRoute><AnimatedPage><HazidStudy /></AnimatedPage></ProtectedRoute>} />
        <Route path="/hazop" element={<ProtectedRoute><AnimatedPage><HazopStudy /></AnimatedPage></ProtectedRoute>} />
        <Route path="/lopa" element={<ProtectedRoute><AnimatedPage><LopaStudy /></AnimatedPage></ProtectedRoute>} />
        <Route path="/qra" element={<ProtectedRoute><AnimatedPage><QraStudy /></AnimatedPage></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AnimatedPage><SystemConfiguration /></AnimatedPage></ProtectedRoute>} />
        
        {/* Legacy route */}
        <Route path="/app" element={<ProtectedRoute><AnimatedPage><Index /></AnimatedPage></ProtectedRoute>} />
        
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AnimatedRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
