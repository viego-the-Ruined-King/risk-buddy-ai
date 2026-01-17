import { motion } from "framer-motion";
import { Shield, Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Risk Assessment", href: "/app" },
  { label: "HAZID", href: "/hazid" },
  { label: "HAZOP", href: "/hazop" },
  { label: "LOPA", href: "/lopa" },
];

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer className="relative py-16 border-t border-border/50 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Logo and description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center lg:items-start gap-4"
          >
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300"
              >
                <Shield className="h-6 w-6 text-primary" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">RiskAI</span>
            </Link>
            <p className="text-sm text-muted-foreground text-center lg:text-left max-w-xs">
              Modern AI-powered risk assessment platform for safety professionals.
            </p>
          </motion.div>

          {/* Navigation Links */}
          <motion.nav 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {footerLinks.map((link, index) => (
              <motion.div
                key={link.href}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  to={link.href} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 animated-underline"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div whileHover={{ y: -2 }}>
              <Link 
                to="/auth" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 animated-underline"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.nav>

          {/* Social links and copyright */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center lg:items-end gap-4"
          >
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RiskAI. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
