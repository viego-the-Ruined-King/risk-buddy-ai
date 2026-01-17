import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import HazidStudy from "./pages/HazidStudy";
import HazopStudy from "./pages/HazopStudy";
import LopaStudy from "./pages/LopaStudy";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected app routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/hazid" element={
              <ProtectedRoute>
                <HazidStudy />
              </ProtectedRoute>
            } />
            <Route path="/hazop" element={
              <ProtectedRoute>
                <HazopStudy />
              </ProtectedRoute>
            } />
            <Route path="/lopa" element={
              <ProtectedRoute>
                <LopaStudy />
              </ProtectedRoute>
            } />
            
            {/* Legacy routes - redirect to new paths */}
            <Route path="/hazid-study" element={
              <ProtectedRoute>
                <HazidStudy />
              </ProtectedRoute>
            } />
            <Route path="/hazop-study" element={
              <ProtectedRoute>
                <HazopStudy />
              </ProtectedRoute>
            } />
            <Route path="/lopa-study" element={
              <ProtectedRoute>
                <LopaStudy />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
