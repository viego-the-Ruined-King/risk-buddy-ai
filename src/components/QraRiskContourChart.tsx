import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

interface IrpaEntry {
  group?: string;
  location?: string;
  irpa_value: number;
  status: string;
}

interface Props {
  irpaWorkers: IrpaEntry[];
  irpaPublic: IrpaEntry[];
}

const QraRiskContourChart = ({ irpaWorkers, irpaPublic }: Props) => {
  const allData = [
    ...irpaWorkers.map(w => ({ name: w.group || "Workers", value: w.irpa_value, status: w.status, type: "Worker" })),
    ...irpaPublic.map(p => ({ name: p.location || "Public", value: p.irpa_value, status: p.status, type: "Public" })),
  ];

  if (allData.length === 0) return null;

  const getBarColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("intolerable")) return "hsl(0, 80%, 50%)";
    if (s.includes("alarp")) return "hsl(45, 90%, 50%)";
    return "hsl(120, 60%, 45%)";
  };

  const formatTick = (value: number) => {
    if (value === 0) return "0";
    const exp = Math.log10(value);
    return `10^${Math.round(exp)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Individual Risk (IRPA) - Per EGPC Annex E</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={allData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" scale="log" domain={[1e-8, 1e-2]} tickFormatter={formatTick} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number) => value.toExponential(2)} labelStyle={{ fontWeight: "bold" }} />
            <ReferenceLine x={1e-3} stroke="hsl(0, 80%, 50%)" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Max Workers 10⁻³", position: "top", fontSize: 9 }} />
            <ReferenceLine x={1e-4} stroke="hsl(30, 90%, 50%)" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Max Public 10⁻⁴", position: "top", fontSize: 9 }} />
            <ReferenceLine x={1e-6} stroke="hsl(120, 60%, 45%)" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Acceptable 10⁻⁶", position: "top", fontSize: 9 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {allData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Intolerable</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> ALARP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600" /> Acceptable</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default QraRiskContourChart;
