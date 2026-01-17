import { motion } from "framer-motion";
import { FileText, Cpu, ClipboardCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "1",
    title: "Describe Your Activity",
    description: "Enter details about your work activity, location, and any relevant context for the assessment.",
  },
  {
    icon: Cpu,
    number: "2",
    title: "AI Analysis",
    description: "Our AI engine analyzes your input and identifies hazards, causes, and consequences automatically.",
  },
  {
    icon: ClipboardCheck,
    number: "3",
    title: "Review & Export",
    description: "Review the comprehensive risk assessment, modify as needed, and export professional reports.",
  },
];

export function LandingSteps() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
      
      {/* Decorative glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'hsl(160 70% 50% / 0.08)' }}
      />
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            How It Works
          </motion.span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Risk assessment in just </span>
            <span className="text-gradient">3 steps.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complexity. No clutter. Just a simple flow built for speed and accuracy.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Connector line - only on desktop */}
                {index < steps.length - 1 && (
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
                    className="hidden md:flex absolute top-10 left-[60%] w-[80%] items-center origin-left"
                  >
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />
                    <ArrowRight className="h-4 w-4 text-primary/30 -ml-2" />
                  </motion.div>
                )}
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-center group"
                >
                  {/* Icon with number */}
                  <div className="relative inline-flex items-center justify-center mb-8">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center pulse-glow transition-all duration-500 group-hover:bg-primary/20"
                    >
                      <step.icon className="h-10 w-10 text-primary transition-transform duration-500 group-hover:scale-110" />
                    </motion.div>
                    <motion.span 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.15, type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      {step.number}
                    </motion.span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
