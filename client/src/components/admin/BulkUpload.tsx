import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import { useToast } from '../ui/use-toast';

export const BulkUpload = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ created: number, failed: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/admin/users/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.failed.length === 0) {
        toast({ title: 'Success', description: `Created ${data.created} users`, variant: 'success' });
      } else {
        toast({ title: 'Partial Success', description: `Created ${data.created}, Failed ${data.failed.length}`, variant: 'warning' });
      }
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.response?.data?.error || 'Server error', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Role\nJohn Doe,john@example.com,STUDENT\nJane Smith,jane@example.com,TEACHER";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ExamPro_User_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bulk Upload Users</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!result ? (
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                />
                
                <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <p className="font-medium text-primary">{file.name}</p>
                ) : (
                  <>
                    <p className="font-medium">Click or drag Excel file here</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls</p>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center text-sm bg-secondary/50 p-3 rounded-lg border border-border">
                <span className="flex items-center gap-2 text-muted-foreground"><FileSpreadsheet className="h-4 w-4" /> Template format</span>
                <Button variant="link" className="h-auto p-0" onClick={downloadTemplate}>Download Template</Button>
              </div>

              <Button className="w-full" onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Users'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Successfully created {result.created} users</span>
              </div>
              
              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600 font-medium px-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed rows ({result.failed.length})</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg max-h-48 overflow-y-auto p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-red-100/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Row</th>
                          <th className="px-3 py-2 text-left font-medium">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {result.failed.map((err, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-red-900">{err.row}</td>
                            <td className="px-3 py-2 text-red-800">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button className="w-full mt-4" onClick={onSuccess}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
