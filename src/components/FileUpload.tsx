import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Image, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export interface UploadedFile {
  name: string;
  type: string;
  base64: string;
  size: number;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const FileUpload = ({ 
  files, 
  onFilesChange, 
  maxFiles = 5, 
  maxSizeMB = 10,
  disabled = false 
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesToProcess = Array.from(fileList);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validFiles = filesToProcess.filter(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: t.forms.fileUpload.invalidFileType,
          description: `${file.name} - PNG, JPG, WEBP, PDF`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > maxSizeBytes) {
        toast({
          title: t.forms.fileUpload.fileTooLarge,
          description: `${file.name} > ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const remainingSlots = maxFiles - files.length;
    if (validFiles.length > remainingSlots) {
      toast({
        title: t.forms.fileUpload.tooManyFiles,
        description: `Max ${maxFiles}`,
        variant: "destructive",
      });
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    if (filesToAdd.length === 0) return;

    setIsProcessing(true);
    try {
      const processedFiles = await Promise.all(
        filesToAdd.map(async (file) => {
          const base64 = await convertToBase64(file);
          return { name: file.name, type: file.type, base64, size: file.size };
        })
      );
      onFilesChange([...files, ...processedFiles]);
    } catch (error) {
      toast({
        title: t.common.error,
        description: "Failed to process files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files, maxFiles, maxSizeMB, onFilesChange, toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;
    processFiles(e.dataTransfer.files);
  }, [disabled, isProcessing, processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) setIsDragging(true);
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm sm:text-base font-semibold">
        {t.forms.fileUpload.attachments}
      </Label>
      <p className="text-xs text-muted-foreground">
        {t.forms.fileUpload.attachmentsDesc}
      </p>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && !isProcessing && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{t.forms.fileUpload.processingFiles}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-primary font-medium">{t.forms.fileUpload.clickToUpload}</span>
              <span className="text-muted-foreground"> {t.forms.fileUpload.orDragDrop}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {t.forms.fileUpload.fileTypes} (max {maxSizeMB}MB, {maxFiles} files)
            </span>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-border/50">
              {file.type.startsWith('image/') ? (
                <img src={file.base64} alt={file.name} className="h-10 w-10 object-cover rounded" />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;