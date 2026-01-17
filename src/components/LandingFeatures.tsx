import { motion } from "framer-motion";
import { ShieldCheck, Zap, FileText, BarChart3, Users, Lock } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "AI-Powered Hazard Detection",
    description: "Our AI analyzes your activity descriptions and automatically identifies potential hazards using industry best practices.",
  },
  {
    icon: Zap,
    title: "Instant Risk Assessment",
    description: "Get comprehensive risk analysis in seconds, not hours. Evaluate likelihood, severity, and control measures automatically.",
  },
  {
    icon: FileText,
    title: "EGPC Risk Matrix Compliant",
    description: "Built specifically for EGPC Corporate Risk Matrix standards. Ensures compliance with industry regulations.",
  },
  {
    icon: BarChart3,
    title: "Visual Bow-Tie Diagrams",
    description: "Generate professional bow-tie diagrams showing causes, hazards, consequences, and control barriers.",
  },
  {
    icon: Users,
    title: "Multi-Study Support",
    description: "Conduct HAZID, HAZOP, LOPA, and general risk assessments all in one platform with consistent methodology.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is encrypted and stored securely. Access your studies from anywhere with cloud synchronization.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function LandingFeatures() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
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
            <span className="text-foreground">Everything you </span>
            <span className="text-gradient">need.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for safety professionals who need speed without compromising on accuracy. 
            Every feature is designed for efficiency & compliance.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="feature-card group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
