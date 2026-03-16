import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Building2,
  Search,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  History,
  FileWarning,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import { getSecurityExceptions, getActiveSecurityExceptions } from "@/lib/complianceQueries";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SecurityException, ExceptionStatus, SecurityExceptionType, RiskLevel } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";

export function ExceptionsWaivers() {
  const { currentTenant } = useApp();

  // State management
  const [exceptions, setExceptions] = useState<SecurityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedExceptionId, setSelectedExceptionId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<SecurityException | null>(null);

  // Load exceptions data
  const loadExceptions = async () => {
    try {
      setError(null);
      const data = await getSecurityExceptions(currentTenant.id);
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load security exceptions:', err);
      setError('Failed to load security exceptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExceptions();
  };

  useEffect(() => {
    loadExceptions();
  }, [currentTenant.id]);

  // Filter and sort exceptions
  const filteredAndSortedExceptions = useMemo(() => {
    let result = exceptions.filter((exception) => {
      const matchesSearch =
        (exception.exceptionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exception.businessJustification?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exception.technicalJustification?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exception.exceptionId || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "all" || exception.status === selectedStatus;
      const matchesRiskLevel = selectedRiskLevel === "all" || exception.riskLevel === selectedRiskLevel;
      const matchesType = selectedType === "all" || exception.exceptionType === selectedType;

      return matchesSearch && matchesStatus && matchesRiskLevel && matchesType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        case 'expiry':
          if (!a.expirationDate) return 1;
          if (!b.expirationDate) return -1;
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        case 'risk':
          const riskWeight = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return (riskWeight[b.riskLevel as keyof typeof riskWeight] || 0) - (riskWeight[a.riskLevel as keyof typeof riskWeight] || 0);
        case 'name':
          return (a.exceptionName || '').localeCompare(b.exceptionName || '');
        default:
          return 0;
      }
    });

    return result;
  }, [exceptions, searchTerm, selectedStatus, selectedRiskLevel, selectedType, sortBy]);

  const selectedException = exceptions.find((e) => e.id === selectedExceptionId);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedExceptions.length;
    const active = filteredAndSortedExceptions.filter((e) => e.status === "active" || e.status === "approved").length;
    const pending = filteredAndSortedExceptions.filter((e) => e.status === "pending" || e.status === "under-review").length;
    const expired = filteredAndSortedExceptions.filter((e) => e.status === "expired" || e.status === "revoked" || e.status === "closed").length;
    const highRisk = filteredAndSortedExceptions.filter((e) => e.riskLevel === "high").length;

    // Calculate expiring soon (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expiringSoon = filteredAndSortedExceptions.filter((e) =>
      (e.status === "active" || e.status === "approved") && e.expirationDate && new Date(e.expirationDate) <= thirtyDaysFromNow
    ).length;

    return { total, active, pending, expired, highRisk, expiringSoon };
  }, [filteredAndSortedExceptions]);

  // Get unique values for filter dropdowns
  const statuses = [...new Set(exceptions.map(e => e.status))];
  const riskLevels = [...new Set(exceptions.map(e => e.riskLevel))];
  const exceptionTypes = [...new Set(exceptions.map(e => e.exceptionType))];

  const tabs = selectedException
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <ExceptionDetails exception={selectedException} onRefresh={handleRefresh} />,
      },
      {
        id: "scope",
        label: "Scope & Impact",
        content: <ExceptionScope exception={selectedException} />,
      },
      {
        id: "controls",
        label: "Compensating Controls",
        content: <CompensatingControls exception={selectedException} />,
      },
      {
        id: "workflow",
        label: "Approval History",
        content: <ApprovalWorkflow exception={selectedException} onRefresh={handleRefresh} />,
      },
      {
        id: "monitoring",
        label: "Monitoring",
        content: <MonitoringReporting exception={selectedException} />,
      },
    ]
    : [];

  if (loading) {
    return <LoadingState loadingText="Loading exemptions and waivers..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadExceptions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ListPane
        title="Exceptions Library"
        context="DEWA – Transmission"
        count={filteredAndSortedExceptions.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              ...statuses.map(s => ({ value: s, label: s.replace(/\b\w/g, l => l.toUpperCase()) }))
            ],
            value: selectedStatus,
            onChange: setSelectedStatus,
          },
          {
            key: "risk",
            label: "Risk",
            options: [
              { value: "all", label: "All Risk Levels" },
              ...riskLevels.map(l => ({ value: l, label: l.replace(/\b\w/g, l => l.toUpperCase()) }))
            ],
            value: selectedRiskLevel,
            onChange: setSelectedRiskLevel,
          },
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              ...exceptionTypes.map(t => ({ value: t, label: t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))
            ],
            value: selectedType,
            onChange: setSelectedType,
          }
        ]}
        sortOptions={[
          { label: 'Recently Requested', value: 'recent' },
          { label: 'Expiring Soon', value: 'expiry' },
          { label: 'Risk Level', value: 'risk' },
          { label: 'Name', value: 'name' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedExceptions.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Security Exceptions Found"
              description="No exceptions match your current filters, or none have been created yet."
              action={{
                label: "Create Exception",
                onClick: () => setShowCreateDialog(true),
                variant: "default"
              }}
            />
          ) : (
            filteredAndSortedExceptions.map((exception) => (
              <ListPaneItem
                key={exception.id}
                title={exception.exceptionName}
                description={`${exception.exceptionId} • ${exception.exceptionType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                status={exception.status === "active" || exception.status === "approved" ? 'online' : (exception.status === "expired" || exception.status === "revoked" ? 'offline' : 'maintenance')}
                category={exception.riskLevel.toUpperCase()}
                value={exception.status.toUpperCase()}
                isSelected={selectedExceptionId === exception.id}
                onClick={() => setSelectedExceptionId(exception.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedException ? selectedException.exceptionName : "Exceptions Overview"}
        subtitle={selectedException ? `${selectedException.riskLevel.toUpperCase()} Risk • ${selectedException.status.toUpperCase()}` : `${currentTenant.name} • Security Policy Exceptions & Waivers`}
        tabs={tabs}
      >
        {!selectedException && (
          <IdentityOverview
            title="Exceptions & Waivers Management"
            description="Manage, track, and review security policy exceptions, waivers, and risk acceptances across the transmission infrastructure."
            metrics={[
              {
                title: "Total Exceptions",
                value: stats.total,
                icon: FileText,
                variant: 'default'
              },
              {
                title: "Active",
                value: stats.active,
                icon: CheckCircle2,
                variant: 'success'
              },
              {
                title: "Pending Approval",
                value: stats.pending,
                icon: Clock,
                variant: 'warning'
              },
              {
                title: "Expiring Soon",
                value: stats.expiringSoon,
                icon: AlertTriangle,
                variant: 'destructive'
              }
            ]}
          >
            <ExceptionsOverview
              statusData={(() => {
                const data = [
                  { name: 'Active/Approved', value: stats.active, color: 'hsl(var(--success))' },
                  { name: 'Pending/Review', value: stats.pending, color: 'hsl(var(--warning))' },
                  { name: 'Expired/Revoked', value: stats.expired, color: 'hsl(var(--destructive))' },
                ].filter(d => d.value > 0);
                return data.length > 0 ? data : [{ name: 'No Data', value: 1, color: 'hsl(var(--muted)/0.2)' }];
              })()}
              riskData={(() => {
                const data = [
                  { name: 'High', value: exceptions.filter(e => e.riskLevel === 'high').length, color: 'hsl(var(--destructive))' },
                  { name: 'Medium', value: exceptions.filter(e => e.riskLevel === 'medium').length, color: 'hsl(var(--warning))' },
                  { name: 'Low', value: exceptions.filter(e => e.riskLevel === 'low').length, color: 'hsl(var(--success))' },
                ].filter(d => d.value > 0);
                return data.length > 0 ? data : [{ name: 'No High/Med/Low Risks', value: 0, color: 'hsl(var(--muted)/0.2)' }];
              })()}
              recentExceptions={exceptions.slice(0, 3)}
              onExceptionSelect={(id) => setSelectedExceptionId(id)}
            />
          </IdentityOverview>
        )}
      </WorkPane>

      {/* Create Exception Dialog */}
      <CreateExceptionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadExceptions}
      />
    </>
  );
}

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "text-success";
    case "expired": return "text-muted-foreground";
    case "revoked": return "text-destructive";
    case "pending": return "text-warning";
    default: return "text-muted-foreground";
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case "high": return "text-destructive";
    case "medium": return "text-warning";
    case "low": return "text-success";
    default: return "text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active": return CheckCircle2;
    case "expired": return Clock;
    case "revoked": return XCircle;
    case "pending": return AlertTriangle;
    default: return AlertTriangle;
  }
};

const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case "high": return AlertTriangle;
    case "medium": return AlertCircle;
    case "low": return Shield;
    default: return AlertTriangle;
  }
};

const getDaysUntilExpiration = (expirationDate: string) => {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Create Exception Dialog Component
function CreateExceptionDialog({
  open,
  onOpenChange,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    exceptionName: '',
    exceptionType: 'policy-exception' as SecurityExceptionType,
    businessJustification: '',
    technicalJustification: '',
    riskLevel: 'medium' as RiskLevel,
    riskDescription: '',
    scope: 'site',
    effectiveDate: '',
    expirationDate: '',
    compensatingControls: [''],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create exception logic
    console.log('Creating exception:', formData);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Security Exception</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exceptionName">Exception Name</Label>
              <Input
                id="exceptionName"
                value={formData.exceptionName}
                onChange={(e) => setFormData(prev => ({ ...prev, exceptionName: e.target.value }))}
                placeholder="Enter exception name"
                required
              />
            </div>
            <div>
              <Label htmlFor="exceptionType">Exception Type</Label>
              <Select
                value={formData.exceptionType}
                onValueChange={(value: SecurityExceptionType) =>
                  setFormData(prev => ({ ...prev, exceptionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy-exception">Policy Exception</SelectItem>
                  <SelectItem value="control-exception">Control Exception</SelectItem>
                  <SelectItem value="compliance-waiver">Compliance Waiver</SelectItem>
                  <SelectItem value="temporary-deviation">Temporary Deviation</SelectItem>
                  <SelectItem value="permanent-exception">Permanent Exception</SelectItem>
                  <SelectItem value="risk-acceptance">Risk Acceptance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="businessJustification">Business Justification</Label>
            <Textarea
              id="businessJustification"
              value={formData.businessJustification}
              onChange={(e) => setFormData(prev => ({ ...prev, businessJustification: e.target.value }))}
              placeholder="Explain the business need for this exception"
              required
            />
          </div>

          <div>
            <Label htmlFor="technicalJustification">Technical Justification</Label>
            <Textarea
              id="technicalJustification"
              value={formData.technicalJustification}
              onChange={(e) => setFormData(prev => ({ ...prev, technicalJustification: e.target.value }))}
              placeholder="Provide technical details and constraints"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="riskLevel">Risk Level</Label>
              <Select
                value={formData.riskLevel}
                onValueChange={(value: RiskLevel) =>
                  setFormData(prev => ({ ...prev, riskLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, scope: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="zone">Security Zone</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="riskDescription">Risk Description</Label>
            <Textarea
              id="riskDescription"
              value={formData.riskDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, riskDescription: e.target.value }))}
              placeholder="Describe the risks associated with this exception"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Exception
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExceptionDetails({
  exception,
  onRefresh
}: {
  exception: SecurityException;
  onRefresh: () => void;
}) {
  const daysUntilExpiry = useMemo(() => {
    if (!exception.expirationDate) return null;
    const now = new Date();
    const expiry = new Date(exception.expirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [exception.expirationDate]);

  return (
    <div className="space-y-6">
      {/* Exception Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Exception Overview
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Exception ID</p>
            <p className="text-sm font-mono">{exception.exceptionId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Business Justification</p>
            <p className="text-sm">{exception.businessJustification}</p>
          </div>
          {exception.technicalJustification && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Technical Justification</p>
              <p className="text-sm">{exception.technicalJustification}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge
                variant={
                  exception.status === "active"
                    ? "default"
                    : exception.status === "expired"
                      ? "secondary"
                      : exception.status === "pending"
                        ? "secondary"
                        : "destructive"
                }
              >
                {exception.status.replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
              <Badge
                variant={
                  exception.riskLevel === "high" || exception.riskLevel === "critical"
                    ? "destructive"
                    : exception.riskLevel === "medium"
                      ? "secondary"
                      : "default"
                }
              >
                {exception.riskLevel.replace(/\b\w/g, l => l.toUpperCase())} Risk
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Exception Type</p>
              <Badge variant="outline">
                {exception.exceptionType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            {daysUntilExpiry !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Days Until Expiry</p>
                <span className={`text-sm font-medium ${daysUntilExpiry <= 0 ? "text-destructive" :
                  daysUntilExpiry <= 30 ? "text-warning" : "text-success"
                  }`}>
                  {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Risk Assessment
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risk Description</p>
            <p className="text-sm">{exception.riskDescription}</p>
          </div>
          {exception.residualRiskDescription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Residual Risk</p>
              <p className="text-sm">{exception.residualRiskDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transmission Context */}
      <div className="bg-info/5 border border-info/20 rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-info" />
          Power Transmission Context
        </h4>
        <div className="space-y-3">
          <p className="text-sm text-info">
            This exception applies to power transmission infrastructure and may affect critical
            systems including substations, grid stations, protection relays, or SCADA networks.
          </p>
          {(exception.riskLevel === "high" || exception.riskLevel === "critical") && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">High Risk Impact</p>
                  <p className="text-sm text-destructive/80">
                    This exception affects critical transmission infrastructure and requires enhanced monitoring
                    and compensating controls to maintain grid reliability and security.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskMatrix({ level }: { level: string }) {
  const levels = ['low', 'medium', 'high'];
  const colors = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-destructive'
  };

  return (
    <div className="grid grid-cols-3 gap-1 w-32 h-32">
      {['high', 'medium', 'low'].map((impact) => (
        levels.map((likeli) => {
          const isMatch = (impact === 'high' && level === 'high') ||
            (impact === 'medium' && level === 'medium') ||
            (impact === 'low' && level === 'low');
          return (
            <div
              key={`${impact}-${likeli}`}
              className={`rounded-sm transition-all ${isMatch ? colors[level as keyof typeof colors] : 'bg-secondary/20'} ${isMatch ? 'scale-110 shadow-lg z-10' : ''}`}
            />
          );
        })
      ))}
      <div className="col-span-3 flex justify-between px-1 mt-1 font-black text-[6px] text-muted-foreground uppercase tracking-widest">
        <span>Low</span>
        <span>Likelihood</span>
        <span>High</span>
      </div>
    </div>
  );
}

function ExceptionScope({ exception }: { exception: SecurityException }) {
  const isCritical = exception.riskLevel === 'critical' || exception.riskLevel === 'high';
  const siteCount = exception.appliesToSites?.length || 0;
  const zoneCount = exception.appliesToZones?.length || 0;
  const assetCount = exception.appliesToAssets?.length || 0;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Risk Exposure Map */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Risk Position Matrix</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Transmission Blast Radius</p>
            </div>
          </div>
          <RiskMatrix level={exception.riskLevel === 'critical' ? 'high' : exception.riskLevel} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-xl bg-secondary/10 border border-border/40">
            <h5 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest">Exposure Scope Detailed</h5>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xl font-black">{siteCount}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Substations</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black">{zoneCount}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">SCADA Zones</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black">{assetCount}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Critical Assets</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Grid Topology Impact</span>
              <Badge variant={isCritical ? "destructive" : "secondary"} className="h-4 text-[8px] font-black uppercase">
                {isCritical ? "Catastrophic Potential" : "Managed Deviation"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed font-medium bg-secondary/10 p-4 rounded-xl border border-border/40">
              {isCritical
                ? `HIGH EXPOSURE: This waiver bypasses standard controls across ${siteCount} transmission nodes. The residual risk level is pinned at ${exception.riskLevel.toUpperCase()} due to the critical nature of the affected ${assetCount} assets.`
                : `NORMALIZED: Scope is limited to ${siteCount} peripheral assets. Impact on the core transmission backbone is minimized through architectural isolation.`}
            </p>
          </div>
        </div>
      </div>

      {/* Waiver Pulse */}
      <div className="bg-secondary/10 border border-border/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-destructive' : 'bg-primary'}`}></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Waiver Lifecycle Heartbeat</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isCritical ? 'bg-destructive' : 'bg-success'}`} style={{ width: isCritical ? '90%' : '30%' }} />
          </div>
          <span className="text-xs font-bold font-mono uppercase">{isCritical ? 'Critical' : 'Routine'}</span>
        </div>
      </div>
    </div>
  );
}

function CompensatingControls({ exception }: { exception: SecurityException }) {
  const controls = exception.compensatingControls || [];
  const isImplemented = exception.compensatingControlsImplemented;
  const isVerified = exception.compensatingControlsVerified;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Control Effectiveness Analysis */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!isImplemented ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Control Effectiveness Audit</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Mitigation Strategy Deconstruction</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Implementation Depth"
            value={isImplemented ? "FULLY DEPLOYED" : "PARTIAL / PENDING"}
            status={isImplemented ? 'success' : 'warning'}
            icon={CheckCircle2}
          />
          <AnalysisMetric
            label="Verification Confidence"
            value={isVerified ? "AUDIT VERIFIED" : "ATTESTATION ONLY"}
            status={isVerified ? 'success' : 'warning'}
            icon={Shield}
          />
          <AnalysisMetric
            label="Monitoring Frequency"
            value={exception.monitoringFrequencyDays ? `EVERY ${exception.monitoringFrequencyDays} DAYS` : "AD-HOC"}
            status={exception.monitoringFrequencyDays ? 'success' : 'warning'}
            icon={Clock}
          />
          <AnalysisMetric
            label="Protocol Redundancy"
            value={`${controls.length} LAYERS`}
            status={controls.length >= 2 ? 'success' : 'warning'}
            icon={Settings}
          />
        </div>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-5">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 px-1 flex items-center gap-2">
          <FileWarning className="w-3 h-3" />
          Specified Compensating Controls
        </h5>
        <div className="space-y-3">
          {controls.length > 0 ? (
            controls.map((control, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-card/60 border border-border/40 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-primary">{index + 1}</span>
                </div>
                <p className="text-sm leading-snug font-medium text-foreground">{control}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground italic">No specific compensating controls documented.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Mitigation Reliability</h5>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${!isImplemented ? 'bg-destructive' : isVerified ? 'bg-success' : 'bg-warning'}`} style={{ width: isVerified ? '100%' : isImplemented ? '75%' : '25%' }} />
          </div>
          <span className="text-[10px] font-mono font-bold">{isVerified ? '100%' : isImplemented ? '75%' : '25%'}</span>
        </div>
      </div>
    </div>
  );
}


function ApprovalWorkflow({
  exception,
  onRefresh
}: {
  exception: SecurityException;
  onRefresh: () => void;
}) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const daysUntilExpiry = useMemo(() => {
    if (!exception.expirationDate) return null;
    const now = new Date();
    const expiry = new Date(exception.expirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [exception.expirationDate]);

  const daysSinceRequest = useMemo(() => {
    const now = new Date();
    const request = new Date(exception.requestDate);
    const diffTime = now.getTime() - request.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [exception.requestDate]);

  return (
    <div className="space-y-6">
      {/* Workflow Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Approval Workflow
          </h4>
          {exception.status === "pending" && (
            <Button
              size="sm"
              onClick={() => setShowApprovalDialog(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Review
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Status</p>
              <Badge
                variant={
                  exception.status === "active"
                    ? "default"
                    : exception.status === "pending"
                      ? "secondary"
                      : exception.status === "expired"
                        ? "outline"
                        : "destructive"
                }
              >
                {exception.status.replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Days Since Request</p>
              <p className="text-sm font-medium">{daysSinceRequest} days</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Requested By</p>
              <p className="text-sm">{exception.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Request Date</p>
              <p className="text-sm">{new Date(exception.requestDate).toLocaleDateString()}</p>
            </div>
          </div>

          {exception.reviewedBy && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reviewed By</p>
                <p className="text-sm">{exception.reviewedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Review Date</p>
                <p className="text-sm">
                  {exception.reviewDate ? new Date(exception.reviewDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {exception.approvedBy && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approved By</p>
                <p className="text-sm">{exception.approvedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approval Date</p>
                <p className="text-sm">
                  {exception.approvalDate ? new Date(exception.approvalDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Exception Timeline
        </h4>
        <div className="space-y-4">
          {exception.effectiveDate && exception.expirationDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Effective Date</p>
                <p className="text-sm">{new Date(exception.effectiveDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expiration Date</p>
                <p className="text-sm">{new Date(exception.expirationDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {daysUntilExpiry !== null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Days Until Expiry</p>
              <span className={`text-sm font-medium ${daysUntilExpiry <= 0 ? "text-destructive" :
                daysUntilExpiry <= 30 ? "text-warning" : "text-success"
                }`}>
                {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days`}
              </span>
            </div>
          )}

          {/* Status Warnings */}
          {exception.status === "pending" && daysSinceRequest > 7 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">Pending Review</p>
                  <p className="text-sm text-warning/80">
                    This exception has been pending review for {daysSinceRequest} days.
                    Consider expediting the approval process.
                  </p>
                </div>
              </div>
            </div>
          )}

          {exception.status === "active" && daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">Expiring Soon</p>
                  <p className="text-sm text-warning/80">
                    This exception expires in {daysUntilExpiry} days. Consider renewal or
                    implementation of permanent controls before expiration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Exception Expired</p>
                  <p className="text-sm text-destructive/80">
                    This exception has expired and is no longer valid. Immediate action
                    is required to ensure compliance with security policies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extension Information */}
      {exception.extensionAllowed && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Extension Options
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Extensions Allowed</p>
                <Badge variant="outline">
                  {exception.extensionAllowed ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Extensions</p>
                <p className="text-sm font-medium">{exception.maxExtensions}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Extensions Used</p>
                <p className="text-sm font-medium">{exception.extensionsUsed}</p>
              </div>
            </div>

            {exception.extensionsUsed < exception.maxExtensions && (
              <div className="bg-info/5 border border-info/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-info mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-info mb-1">Extension Available</p>
                    <p className="text-sm text-info/80">
                      This exception can be extended {exception.maxExtensions - exception.extensionsUsed} more time(s)
                      if additional time is needed before implementing permanent controls.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments and Notes */}
      {(exception.reviewComments || exception.denialReason || exception.notes) && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Comments & Notes
          </h4>
          <div className="space-y-3">
            {exception.reviewComments && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Review Comments</p>
                <p className="text-sm">{exception.reviewComments}</p>
              </div>
            )}
            {exception.denialReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Denial Reason</p>
                <p className="text-sm text-destructive">{exception.denialReason}</p>
              </div>
            )}
            {exception.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                <p className="text-sm">{exception.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoringReporting({ exception }: { exception: SecurityException }) {
  return (
    <div className="space-y-6">
      {/* Monitoring Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Monitoring Status
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Monitoring Required</p>
              <Badge variant={exception.requiresMonitoring ? "default" : "outline"}>
                {exception.requiresMonitoring ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Frequency</p>
              <p className="text-sm font-medium">
                {exception.monitoringFrequencyDays ? `${exception.monitoringFrequencyDays} days` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Compliance Status</p>
              <Badge
                variant={
                  exception.complianceStatus === "compliant"
                    ? "default"
                    : exception.complianceStatus === "non-compliant"
                      ? "destructive"
                      : "secondary"
                }
              >
                {exception.complianceStatus.replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {exception.lastMonitored && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Monitored</p>
                <p className="text-sm">{new Date(exception.lastMonitored).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Next Monitoring</p>
                <p className="text-sm">
                  {exception.nextMonitoringDate ? new Date(exception.nextMonitoringDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reporting Requirements */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Reporting Requirements
        </h4>
        <div className="space-y-3">
          <div className="bg-info/5 border border-info/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-info mt-0.5" />
              <div>
                <p className="text-sm font-medium text-info mb-1">Transmission Compliance Reporting</p>
                <p className="text-sm text-info/80">
                  This exception may require reporting to transmission system operators,
                  regulatory bodies, or grid reliability organizations depending on its scope and impact.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Level Reporting</p>
              <p className="text-sm font-medium">
                {exception.riskLevel === "high" || exception.riskLevel === "critical" ? "Executive" : "Management"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Frequency</p>
              <p className="text-sm font-medium">
                {exception.riskLevel === "high" ? "Weekly" :
                  exception.riskLevel === "medium" ? "Monthly" : "Quarterly"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Audit Trail
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Exception Created</p>
              <p className="text-xs text-muted-foreground">
                {new Date(exception.createdAt).toLocaleDateString()} by {exception.requestedBy}
              </p>
            </div>
          </div>

          {exception.reviewDate && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exception Reviewed</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exception.reviewDate).toLocaleDateString()} by {exception.reviewedBy}
                </p>
              </div>
            </div>
          )}

          {exception.approvalDate && (
            <div className="flex items-center gap-3 p-3 bg-success/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exception Approved</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exception.approvalDate).toLocaleDateString()} by {exception.approvedBy}
                </p>
              </div>
            </div>
          )}

          {exception.status === "expired" && exception.expirationDate && (
            <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exception Expired</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exception.expirationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {exception.revoked && exception.revocationDate && (
            <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exception Revoked</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exception.revocationDate).toLocaleDateString()} by {exception.revokedBy}
                  {exception.revocationReason && ` - ${exception.revocationReason}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface OverviewChartData {
  name: string;
  value: number;
  color?: string;
}

function ExceptionsOverview({
  statusData,
  riskData,
  recentExceptions,
  onExceptionSelect
}: {
  statusData: OverviewChartData[];
  riskData: OverviewChartData[];
  recentExceptions: SecurityException[];
  onExceptionSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Exception Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {statusData.length === 1 && statusData[0].name === 'No Data' && (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    No Exceptions
                  </text>
                )}
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChartIcon className="w-4 h-4 text-primary" />
            Exceptions by Risk Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={riskData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {riskData.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={entry.color || `hsl(var(--primary) / ${1 - index * 0.15})`} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Exception Governance
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Policy Compliance</p>
              <p className="text-xs text-muted-foreground">Formal deviations from security policies with defined durations and constraints.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileWarning className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Risk Acceptance</p>
              <p className="text-xs text-muted-foreground">Documented recognition and acceptance of specific operational risks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <History className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Audit Trail</p>
              <p className="text-xs text-muted-foreground">Detailed logs of all approval/rejection decisions and remediation progress.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Recent Activity
        </h4>
        <div className="space-y-4">
          {recentExceptions.map(exception => (
            <div
              key={exception.id}
              className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onExceptionSelect(exception.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${exception.status === 'active' ? 'bg-success' : exception.status === 'pending' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                <span className="text-sm font-medium truncate max-w-[150px]">{exception.exceptionName}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${exception.riskLevel === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                {exception.riskLevel}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select an exception from the list to view justifications, impact analysis, and compensating controls.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
