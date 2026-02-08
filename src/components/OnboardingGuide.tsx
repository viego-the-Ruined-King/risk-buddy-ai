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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const stepIcons = [
  <Rocket className="h-8 w-8 text-primary" />,
  <ShieldCheck className="h-8 w-8 text-primary" />,
  <FileText className="h-8 w-8 text-primary" />,
  <ClipboardList className="h-8 w-8 text-primary" />,
  <Layers className="h-8 w-8 text-primary" />,
];

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { t, isRTL } = useLanguage();

  const guideSteps = t.guide.steps;

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

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => {
          setCurrentStep(0);
          setOpen(true);
        }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label={t.openGuide}
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-center sm:text-center space-y-3">
            <div className="flex justify-center">{stepIcons[currentStep]}</div>
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {step.subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {step.items.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="shrink-0 mt-0.5">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {i + 1}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {text}
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
                aria-label={`${i + 1}`}
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
              <PrevIcon className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t.guide.previous}
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} size="sm">
                {t.guide.skip}
              </Button>
              <Button onClick={handleNext} size="sm">
                {isLast ? t.guide.getStarted : t.guide.next}
                {!isLast && <NextIcon className="h-4 w-4 ltr:ml-1 rtl:mr-1" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
