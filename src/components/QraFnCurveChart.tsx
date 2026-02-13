import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area } from "recharts";
import { useMemo } from "react";

interface Props {
  fnCurveData: Array<{ n: number; f: number }>;
  pll: number;
}

const QraFnCurveChart = ({ fnCurveData, pll }: Props) => {
  // Generate EGPC tolerance lines
  const toleranceLines = useMemo(() => {
    const nValues = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return {
      intolerable: nValues.map(n => ({ n, f: 0.1 / (n * n) })).filter(d => d.f >= 1e-10),
      acceptable: nValues.map(n => ({ n, f: 0.001 / (n * n) })).filter(d => d.f >= 1e-10),
    };
  }, []);

  if (fnCurveData.length === 0) return null;

  const formatTick = (value: number) => {
    if (value === 0) return "0";
    const exp = Math.log10(value);
    if (Number.isFinite(exp)) return `10^${Math.round(exp)}`;
    return value.toString();
  };

  const allData = [
    ...fnCurveData.map(d => ({ ...d, type: 'data' })),
    ...toleranceLines.intolerable.map(d => ({ ...d, type: 'intolerable' })),
    ...toleranceLines.acceptable.map(d => ({ ...d, type: 'acceptable' })),
  ];

  const minF = Math.min(...allData.map(d => d.f).filter(f => f > 0));
  const maxF = Math.max(...allData.map(d => d.f));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Societal Risk (FN Curve) - Per EGPC Annex E</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="n"
              name="N (Fatalities)"
              scale="log"
              domain={[1, 1000]}
              tickFormatter={(v) => v.toString()}
              tick={{ fontSize: 10 }}
              label={{ value: "N (Number of Fatalities)", position: "bottom", fontSize: 10, offset: 10 }}
            />
            <YAxis
              type="number"
              dataKey="f"
              name="F (Cumulative Frequency)"
              scale="log"
              domain={[minF * 0.1, maxF * 10]}
              tickFormatter={formatTick}
              tick={{ fontSize: 10 }}
              label={{ value: "F (Cum. Freq. /yr)", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <Tooltip formatter={(value: number) => value.toExponential(2)} />
            <Scatter name="Intolerable Line" data={toleranceLines.intolerable} fill="hsl(0, 80%, 50%)" line={{ stroke: "hsl(0, 80%, 50%)", strokeWidth: 2 }} legendType="line" />
            <Scatter name="Acceptable Line" data={toleranceLines.acceptable} fill="hsl(120, 60%, 45%)" line={{ stroke: "hsl(120, 60%, 45%)", strokeWidth: 2 }} legendType="line" />
            <Scatter name="Facility FN Curve" data={fnCurveData} fill="hsl(210, 80%, 50%)" line={{ stroke: "hsl(210, 80%, 50%)", strokeWidth: 2 }} shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Intolerable (F=0.1/N²)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-600 inline-block" /> Acceptable (F=0.001/N²)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Facility</span>
          <span className="text-muted-foreground">PLL: {pll?.toExponential(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default QraFnCurveChart;
