import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="relative py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">RiskAI</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            <Link 
              to="/auth" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              Sign In
            </Link>
            <Link 
              to="/hazid" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              HAZID
            </Link>
            <Link 
              to="/hazop" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              HAZOP
            </Link>
            <Link 
              to="/lopa" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              LOPA
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RiskAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
