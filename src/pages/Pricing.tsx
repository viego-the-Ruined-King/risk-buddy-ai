import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Testimonials from "@/components/Testimonials";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const p = t.pricing;

  const tiers = [
    {
      name: p.tier1.name,
      price: isAnnual ? p.tier1.priceAnnual : p.tier1.price,
      features: p.tier1.features,
      featured: false,
      cta: p.getStarted,
      custom: false,
    },
    {
      name: p.tier2.name,
      price: isAnnual ? p.tier2.priceAnnual : p.tier2.price,
      features: p.tier2.features,
      featured: true,
      cta: p.getStarted,
      custom: false,
    },
    {
      name: p.tier3.name,
      price: null,
      features: p.tier3.features,
      featured: false,
      cta: p.contactSales,
      custom: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.notFound.returnHome}
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">{p.title}</h1>
          <p className="text-lg text-muted-foreground mb-8">{p.subtitle}</p>

          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted/50 border border-border/50">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
            >
              {p.monthly}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
            >
              {p.annual}
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                {p.savePercent}
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                tier.featured
                  ? "bg-card/60 backdrop-blur-xl border-primary/40 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] scale-[1.02]"
                  : "bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/20"
              }`}
            >
              {tier.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  {p.mostPopular}
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <div className="mt-4">
                  {tier.custom ? (
                    <span className="text-3xl font-bold text-foreground">{p.custom}</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                      <span className="text-muted-foreground text-sm">
                        {isAnnual ? p.perMonthBilled : p.perMonth}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${tier.featured ? "" : "variant-outline"}`}
                variant={tier.featured ? "default" : "outline"}
                onClick={() => {
                  if (tier.custom) {
                    window.location.href = "mailto:omarradwan781@gmail.com?subject=Enterprise%20Inquiry%20-%20W.O.L.F%20AI";
                  } else {
                    navigate("/auth");
                  }
                }}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        <Testimonials />
      </div>
    </div>
  );
};

export default Pricing;
