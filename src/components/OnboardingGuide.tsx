import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  FileText,
  ClipboardList,
  Layers,
  ArrowRight,
  ArrowLeft,
  Rocket,
  HelpCircle,
  History,
  Upload,
  Brain,
  Download,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  steps: {
    icon: React.ReactNode;
    text: string;
  }[];
}

const guideSteps: GuideStep[] = [
  {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: "Welcome to W.O.L.F AI",
    subtitle: "Your AI-powered Risk Management System",
    steps: [
      {
        icon: <Brain className="h-4 w-4 text-primary" />,
        text: "W.O.L.F AI helps you conduct professional risk assessments using AI and EGPC standards.",
      },
      {
        icon: <ShieldCheck className="h-4 w-4 text-primary" />,
        text: "Navigate between modules using the sidebar (desktop) or bottom navigation (mobile).",
      },
      {
        icon: <History className="h-4 w-4 text-primary" />,
        text: "All your studies are saved automatically and can be loaded from Study History on each page.",
      },
      {
        icon: <Download className="h-4 w-4 text-primary" />,
        text: "Export your results to Excel or PDF from any study's results section.",
      },
    ],
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Risk Assessment",
    subtitle: "AI-powered hazard identification using EGPC Corporate Risk Matrix",
    steps: [
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>,
        text: "Fill in the activity details: title, description, activity type, and location.",
      },
      {
        icon: <Upload className="h-4 w-4 text-primary" />,
        text: "Optionally upload supporting documents (PDF, images) for more accurate analysis.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>,
        text: "Click 'Assess Risks' and the AI will identify hazards with likelihood, severity, and risk rankings.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>,
        text: "Review the results table with risk matrix, bow-tie diagrams, and recommended controls.",
      },
      {
        icon: <Save className="h-4 w-4 text-primary" />,
        text: "Save your study and export to Excel for reporting and record-keeping.",
      },
    ],
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "HAZID Study",
    subtitle: "Professional Hazard Identification aligned with EGPC Standards",
    steps: [
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>,
        text: "Enter the study title, executive summary, purpose, and scope of the study.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>,
        text: "Provide process design parameters, material hazard data, and key instrument lists.",
      },
      {
        icon: <Upload className="h-4 w-4 text-primary" />,
        text: "Upload P&IDs or process documents for the AI to analyze.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>,
        text: "Click 'Generate HAZID' — AI identifies hazards with initial, current, and residual risk rankings.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">4</span>,
        text: "Review the HAZID worksheet, edit entries inline, and export the full report to Excel.",
      },
    ],
  },
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: "HAZOP Study",
    subtitle: "IEC 61882 / EGPC-PSM-GL-005 Compliant HAZOP Analysis",
    steps: [
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>,
        text: "Define the study: title, description, purpose, scope (in/out), facility type, and lifecycle phase.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>,
        text: "Set operating parameters (flow, pressure, temperature, level) and P&ID information.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>,
        text: "Define process nodes with boundaries and operating modes for systematic analysis.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">4</span>,
        text: "Click 'Generate HAZOP' — AI creates deviations with causes, consequences, safeguards, and risk rankings.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">5</span>,
        text: "From HAZOP results, you can directly start a LOPA analysis for any high-risk deviation.",
      },
    ],
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: "LOPA Study",
    subtitle: "Layer of Protection Analysis per EGPC-PSM-GL-015",
    steps: [
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>,
        text: "Start from a HAZOP deviation or create a standalone scenario with title and equipment number.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>,
        text: "Define the consequence category (People, Environment, Assets) and severity level.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>,
        text: "Click 'Generate LOPA' — AI calculates initiating events, IPLs, and conditional modifiers.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">4</span>,
        text: "Review the LOPA worksheet with IEL calculations, SIL requirements, and PFD targets.",
      },
      {
        icon: <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">5</span>,
        text: "Check recommendations for additional protection layers if risk is not tolerable.",
      },
    ],
  },
];

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("wolf-ai-onboarding-seen");
    if (!hasSeenGuide) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("wolf-ai-onboarding-seen", "true");
    setOpen(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = guideSteps[currentStep];
  const isLast = currentStep === guideSteps.length - 1;

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => {
          setCurrentStep(0);
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Open guide"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-center sm:text-center space-y-3">
            <div className="flex justify-center">{step.icon}</div>
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {step.subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {step.steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="shrink-0 mt-0.5">{s.icon}</div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 py-2">
            {guideSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  i === currentStep
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} size="sm">
                Skip
              </Button>
              <Button onClick={handleNext} size="sm">
                {isLast ? "Get Started" : "Next"}
                {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
