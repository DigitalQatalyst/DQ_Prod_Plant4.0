import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Plus, Upload, FileSpreadsheet, FileText, CheckCircle2, XCircle,
  AlertCircle, Loader2, Download, Search, History, BarChart3,
  ArrowRight, CloudUpload, FileJson, LucideIcon
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { AssetImport, ImportError } from "@/types/transmission";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  mapping: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preview: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20"
};

const sourceTypeIcons: Record<string, React.ElementType> = {
  csv: FileText,
  excel: FileSpreadsheet,
  api: Upload
};

type WizardStep = 'upload' | 'mapping' | 'preview' | 'import';

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

interface PreviewRow {
  [key: string]: string | number;
}

interface ImportOverviewProps {
  imports: AssetImport[];
  onSelectImport: (record: AssetImport) => void;
}

function ImportOverview({ imports, onSelectImport }: ImportOverviewProps) {
  const stats = {
    total: imports.length,
    completed: imports.filter(i => i.status === 'completed').length,
    failed: imports.filter(i => i.status === 'failed').length,
    totalImported: imports.reduce((acc, curr) => acc + curr.importedCount, 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Imports</span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <History className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed</span>
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-500">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Assets</span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalImported}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Recent Import Jobs</h3>
        <Card className="bg-card/50 overflow-hidden border-border/50">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider px-6">Import Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Records</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right px-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.length > 0 ? (
                imports.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onSelectImport(item)}
                  >
                    <TableCell className="font-semibold text-sm py-4 px-6">{item.name}</TableCell>
                    <TableCell className="text-xs py-4 capitalize text-muted-foreground">{item.sourceType}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("capitalize border-none", statusColors[item.status])}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm py-4 font-mono">{item.recordCount}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground py-4 px-6">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground px-6">
                    No import history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

interface NewImportProcessProps {
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  importName: string;
  setImportName: (name: string) => void;
  sourceType: 'csv' | 'excel';
  setSourceType: (type: 'csv' | 'excel') => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  parsedHeaders: string[];
  columnMappings: ColumnMapping[];
  updateMapping: (source: string, target: string) => void;
  targetFields: any[];
  parsedData: PreviewRow[];
  previewData: PreviewRow[];
  handleNext: () => void;
  handleBack: () => void;
  importing: boolean;
  importError: string | null;
}

function NewImportWizard({
  wizardStep,
  setWizardStep,
  importName,
  setImportName,
  sourceType,
  setSourceType,
  handleFileSelect,
  selectedFile,
  parsedHeaders,
  columnMappings,
  updateMapping,
  targetFields,
  parsedData,
  previewData,
  handleNext,
  handleBack,
  importing,
  importError
}: NewImportProcessProps) {
  const steps = [
    { id: 'upload', label: 'Upload Template', sub: 'Select and upload file' },
    { id: 'mapping', label: 'Map Columns', sub: 'Map data columns' },
    { id: 'preview', label: 'Preview Summary', sub: 'Review before import' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Stepper */}
      <div className="relative flex justify-between items-center max-w-4xl mx-auto px-4">
        {steps.map((step, idx) => {
          const stepIndex = steps.findIndex(s => s.id === wizardStep);
          const currentIdx = steps.findIndex(s => s.id === step.id);
          const isActive = wizardStep === step.id;
          const isCompleted = currentIdx < stepIndex;

          return (
            <div key={step.id} className="relative flex flex-col items-center flex-1">
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[50%] right-[-50%] top-5 h-[2px] -translate-y-1/2 z-0",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 shadow-sm",
                  isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-primary/20" :
                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                      "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span>{idx + 1}</span>}
              </div>
              <div className="mt-3 text-center">
                <p className={cn("text-sm font-bold tracking-tight", isActive ? "text-foreground font-extrabold" : "text-muted-foreground font-semibold")}>{step.label}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizard Content */}
      <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden min-h-[400px]">
        <CardContent className="p-8">
          {wizardStep === 'upload' && (
            <div className="space-y-8">
              <div className="max-w-md mx-auto space-y-4 text-center">
                <h3 className="text-xl font-bold tracking-tight">Upload Template</h3>
                <p className="text-sm text-muted-foreground">Upload an Excel, CSV, or database export file containing asset data</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Import Name</Label>
                    <Input
                      placeholder="e.g., Q1 Substation Rollout"
                      value={importName}
                      onChange={e => setImportName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Format</Label>
                    <Select value={sourceType} onValueChange={(val: any) => setSourceType(val)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer",
                    selectedFile ? "border-primary/50 bg-primary/5 shadow-inner" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div className={cn(
                    "p-4 rounded-full transition-transform duration-300 group-hover:scale-110",
                    selectedFile ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <CloudUpload className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-base font-bold tracking-tight">
                      {selectedFile ? selectedFile.name : "Drop your file here, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {selectedFile ? `(${(selectedFile.size / 1024).toFixed(1)} KB)` : "Supports Excel (.xlsx), CSV (.csv), and database exports"}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2 font-bold px-6 border border-border/50">
                    Browse Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept={sourceType === 'csv' ? '.csv' : '.xlsx,.xls'}
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Download Templates</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Asset Template', 'Substation Layout', 'Protocol Map'].map(temp => (
                      <Button key={temp} variant="outline" size="sm" className="h-10 justify-start gap-2 text-xs font-bold border-border/50 bg-background hover:bg-muted">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        {temp}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 'mapping' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Map Columns</h3>
                <p className="text-sm text-muted-foreground font-medium italic">Assign source file columns to system asset fields</p>
              </div>

              <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold uppercase tracking-wider">Source Column</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider">System Field</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider">Sample Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnMappings.map((mapping, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-sm">{mapping.sourceColumn}</TableCell>
                        <TableCell>
                          <Select
                            value={mapping.targetField}
                            onValueChange={val => updateMapping(mapping.sourceColumn, val)}
                          >
                            <SelectTrigger className="h-9 bg-background focus:ring-1">
                              <SelectValue placeholder="Skip column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">-- Skip Column --</SelectItem>
                              {targetFields.map(f => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label} {f.required && ' (Required)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {parsedData[0]?.[mapping.sourceColumn] || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {wizardStep === 'preview' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Preview Summary</h3>
                  <p className="text-sm text-muted-foreground font-medium italic">Validate records before committing to the database</p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-xs font-bold text-primary mr-2 uppercase tracking-widest tracking-wider">Total Records:</span>
                  <span className="text-lg font-black text-primary font-mono">{parsedData.length}</span>
                </div>
              </div>

              <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {columnMappings.filter(m => m.targetField !== 'skip' && m.targetField).map((m, i) => (
                        <TableHead key={i} className="text-xs font-extrabold uppercase tracking-wider">
                          {targetFields.find(tf => tf.value === m.targetField)?.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {columnMappings.filter(m => m.targetField !== 'skip' && m.targetField).map((m, colIdx) => (
                          <TableCell key={colIdx} className="text-sm py-3 font-medium">
                            {String(row[m.targetField] || '—')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[11px] text-muted-foreground text-center font-bold tracking-widest uppercase italic bg-muted/30 py-2 rounded">
                Showing first 5 records of {parsedData.length} total
              </p>
            </div>
          )}
        </CardContent>

        {importError && (
          <div className="px-8 pb-4">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{importError}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="px-8 py-6 bg-muted/20 border-t border-border/30 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={wizardStep === 'upload' || importing}
            className="font-bold text-xs uppercase tracking-widest h-10 px-6"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={importing}
            className="font-bold text-xs uppercase tracking-widest h-10 px-8 gap-2 shadow-lg shadow-primary/20"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {wizardStep === 'preview' ? 'Confirm and Start Import' : `Next: ${steps[steps.findIndex(s => s.id === wizardStep) + 1]?.label}`}
            {!importing && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function AssetImportPage() {
  const { provider } = useDataProvider();
  const [imports, setImports] = useState<AssetImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<AssetImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Wizard dialog state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('upload');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Upload step state
  const [importName, setImportName] = useState("");
  const [sourceType, setSourceType] = useState<'csv' | 'excel'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<PreviewRow[]>([]);

  // Mapping step state
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Preview step state
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  // Target fields for asset import
  const targetFields = [
    { value: 'name', label: 'Asset Name', required: true },
    { value: 'assetTypeCode', label: 'Asset Type Code', required: true },
    { value: 'siteName', label: 'Site Name', required: true },
    { value: 'status', label: 'Status', required: false },
    { value: 'criticality', label: 'Criticality', required: false },
    { value: 'properties', label: 'Properties (JSON)', required: false }
  ];

  const [activeTab, setActiveTab] = useState("new-import");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All");

  // Load tenant ID and asset imports
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        const result = await provider.getAssetImportsByTenant(tid, {
          limit: 100,
          offset: 0
        });

        setImports(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load asset imports");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  const filteredImports = imports.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || i.status === statusFilter;
    const matchesSourceType = sourceTypeFilter === "All" || i.sourceType === sourceTypeFilter;
    return matchesSearch && matchesStatus && matchesSourceType;
  });

  // Handle file selection and parsing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError(null);

    try {
      // Parse file to extract headers and sample data
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        setImportError("File is empty");
        return;
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      setParsedHeaders(headers);

      // Parse first 5 rows as sample data
      const sampleData: PreviewRow[] = [];
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: PreviewRow = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        sampleData.push(row);
      }
      setParsedData(sampleData);

      // Initialize column mappings with suggested matches
      const suggestedMappings: ColumnMapping[] = headers.map(header => {
        const lowerHeader = header.toLowerCase();
        let targetField = '';

        if (lowerHeader.includes('name') && !lowerHeader.includes('site')) {
          targetField = 'name';
        } else if (lowerHeader.includes('type') || lowerHeader.includes('code')) {
          targetField = 'assetTypeCode';
        } else if (lowerHeader.includes('site')) {
          targetField = 'siteName';
        } else if (lowerHeader.includes('status')) {
          targetField = 'status';
        } else if (lowerHeader.includes('critical')) {
          targetField = 'criticality';
        }

        return {
          sourceColumn: header,
          targetField
        };
      });

      setColumnMappings(suggestedMappings);

    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  // Update column mapping
  const updateMapping = (sourceColumn: string, targetField: string) => {
    setColumnMappings(prev =>
      prev.map(m =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField }
          : m
      )
    );
  };

  // Validate mappings
  const validateMappings = (): boolean => {
    const requiredFields = targetFields.filter(f => f.required).map(f => f.value);
    const mappedFields = columnMappings.filter(m => m.targetField && m.targetField !== 'skip').map(m => m.targetField);

    for (const required of requiredFields) {
      if (!mappedFields.includes(required)) {
        setImportError(`Required field "${required}" is not mapped`);
        return false;
      }
    }

    return true;
  };

  // Generate preview data
  const generatePreview = () => {
    const preview: PreviewRow[] = parsedData.map(row => {
      const mappedRow: PreviewRow = {};
      columnMappings.forEach(mapping => {
        if (mapping.targetField) {
          mappedRow[mapping.targetField] = row[mapping.sourceColumn];
        }
      });
      return mappedRow;
    });
    setPreviewData(preview);
  };

  // Handle wizard navigation
  const handleNext = () => {
    if (wizardStep === 'upload') {
      if (!selectedFile || !importName) {
        setImportError("Please provide import name and select a file");
        return;
      }
      setWizardStep('mapping');
    } else if (wizardStep === 'mapping') {
      if (!validateMappings()) {
        return;
      }
      generatePreview();
      setWizardStep('preview');
    } else if (wizardStep === 'preview') {
      handleImport();
    }
  };

  const handleBack = () => {
    if (wizardStep === 'mapping') {
      setWizardStep('upload');
    } else if (wizardStep === 'preview') {
      setWizardStep('mapping');
    }
  };

  // Handle import execution
  const handleImport = async () => {
    if (!tenantId) return;

    try {
      setImporting(true);
      setImportError(null);

      // Create import record
      const created = await provider.createAssetImport({
        tenantId,
        name: importName,
        status: 'completed',
        sourceType,
        recordCount: parsedData.length,
        errors: []
      });

      setImports([created, ...imports]);
      setSelectedImport(created);
      setWizardOpen(false);
      resetWizard();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to create import");
    } finally {
      setImporting(false);
    }
  };

  // Reset wizard state
  const resetWizard = () => {
    setWizardStep('upload');
    setImportName("");
    setSourceType('csv');
    setSelectedFile(null);
    setParsedHeaders([]);
    setParsedData([]);
    setColumnMappings([]);
    setPreviewData([]);
    setImportError(null);
  };

  // Download error report
  const downloadErrorReport = (importRecord: AssetImport) => {
    if (!importRecord.errors || importRecord.errors.length === 0) return;

    const csv = [
      'Row,Field,Error',
      ...importRecord.errors.map(e => `${e.row},"${e.field}","${e.message}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importRecord.name}-errors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading asset imports..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* List Pane */}
      <ListPane
        className="w-96 min-w-96"
        title="Asset Import"
        subtitle={`${filteredImports.length} import history logs`}
        onSearch={setSearchQuery}
        searchPlaceholder="Search imports..."
        showExpandableFilters={true}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "mapping", label: "Mapping" },
              { value: "preview", label: "Preview" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ],
          },
          {
            key: "sourceType",
            label: "Format",
            value: sourceTypeFilter,
            onChange: setSourceTypeFilter,
            options: [
              { value: "All", label: "All Formats" },
              { value: "csv", label: "CSV" },
              { value: "excel", label: "Excel" },
            ],
          }
        ]}
      >
        <div className="space-y-1 pb-8">
          {filteredImports.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No records"
              description="Your import history will appear here"
            />
          ) : (
            filteredImports.map((item) => {
              const Icon = sourceTypeIcons[item.sourceType] || FileText;
              const isSelected = selectedImport?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-all group",
                    isSelected ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card/40 hover:bg-card/60"
                  )}
                  onClick={() => {
                    setSelectedImport(item);
                    setActiveTab("detail");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md border transition-colors mt-0.5",
                      isSelected ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={cn(
                          "text-sm font-semibold truncate leading-none transition-colors",
                          isSelected ? "text-primary" : "group-hover:text-primary"
                        )}>
                          {item.name}
                        </h3>
                        <Badge variant="outline" className={cn(
                          "capitalize border-none py-0 px-1.5 text-[9px] font-bold",
                          statusColors[item.status]
                        )}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                        {item.sourceType === 'excel' ? 'Excel Spreadsheet' : 'CSV File'} • {item.recordCount} records
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500/70" />
                          <span className="text-[10px] font-bold text-green-600/80">{item.importedCount}</span>
                        </div>
                        {item.errors && item.errors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500/70" />
                            <span className="text-[10px] font-bold text-red-600/80">{item.errors.length}</span>
                          </div>
                        )}
                        <span className="text-muted-foreground/30 ml-auto">•</span>
                        <p className="text-[10px] text-muted-foreground/50 font-mono italic">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ListPane>

      {/* Work Pane */}
      <WorkPane
        title="Asset Import"
        subtitle="Import substation assets from Excel or CSV regional data files"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/40 border-b border-border/50 rounded-none w-full justify-start h-12 px-1 gap-2 mb-8">
            <TabsTrigger
              value="new-import"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-8 h-9 text-xs font-bold uppercase tracking-widest"
              onClick={() => setSelectedImport(null)}
            >
              New Import
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-8 h-9 text-xs font-bold uppercase tracking-widest"
              onClick={() => setSelectedImport(null)}
            >
              Import Overview
            </TabsTrigger>
            {selectedImport && (
              <TabsTrigger
                value="detail"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-8 h-9 text-xs font-bold uppercase tracking-widest"
              >
                Detail: {selectedImport.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="new-import" className="mt-0 outline-none">
            <NewImportWizard
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              importName={importName}
              setImportName={setImportName}
              sourceType={sourceType}
              setSourceType={setSourceType}
              handleFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              parsedHeaders={parsedHeaders}
              columnMappings={columnMappings}
              updateMapping={updateMapping}
              targetFields={targetFields}
              parsedData={parsedData}
              previewData={previewData}
              handleNext={handleNext}
              handleBack={handleBack}
              importing={importing}
              importError={importError}
            />
          </TabsContent>

          <TabsContent value="overview" className="mt-0 outline-none">
            <ImportOverview
              imports={imports}
              onSelectImport={(rec) => {
                setSelectedImport(rec);
                setActiveTab("detail");
              }}
            />
          </TabsContent>

          <TabsContent value="detail" className="mt-0 outline-none">
            {selectedImport ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-xl border border-border/40 mb-8">
                  <div className={cn("p-2 rounded-lg", statusColors[selectedImport.status])}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold tracking-tight">{selectedImport.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{selectedImport.sourceType} Record Group • {new Date(selectedImport.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto underline text-xs font-bold uppercase tracking-widest hover:bg-transparent"
                    onClick={() => {
                      setSelectedImport(null);
                      setActiveTab("overview");
                    }}
                  >
                    Back to History
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Scanned</Label>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black">{selectedImport.recordCount}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/[0.03] border-green-500/10">
                    <CardHeader className="pb-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Success Imported</Label>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-green-500">{selectedImport.importedCount}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/[0.03] border-red-500/10">
                    <CardHeader className="pb-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Error Logs</Label>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-black text-red-500">{selectedImport.errors?.length || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedImport.errors && selectedImport.errors.length > 0 && (
                  <Card className="border-red-500/20 shadow-lg shadow-red-500/[0.02]">
                    <CardHeader className="border-b border-red-500/10 bg-red-500/[0.02]">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-red-600 text-base">
                          <AlertCircle className="h-4 w-4" />
                          Conflict & Validation Issues
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-600 text-[10px] font-bold"
                          onClick={() => downloadErrorReport(selectedImport)}
                        >
                          <Download className="h-3.5 w-3.5 mr-2" />
                          EXPORT REJECTION CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-red-500/10">
                        {selectedImport.errors.slice(0, 10).map((error, idx) => (
                          <div key={idx} className="p-4 hover:bg-red-500/[0.01] transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-red-600 font-mono">#{error.row}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-red-700">Invalid Value in `{error.field}`</p>
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-red-500/20 text-red-500 py-0">Critical Error</Badge>
                                </div>
                                <p className="text-xs text-red-600/70 mt-1 font-medium italic">{error.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedImport.errors.length > 10 && (
                        <div className="p-3 text-center bg-muted/10 border-t border-red-500/10">
                          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                            Plus {selectedImport.errors.length - 10} additional conflicts detected
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedImport.status === 'completed' && (!selectedImport.errors || selectedImport.errors.length === 0) && (
                  <div className="p-8 rounded-3xl border border-green-500/20 bg-green-500/[0.02] flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold tracking-tight">Import Pipeline Healthy</h5>
                      <p className="text-sm text-green-700/70 font-medium max-w-sm mt-2">
                        All {selectedImport.importedCount} records successfully merged with zero conflicts or integrity issues.
                      </p>
                    </div>
                    <Button variant="outline" className="border-green-500/20 bg-background hover:bg-green-500/10 text-xs font-bold uppercase tracking-widest mt-2 h-9">
                      Browse New Assets
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No History Selected"
                description="Pick a previous import log from the sidebar to inspect records and audit logs"
              />
            )}
          </TabsContent>
        </Tabs>
      </WorkPane>
    </div>
  );
}
