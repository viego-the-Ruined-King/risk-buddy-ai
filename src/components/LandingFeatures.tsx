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
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut" as const
    },
  },
};

export function LandingFeatures() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Decorative elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-10 w-64 h-64 rounded-full border border-primary/10 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-10 w-48 h-48 rounded-full border border-primary/5 pointer-events-none"
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
            Features
          </motion.span>
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
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="feature-card group cursor-default"
            >
              <div className="flex items-start gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary/20"
                >
                  <feature.icon className="h-7 w-7 text-primary transition-transform duration-500 group-hover:scale-110" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
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
