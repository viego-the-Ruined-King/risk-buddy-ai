import { motion } from "framer-motion";
import { FileText, Cpu, ClipboardCheck } from "lucide-react";

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
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Risk assessment in just </span>
            <span className="text-gradient">3 steps.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complexity. No clutter. Just a simple flow built for speed and accuracy.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative"
              >
                {/* Connector line - only on desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                
                <div className="text-center">
                  {/* Icon with number */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center pulse-glow">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
