import { LandingNav } from "@/components/LandingNav";
import { LandingHero } from "@/components/LandingHero";
import { LandingFeatures } from "@/components/LandingFeatures";
import { LandingSteps } from "@/components/LandingSteps";
import { LandingCTA } from "@/components/LandingCTA";
import { LandingFooter } from "@/components/LandingFooter";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to the main app
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/app");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main className="pt-16">
        <LandingHero />
        <LandingFeatures />
        <LandingSteps />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
