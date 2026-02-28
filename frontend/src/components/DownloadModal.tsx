import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, FileSpreadsheet, Printer, Download, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formats?: ("pdf" | "excel" | "print")[];
  previewData?: { headers: string[]; rows: string[][] };
}

export function DownloadModal({ open, onClose, title, formats = ["pdf", "excel", "print"], previewData }: DownloadModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);

  const handleDownload = (format: string) => {
    setDownloading(format);
    setCompleted(null);
    setTimeout(() => {
      setDownloading(null);
      setCompleted(format);
      toast({ title: "Download Complete", description: `${title} has been downloaded as ${format.toUpperCase()}.` });
      setTimeout(() => setCompleted(null), 2000);
    }, 1500);
  };

  const formatConfig = {
    pdf: { icon: FileText, label: "PDF Document", color: "text-destructive" },
    excel: { icon: FileSpreadsheet, label: "Excel Spreadsheet", color: "text-success" },
    print: { icon: Printer, label: "Print Preview", color: "text-info" },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-card-hover mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            {/* Preview Table */}
            {previewData && (
              <div className="mb-4 max-h-48 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/50 border-b border-border">
                    {previewData.headers.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-foreground">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {row.map((cell, j) => <td key={j} className="px-3 py-2 text-muted-foreground">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Format buttons */}
            <div className="space-y-2">
              {formats.map(fmt => {
                const cfg = formatConfig[fmt];
                const isLoading = downloading === fmt;
                const isDone = completed === fmt;
                return (
                  <motion.div key={fmt} whileHover={{ scale: 1.01 }} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 card-hover">
                    <div className="flex items-center gap-3">
                      <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                      <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={() => handleDownload(fmt)} disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isDone ? <Check className="h-4 w-4 text-success" /> : <Download className="h-4 w-4" />}
                      {isLoading ? "Downloading..." : isDone ? "Done" : "Download"}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
