import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserSettings, RiskMatrixConfig } from '@/hooks/useUserSettings';
import { Loader2, Plus, X, Save, Shield, Grid3X3, Sun, Moon, Languages, Upload, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Papa from 'papaparse';

const COMMON_STANDARDS = [
  'ISO 31000', 'ISO 17776', 'ISO 31010', 'API 752', 'API 753',
  'OSHA PSM 1910.119', 'EPA RMP', 'IEC 61511', 'IEC 61508',
  'NFPA 652', 'EGPC-PSM-GL-001', 'EGPC-PSM-GL-005', 'EGPC-PSM-GL-008', 'EGPC-PSM-GL-015',
];

const RISK_LEVEL_MAP: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high', 4: 'extreme' };

const SystemConfiguration = () => {
  const { settings, isLoading, updateSettings } = useUserSettings();
  const { language, setLanguage, t } = useLanguage();

  const [standards, setStandards] = useState<string[]>([]);
  const [newStandard, setNewStandard] = useState('');
  const [matrix, setMatrix] = useState<RiskMatrixConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // File upload state
  const [matrixCsvPreview, setMatrixCsvPreview] = useState<string[][] | null>(null);
  const [refCsvPreview, setRefCsvPreview] = useState<string[][] | null>(null);
  const [matrixFileName, setMatrixFileName] = useState('');
  const [refFileName, setRefFileName] = useState('');

  useEffect(() => {
    if (settings) {
      setStandards(settings.industry_standards);
      setMatrix(settings.risk_matrix);
    }
  }, [settings]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('wolf-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('wolf-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const handleCsvUpload = useCallback((file: File, type: 'matrix' | 'references') => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (type === 'matrix') {
          setMatrixCsvPreview(data.slice(0, 20));
          setMatrixFileName(file.name);
        } else {
          setRefCsvPreview(data.slice(0, 20));
          setRefFileName(file.name);
        }
      },
      skipEmptyLines: true,
    });
  }, []);

  const handleDrop = (e: React.DragEvent, type: 'matrix' | 'references') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleCsvUpload(file, type);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'matrix' | 'references') => {
    const file = e.target.files?.[0];
    if (file) handleCsvUpload(file, type);
  };

  const addStandard = (std: string) => {
    if (std && !standards.includes(std)) {
      setStandards(prev => [...prev, std]);
    }
    setNewStandard('');
  };

  const removeStandard = (std: string) => {
    setStandards(prev => prev.filter(s => s !== std));
  };

  const handleScaleChange = (newScale: number) => {
    if (!matrix) return;
    const lLabels = Array.from({ length: newScale }, (_, i) => matrix.likelihood_labels[i] || `L${i + 1}`);
    const sLabels = Array.from({ length: newScale }, (_, i) => matrix.severity_labels[i] || `S${i + 1}`);
    const newMatrix = Array.from({ length: newScale }, (_, r) =>
      Array.from({ length: newScale }, (_, c) => {
        if (r < matrix.scale && c < matrix.scale) return matrix.matrix[r]?.[c] ?? 1;
        const sum = r + c;
        if (sum <= newScale * 0.4) return 1;
        if (sum <= newScale * 0.7) return 2;
        if (sum <= newScale * 1.1) return 3;
        return 4;
      })
    );
    setMatrix({ ...matrix, scale: newScale, likelihood_labels: lLabels, severity_labels: sLabels, matrix: newMatrix });
  };

  const updateCell = (row: number, col: number) => {
    if (!matrix) return;
    const current = matrix.matrix[row][col];
    const next = current >= 4 ? 1 : current + 1;
    const updated = matrix.matrix.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? next : c)));
    setMatrix({ ...matrix, matrix: updated });
  };

  const updateLabel = (type: 'likelihood' | 'severity', index: number, value: string) => {
    if (!matrix) return;
    if (type === 'likelihood') {
      const labels = [...matrix.likelihood_labels];
      labels[index] = value;
      setMatrix({ ...matrix, likelihood_labels: labels });
    } else {
      const labels = [...matrix.severity_labels];
      labels[index] = value;
      setMatrix({ ...matrix, severity_labels: labels });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({ industry_standards: standards, risk_matrix: matrix! });
    setIsSaving(false);
  };

  if (isLoading || !matrix) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const CsvPreviewTable = ({ data }: { data: string[][] }) => (
    <div className="overflow-x-auto max-h-64 border border-border rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted">
            {data[0]?.map((header, i) => (
              <th key={i} className="p-2 text-left font-medium text-muted-foreground whitespace-nowrap">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, ri) => (
            <tr key={ri} className="border-t border-border">
              {row.map((cell, ci) => (
                <td key={ci} className="p-2 text-foreground whitespace-normal">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              System Configuration
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure your industry standards, risk matrix, and system preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </div>

        <Tabs defaultValue="standards" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="standards" className="gap-2">
              <Shield className="h-4 w-4" /> Standards
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2">
              <Grid3X3 className="h-4 w-4" /> Risk Matrix
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Sun className="h-4 w-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="uploads" className="gap-2">
              <Upload className="h-4 w-4" /> File Upload
            </TabsTrigger>
          </TabsList>

          {/* ===== Standards Tab ===== */}
          <TabsContent value="standards">
            <Card>
              <CardHeader>
                <CardTitle>Industry Standards</CardTitle>
                <CardDescription>Select or add the regulatory standards applicable to your operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Common Standards</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_STANDARDS.filter(s => !standards.includes(s)).map(s => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => addStandard(s)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom standard..."
                    value={newStandard}
                    onChange={e => setNewStandard(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addStandard(newStandard)}
                  />
                  <Button variant="secondary" onClick={() => addStandard(newStandard)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Standards ({standards.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {standards.length === 0 && (
                      <p className="text-sm text-muted-foreground">No standards selected yet</p>
                    )}
                    {standards.map(s => (
                      <Badge key={s} className="gap-1 bg-primary/15 text-primary border-primary/30">
                        {s}
                        <button onClick={() => removeStandard(s)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Risk Matrix Tab ===== */}
          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Risk Assessment Matrix</CardTitle>
                <CardDescription>
                  Define your matrix scale, labels, and color-coded risk levels. Click cells to cycle risk level.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Label>Matrix Scale</Label>
                  <Select value={String(matrix.scale)} onValueChange={v => handleScaleChange(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 × 3</SelectItem>
                      <SelectItem value="4">4 × 4</SelectItem>
                      <SelectItem value="5">5 × 5</SelectItem>
                      <SelectItem value="6">6 × 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {Object.entries(matrix.colors).map(([level, color]) => (
                    <div key={level} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={e => setMatrix({ ...matrix, colors: { ...matrix.colors, [level]: e.target.value } })}
                        className="h-6 w-6 rounded cursor-pointer border-0"
                      />
                      <span className="text-sm capitalize text-foreground">{level}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">Severity Labels (columns)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {matrix.severity_labels.map((label, i) => (
                      <Input key={i} value={label} onChange={e => updateLabel('severity', i, e.target.value)} className="w-32" />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">Likelihood Labels (rows)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {matrix.likelihood_labels.map((label, i) => (
                      <Input key={i} value={label} onChange={e => updateLabel('likelihood', i, e.target.value)} className="w-32" />
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-xs text-muted-foreground font-medium text-left min-w-[100px]">
                          Likelihood ↓ / Severity →
                        </th>
                        {matrix.severity_labels.map((s, i) => (
                          <th key={i} className="p-2 text-xs text-center text-muted-foreground font-medium min-w-[80px]">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.likelihood_labels.map((lLabel, row) => (
                        <tr key={row}>
                          <td className="p-2 text-xs text-muted-foreground font-medium">{lLabel}</td>
                          {matrix.matrix[row]?.map((cellVal, col) => {
                            const levelKey = RISK_LEVEL_MAP[cellVal] || 'low';
                            return (
                              <td key={col} className="p-1">
                                <button
                                  onClick={() => updateCell(row, col)}
                                  className="w-full h-12 rounded-md text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                                  style={{ backgroundColor: matrix.colors[levelKey as keyof typeof matrix.colors] }}
                                  title={`Click to change: ${levelKey}`}
                                >
                                  {levelKey.charAt(0).toUpperCase()}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    View JSON Data Structure (Developer Reference)
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-64">
                    {JSON.stringify({
                      user_id: settings?.user_id || '<user-uuid>',
                      industry_standards: standards,
                      risk_matrix: matrix,
                    }, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Preferences Tab ===== */}
          <TabsContent value="preferences">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    Theme
                  </CardTitle>
                  <CardDescription>Switch between light and dark appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                      <p className="text-xs text-muted-foreground">Currently using {isDark ? 'dark' : 'light'} theme</p>
                    </div>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Language & Direction
                  </CardTitle>
                  <CardDescription>Change the interface language. Arabic enables full RTL layout.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{language === 'en' ? 'English (LTR)' : 'العربية (RTL)'}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Left-to-right layout' : 'Right-to-left layout with Cairo font'}
                      </p>
                    </div>
                    <Switch
                      checked={language === 'ar'}
                      onCheckedChange={(checked) => setLanguage(checked ? 'ar' : 'en')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== File Upload Tab ===== */}
          <TabsContent value="uploads">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Risk Matrix (CSV)</CardTitle>
                  <CardDescription>Upload a CSV file with your custom risk matrix configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'matrix')}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileInput(e, 'matrix')}
                      className="hidden"
                      id="matrix-upload"
                    />
                    <label htmlFor="matrix-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {matrixFileName || 'Drop your CSV file here or click to browse'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
                    </label>
                  </div>
                  {matrixCsvPreview && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Preview ({matrixFileName})
                      </Label>
                      <CsvPreviewTable data={matrixCsvPreview} />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Enterprise-Grade Security: Your documents are processed locally and never stored on external servers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System References / Lookups (CSV)</CardTitle>
                  <CardDescription>Upload custom reference data for your system lookups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'references')}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileInput(e, 'references')}
                      className="hidden"
                      id="ref-upload"
                    />
                    <label htmlFor="ref-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {refFileName || 'Drop your CSV file here or click to browse'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
                    </label>
                  </div>
                  {refCsvPreview && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Preview ({refFileName})
                      </Label>
                      <CsvPreviewTable data={refCsvPreview} />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Enterprise-Grade Security: Your documents are processed locally and never stored on external servers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SystemConfiguration;
