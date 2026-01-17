import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background glow */}
      <motion.div 
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, hsl(160 70% 50% / 0.2) 0%, transparent 70%)' 
        }}
      />
      
      {/* Decorative elements */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] w-32 h-32 rounded-2xl border border-primary/20 rotate-12 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full border border-primary/10 pointer-events-none"
      />
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start for free today</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="text-foreground">Ready to streamline your </span>
            <span className="text-gradient">risk assessments?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Join safety professionals who trust our platform for accurate, 
            compliant, and efficient risk assessments.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              size="lg" 
              className="btn-glow h-14 px-12 text-base font-semibold group"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
            </Button>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-primary" />
              No credit card required
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
