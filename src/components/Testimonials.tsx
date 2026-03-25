import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const testimonials = [
  {
    name: "Dr. Ahmed Hassan",
    title: "Lead Process Safety Engineer",
    company: "National Petroleum Co.",
    initials: "AH",
    quote: "W.O.L.F AI has transformed how we conduct HAZID and HAZOP studies. What used to take weeks now takes hours, with consistent quality aligned to EGPC standards.",
    quoteAr: "لقد غيّر W.O.L.F AI طريقة إجراء دراسات HAZID و HAZOP. ما كان يستغرق أسابيع أصبح يتم في ساعات، مع جودة ثابتة متوافقة مع معايير EGPC.",
    rating: 5,
  },
  {
    name: "Eng. Sarah Al-Mansouri",
    title: "HSE Manager",
    company: "Gulf Engineering Services",
    initials: "SA",
    quote: "The LOPA module with automatic SIL determination saved us significant engineering hours. The EGPC-compliant exports are exactly what our clients need.",
    quoteAr: "وحدة LOPA مع تحديد SIL التلقائي وفرت لنا ساعات هندسية كبيرة. التصدير المتوافق مع EGPC هو بالضبط ما يحتاجه عملاؤنا.",
    rating: 5,
  },
  {
    name: "Eng. Mohamed Farid",
    title: "Risk Assessment Consultant",
    company: "Independent Consultant",
    initials: "MF",
    quote: "As a freelance consultant, W.O.L.F AI gives me enterprise-level capabilities. The QRA module with FN curves and IRPA analysis is remarkably comprehensive.",
    quoteAr: "كمستشار مستقل، يمنحني W.O.L.F AI قدرات على مستوى المؤسسات. وحدة QRA مع منحنيات FN وتحليل IRPA شاملة بشكل ملحوظ.",
    rating: 5,
  },
];

const Testimonials = () => {
  const { t, language } = useLanguage();
  const pt = t.pricing.testimonials;

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground">{pt.title}</h2>
        <p className="text-muted-foreground mt-2">{pt.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
              "{language === 'ar' ? t.quoteAr : t.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.title}, {t.company}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
