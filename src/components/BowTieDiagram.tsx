import { motion } from "framer-motion";
import { Shield, AlertTriangle, Flame, ArrowRight, ArrowLeft } from "lucide-react";
import type { HazidHazard } from "@/pages/HazidStudy";

interface BowTieDiagramProps {
  hazard: HazidHazard;
}

// Helper to parse string or array fields
const parseField = (field: string | string[] | undefined, limit: number, fallback?: string): string[] => {
  if (Array.isArray(field)) {
    return field.map(c => String(c).trim()).filter(c => c.length > 0).slice(0, limit);
  }
  if (typeof field === 'string') {
    return field.split(/[,;•\n]/).map(c => c.trim()).filter(c => c.length > 0).slice(0, limit);
  }
  return fallback ? [fallback] : [];
};

const BowTieDiagram = ({ hazard }: BowTieDiagramProps) => {
  // Parse causes from possible_causes (string or array)
  const causes = parseField(hazard.possible_causes, 4, "Unknown cause");

  // Parse consequences from consequences (string or array)
  const consequences = parseField(hazard.consequences, 4, "Unknown consequence");

  // Parse existing controls as prevention barriers
  const preventionBarriers = parseField(hazard.existing_controls, 3);

  // Parse recommendations as mitigation barriers
  const mitigationBarriers = parseField(hazard.recommendations, 3);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-foreground">{hazard.h_no}: Bow Tie Analysis</h3>
          <p className="text-sm text-muted-foreground">{hazard.hazard_description}</p>
        </div>

        <div className="flex items-stretch justify-center gap-2">
          {/* Left Side - Causes */}
          <div className="flex flex-col justify-center gap-2 w-40">
            <div className="text-xs font-semibold text-center text-muted-foreground mb-2 uppercase tracking-wider">
              Threats / Causes
            </div>
            {causes.map((cause, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-xs text-center"
              >
                {cause}
              </motion.div>
            ))}
          </div>

          {/* Left Arrows */}
          <div className="flex flex-col justify-center items-center w-8">
            {causes.map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex-1 flex items-center"
              >
                <ArrowRight className="h-4 w-4 text-destructive/50" />
              </motion.div>
            ))}
          </div>

          {/* Prevention Barriers */}
          <div className="flex flex-col justify-center gap-1 w-28">
            <div className="text-xs font-semibold text-center text-muted-foreground mb-2 uppercase tracking-wider">
              Prevention
            </div>
            {preventionBarriers.length > 0 ? (
              preventionBarriers.map((barrier, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="bg-primary/20 border-2 border-primary/50 rounded p-1.5 text-[10px] text-center font-medium flex items-center gap-1"
                >
                  <Shield className="h-3 w-3 text-primary shrink-0" />
                  <span className="line-clamp-2">{barrier}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-[10px] text-muted-foreground text-center italic">
                No barriers identified
              </div>
            )}
          </div>

          {/* Left Arrow to Center */}
          <div className="flex items-center w-6">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7 }}
              className="w-full h-0.5 bg-gradient-to-r from-destructive/30 to-destructive"
            />
          </div>

          {/* Center - Top Event (Hazard) */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="flex flex-col items-center justify-center w-32"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground rounded-full p-4 shadow-lg">
                <Flame className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-destructive">
                Top Event
              </div>
              <div className="text-xs text-foreground mt-1 max-w-[120px]">
                {hazard.top_event || "Hazardous Event"}
              </div>
            </div>
          </motion.div>

          {/* Right Arrow from Center */}
          <div className="flex items-center w-6">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9 }}
              className="w-full h-0.5 bg-gradient-to-r from-[hsl(var(--risk-warning))] to-[hsl(var(--risk-warning))]/30"
            />
          </div>

          {/* Mitigation Barriers */}
          <div className="flex flex-col justify-center gap-1 w-28">
            <div className="text-xs font-semibold text-center text-muted-foreground mb-2 uppercase tracking-wider">
              Mitigation
            </div>
            {mitigationBarriers.length > 0 ? (
              mitigationBarriers.map((barrier, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="bg-[hsl(var(--risk-low))]/20 border-2 border-[hsl(var(--risk-low))]/50 rounded p-1.5 text-[10px] text-center font-medium flex items-center gap-1"
                >
                  <Shield className="h-3 w-3 text-[hsl(var(--risk-low))] shrink-0" />
                  <span className="line-clamp-2">{barrier}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-[10px] text-muted-foreground text-center italic">
                No barriers identified
              </div>
            )}
          </div>

          {/* Right Arrows */}
          <div className="flex flex-col justify-center items-center w-8">
            {consequences.map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                className="flex-1 flex items-center"
              >
                <ArrowRight className="h-4 w-4 text-[hsl(var(--risk-warning))]/50" />
              </motion.div>
            ))}
          </div>

          {/* Right Side - Consequences */}
          <div className="flex flex-col justify-center gap-2 w-40">
            <div className="text-xs font-semibold text-center text-muted-foreground mb-2 uppercase tracking-wider">
              Consequences
            </div>
            {consequences.map((consequence, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + idx * 0.1 }}
                className="bg-[hsl(var(--risk-warning))]/10 border border-[hsl(var(--risk-warning))]/30 rounded-lg p-2 text-xs text-center"
              >
                {consequence}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
            <span className="text-muted-foreground">Threats/Causes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Prevention Barriers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-destructive" />
            <span className="text-muted-foreground">Top Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-[hsl(var(--risk-low))]" />
            <span className="text-muted-foreground">Mitigation Barriers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[hsl(var(--risk-warning))]/20 border border-[hsl(var(--risk-warning))]/30" />
            <span className="text-muted-foreground">Consequences</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowTieDiagram;
