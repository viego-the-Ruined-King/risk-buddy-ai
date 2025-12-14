import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface ExportableBowTieDiagramProps {
  children: React.ReactNode;
  title: string;
  hazardId: string;
}

const ExportableBowTieDiagram = ({ children, title, hazardId }: ExportableBowTieDiagramProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  };

  const handleExportPNG = async () => {
    if (!diagramRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(diagramRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `BowTie_${sanitizeFilename(hazardId)}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export Successful",
        description: "Bow Tie diagram exported as PNG.",
      });
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export diagram as PNG.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!diagramRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(diagramRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Calculate PDF dimensions (A4 landscape for better diagram fit)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add title header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bow Tie Analysis', 14, 15);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Hazard: ${title}`, 14, 22);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
      
      // Calculate image dimensions to fit within the page
      const margin = 14;
      const headerHeight = 35;
      const maxWidth = pdfWidth - margin * 2;
      const maxHeight = pdfHeight - headerHeight - margin;
      
      const imgRatio = img.width / img.height;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / imgRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * imgRatio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = headerHeight;
      
      pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      
      pdf.save(`BowTie_${sanitizeFilename(hazardId)}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Bow Tie diagram exported as PDF.",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export diagram as PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPNG}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileImage className="h-4 w-4" />
          )}
          Export PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>
      
      {/* Diagram container for export */}
      <div ref={diagramRef} className="bg-background rounded-lg">
        {children}
      </div>
    </div>
  );
};

export default ExportableBowTieDiagram;
