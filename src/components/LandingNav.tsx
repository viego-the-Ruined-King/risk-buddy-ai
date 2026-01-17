import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Risk Assessment", href: "/app" },
  { label: "HAZID", href: "/hazid" },
  { label: "HAZOP", href: "/hazop" },
  { label: "LOPA", href: "/lopa" },
];

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className={`absolute inset-0 transition-all duration-500 ${
        scrolled 
          ? "glass border-b border-border/30 shadow-lg" 
          : "bg-transparent"
      }`} />
      
      <nav className="relative container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"
          >
            <Shield className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </motion.div>
          <span className="text-lg font-bold text-foreground tracking-tight">RiskAI</span>
        </Link>

        {/* Desktop navigation - centered */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 p-1 rounded-full glass border border-border/30">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  to={link.href}
                  className="nav-link rounded-full"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop CTA - right aligned */}
        <div className="hidden md:flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-300"
            >
              Sign In
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              size="sm" 
              className="btn-glow group"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden relative overflow-hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
          >
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border-b border-border/30 px-4 py-6 space-y-2"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    to={link.href}
                    className="flex items-center justify-between text-base text-muted-foreground hover:text-foreground transition-all duration-300 py-3 px-4 rounded-xl hover:bg-primary/5 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                </motion.div>
              ))}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4 flex flex-col gap-3"
              >
                <Button 
                  variant="outline" 
                  className="w-full justify-center btn-secondary-hover"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full justify-center btn-glow"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
