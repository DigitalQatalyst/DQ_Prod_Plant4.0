import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  Key,
  FileKey,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Trash2,
  Plus,
  Settings,
  Server,
  Lock,
  Calendar,
  Activity,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSecretsCertificates, getCertificateRotationHistory } from "@/lib/secretsQueries";
import type { SecretsCertificate, CertificateRotationHistory } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

export function SecretsCertificatesVault() {
  const { currentTenant } = useApp();
  const [selectedSecretId, setSelectedSecretId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("status");
  const [secrets, setSecrets] = useState<SecretsCertificate[]>([]);
  const [rotationHistory, setRotationHistory] = useState<CertificateRotationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Load secrets and certificates
  useEffect(() => {
    async function loadSecrets() {
      try {
        setLoading(true);
        setError(null);
        const [secretsData, historyData] = await Promise.all([
          getSecretsCertificates(currentTenant?.id || ""),
          getCertificateRotationHistory(currentTenant?.id || "")
        ]);
        setSecrets(secretsData);
        setRotationHistory(historyData);
      } catch (err) {
        console.error('Failed to load secrets and certificates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadSecrets();
  }, [currentTenant?.id]);

  // Filter and sort secrets
  const filteredAndSortedSecrets = useMemo(() => {
    let result = secrets.filter((secret) => {
      const matchesSearch =
        (secret.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (secret.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (secret.secretType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (secret.certificateType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (secret.protocol || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || secret.secretType === typeFilter;
      const matchesStatus = statusFilter === "all" || secret.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          // Sort by status first (active first), then by name
          if (a.status !== b.status) {
            if (a.status === 'active') return -1;
            if (b.status === 'active') return 1;
            return (a.status || '').localeCompare(b.status || '');
          }
          return (a.name || '').localeCompare(b.name || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'type':
          return (a.secretType || '').localeCompare(b.secretType || '');
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'expiry':
          if (!a.validUntil) return 1;
          if (!b.validUntil) return -1;
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [secrets, searchTerm, typeFilter, statusFilter, sortBy]);

  // No longer auto-selecting the first secret to allow showing the Overview
  /*
  useEffect(() => {
    if (filteredSecrets.length > 0 && !selectedSecretId) {
      setSelectedSecretId(filteredSecrets[0].id);
    }
  }, [filteredSecrets, selectedSecretId]);
  */

  const selectedSecret = filteredAndSortedSecrets.find((s) => s.id === selectedSecretId);

  // Calculate days until expiry
  const getDaysUntilExpiry = (validUntil?: string) => {
    if (!validUntil) return null;
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No early return for empty secrets to allow showing the Overview
  /*
  if (secrets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Shield}
          title="No secrets or certificates found"
          description="No secrets or certificates have been configured for this transmission tenant."
          action={{
            label: "Add Secret/Certificate",
            onClick: () => setShowCreateDialog(true),
            variant: "default"
          }}
        />
      </div>
    );
  }
  */

  const overviewData = {
    title: "Secrets & Certificates Overview",
    description: "Manage and monitor digital certificates, cryptographic keys, and sensitive credentials for secure grid communications.",
    metrics: [
      {
        title: "Total Secrets",
        value: secrets.length,
        icon: Shield,
        variant: "primary" as const
      },
      {
        title: "Active Certificates",
        value: secrets.filter(s => s.secretType === 'certificate' && s.status === 'active').length,
        icon: FileKey,
        variant: "success" as const
      },
      {
        title: "Expiring Soon",
        value: secrets.filter(s => {
          const days = getDaysUntilExpiry(s.validUntil);
          return days !== null && days >= 0 && days <= 30;
        }).length,
        icon: AlertTriangle,
        variant: secrets.some(s => {
          const days = getDaysUntilExpiry(s.validUntil);
          return days !== null && days >= 0 && days <= 30;
        }) ? "warning" as const : "default" as const
      },
      {
        title: "Expired Secrets",
        value: secrets.filter(s => {
          const days = getDaysUntilExpiry(s.validUntil);
          return days !== null && days < 0;
        }).length,
        icon: XCircle,
        variant: secrets.some(s => {
          const days = getDaysUntilExpiry(s.validUntil);
          return days !== null && days < 0;
        }) ? "destructive" as const : "default" as const
      }
    ]
  };

  const tabs = selectedSecret
    ? [
      {
        id: "details",
        label: "Details",
        content: <SecretDetails secret={selectedSecret} />,
      },
      {
        id: "usage",
        label: "Usage & Systems",
        content: <SecretUsage secret={selectedSecret} />,
      },
      {
        id: "rotation",
        label: "Rotation & History",
        content: <SecretRotation secret={selectedSecret} rotationHistory={rotationHistory} />,
      },
      {
        id: "security",
        label: "Security & Access",
        content: <SecretSecurity secret={selectedSecret} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <VaultOverview secrets={secrets} rotationHistory={rotationHistory} />,
      }
    ];

  return (
    <>
      <ListPane
        title="Vault Store"
        context="DEWA – Transmission"
        count={filteredAndSortedSecrets.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "certificate", label: "Certificates" },
              { value: "private_key", label: "Private Keys" },
              { value: "api_key", label: "API Keys" },
              { value: "password", label: "Passwords" },
              { value: "token", label: "Tokens" },
              { value: "shared_secret", label: "Shared Secrets" },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
              { value: "revoked", label: "Revoked" },
              { value: "pending_rotation", label: "Pending Rotation" },
              { value: "archived", label: "Archived" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        sortOptions={[
          { label: 'Status (Active First)', value: 'status' },
          { label: 'Name', value: 'name' },
          { label: 'Type', value: 'type' },
          { label: 'Usage Frequency', value: 'usage' },
          { label: 'Expiration Date', value: 'expiry' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="mb-4">
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Secret
          </Button>
        </div>

        <div className="space-y-1">
          {filteredAndSortedSecrets.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Secrets Found"
              description="No secrets or certificates match your search criteria"
            />
          ) : (
            filteredAndSortedSecrets.map((secret) => (
              <ListPaneItem
                key={secret.id}
                title={secret.name}
                description={`${secret.secretType.replace('_', ' ').toUpperCase()} • ${secret.protocol || 'Generic'}`}
                status={secret.status === 'active' ? 'online' : (secret.status === 'expired' || secret.status === 'revoked' ? 'offline' : 'maintenance')}
                category={secret.secretType.toUpperCase()}
                value={`${secret.usageCount}`}
                isSelected={selectedSecretId === secret.id}
                onClick={() => setSelectedSecretId(secret.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedSecret ? selectedSecret.name : "Secrets & Certificates Overview"}
        subtitle={selectedSecret ? `${selectedSecret.secretType.replace('_', ' ')} • ${selectedSecret.protocol || 'Generic'}` : currentTenant?.name}
        tabs={tabs}
      />

      <CreateSecretDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}

function VaultOverview({ secrets, rotationHistory }: { secrets: SecretsCertificate[]; rotationHistory: CertificateRotationHistory[] }) {
  // Secrets by type
  const secretsByType = secrets.reduce((acc, s) => {
    const type = s.secretType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Secrets by status
  const secretsByStatus = secrets.reduce((acc, s) => {
    const status = s.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(secretsByType)
    .map(([name, value]) => ({
      name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    }))
    .sort((a, b) => b.value - a.value);

  const statusData = [
    { name: 'Active', value: secretsByStatus['active'] || 0, color: 'hsl(var(--success))' },
    { name: 'Expired', value: secretsByStatus['expired'] || 0, color: 'hsl(var(--destructive))' },
    { name: 'Pending Rotation', value: secretsByStatus['pending_rotation'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Revoked', value: secretsByStatus['revoked'] || 0, color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0);

  const keyAreas = [
    {
      icon: RotateCcw,
      title: "Automated Rotation",
      description: "Schedule regular rotation of critical transmission secrets."
    },
    {
      icon: Shield,
      title: "Strong Encryption",
      description: "All vault items are protected with hardware-backed encryption keys."
    },
    {
      icon: Lock,
      title: "Access Policy",
      description: "Strict RBAC controls and approval workflows for secret access."
    }
  ];

  const recentActivity = rotationHistory
    .sort((a, b) => new Date(b.rotationRequestedAt).getTime() - new Date(a.rotationRequestedAt).getTime())
    .slice(0, 5)
    .map(h => ({
      id: h.id,
      title: `Rotation: ${h.certificateId}`,
      subtitle: `${h.rotationReason} - ${new Date(h.rotationRequestedAt).toLocaleDateString()}`,
      status: h.status === 'completed' ? 'success' as const : h.status === 'failed' ? 'error' as const : 'warning' as const
    }));

  return (
    <IdentityOverview
      title="Secrets & Certificates Overview"
      description="Manage and monitor digital certificates, cryptographic keys, and sensitive credentials for secure grid communications."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Secrets",
          value: secrets.length,
          icon: Shield,
          variant: "primary"
        },
        {
          title: "Active Certificates",
          value: secrets.filter(s => s.secretType === 'certificate' && s.status === 'active').length,
          icon: FileKey,
          variant: "success"
        },
        {
          title: "Expiring Soon",
          value: secrets.filter(s => {
            const now = new Date();
            const expiry = s.validUntil ? new Date(s.validUntil) : null;
            if (!expiry) return false;
            const diff = expiry.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            return days >= 0 && days <= 30;
          }).length,
          icon: AlertTriangle,
          variant: secrets.some(s => {
            const now = new Date();
            const expiry = s.validUntil ? new Date(s.validUntil) : null;
            if (!expiry) return false;
            const diff = expiry.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            return days >= 0 && days <= 30;
          }) ? "warning" : "default"
        },
        {
          title: "Expired Secrets",
          value: secrets.filter(s => {
            const now = new Date();
            const expiry = s.validUntil ? new Date(s.validUntil) : null;
            return expiry && expiry < now;
          }).length,
          icon: XCircle,
          variant: secrets.some(s => {
            const now = new Date();
            const expiry = s.validUntil ? new Date(s.validUntil) : null;
            return expiry && expiry < now;
          }) ? "destructive" : "default"
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Certificate Status Distribution"
        pieChartData={statusData}
        pieChartIcon={FileKey}
        barChartTitle="Secrets by Type"
        barChartData={typeData}
        barChartIcon={Key}
        keyAreasTitle="Security Controls"
        keyAreas={keyAreas}
        recentActivityTitle="Recent Rotation Activity"
        recentActivity={recentActivity}
      />
    </IdentityOverview>
  );
}

function SecretDetails({ secret }: { secret: SecretsCertificate }) {
  const [showSecret, setShowSecret] = useState(false);

  const getDaysUntilExpiry = (validUntil?: string) => {
    if (!validUntil) return null;
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry(secret.validUntil);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <div className="space-y-6">
      {/* Secret Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            {secret.secretType === 'certificate' ? (
              <FileKey className="w-8 h-8 text-primary" />
            ) : secret.secretType === 'private_key' ? (
              <Key className="w-8 h-8 text-primary" />
            ) : (
              <Shield className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{secret.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {secret.description || `${secret.secretType.replace('_', ' ')} for transmission systems`}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${secret.status === "active"
                  ? "bg-success/10 text-success"
                  : secret.status === "expired"
                    ? "bg-destructive/10 text-destructive"
                    : secret.status === "pending_rotation"
                      ? "bg-warning/10 text-warning"
                      : "bg-secondary text-muted-foreground"
                  }`}
              >
                {secret.status.replace('_', ' ')}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {secret.certificateType ? secret.certificateType.replace('_', ' ') : secret.secretType.replace('_', ' ')}
              </span>
              {secret.protocol && (
                <span className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">
                  {secret.protocol}
                </span>
              )}
              {secret.requiresApproval && (
                <span className="text-xs px-3 py-1 rounded-full bg-warning/10 text-warning">
                  Requires Approval
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Information */}
      {secret.secretType === 'certificate' && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Certificate Information</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {secret.subjectDn && (
              <div className="p-4 flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Subject DN</p>
                  <p className="text-sm font-medium font-mono">{secret.subjectDn}</p>
                </div>
              </div>
            )}
            {secret.issuerDn && (
              <div className="p-4 flex items-center gap-3">
                <FileKey className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Issuer DN</p>
                  <p className="text-sm font-medium font-mono">{secret.issuerDn}</p>
                </div>
              </div>
            )}
            {secret.serialNumber && (
              <div className="p-4 flex items-center gap-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Serial Number</p>
                  <p className="text-sm font-medium font-mono">{secret.serialNumber}</p>
                </div>
              </div>
            )}
            {secret.fingerprintSha256 && (
              <div className="p-4 flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">SHA-256 Fingerprint</p>
                  <p className="text-sm font-medium font-mono break-all">{secret.fingerprintSha256}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Secret Value (for non-certificates) */}
      {secret.secretType !== 'certificate' && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Secret Value</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Encrypted Value</p>
                {showSecret ? (
                  <p className="text-sm font-mono bg-secondary/50 p-2 rounded break-all">
                    {secret.secretType === 'api_key' ? 'sk_live_REPLACED_SECRET' :
                      secret.secretType === 'password' ? 'REPLACED_SECRET_PASSWORD' :
                        'REPLACED_SHARED_SECRET'}
                  </p>
                ) : (
                  <p className="text-sm font-mono bg-secondary/50 p-2 rounded">
                    {'•'.repeat(32)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {showSecret && (
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validity Period */}
      {secret.validFrom && secret.validUntil && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Validity Period</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Valid From</p>
                <p className="text-sm font-medium">{new Date(secret.validFrom).toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Valid Until</p>
                <p className="text-sm font-medium">{new Date(secret.validUntil).toLocaleString()}</p>
              </div>
              {(isExpired || isExpiringSoon) && (
                <div className="flex items-center gap-2">
                  {isExpired ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  <span className={`text-xs ${isExpired ? 'text-destructive' : 'text-warning'}`}>
                    {isExpired
                      ? `Expired ${Math.abs(daysUntilExpiry!)} days ago`
                      : `Expires in ${daysUntilExpiry} days`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Metadata</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{new Date(secret.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {secret.createdBy && (
            <div className="p-4 flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="text-sm font-medium">{secret.createdBy}</p>
              </div>
            </div>
          )}
          {secret.approvedBy && (
            <div className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Approved By</p>
                <p className="text-sm font-medium">{secret.approvedBy}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">{new Date(secret.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Actions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Rotate
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            {secret.status === 'active' ? 'Revoke' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecretUsage({ secret }: { secret: SecretsCertificate }) {
  return (
    <div className="space-y-6">
      {/* Usage Statistics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Usage Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{secret.usageCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Uses</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{secret.usedBySystems.length}</p>
                <p className="text-xs text-muted-foreground">Connected Systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Last Activity</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {secret.lastUsed
                  ? `Last used: ${new Date(secret.lastUsed).toLocaleString()}`
                  : 'Never used'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Systems */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Connected Systems</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            {secret.usedBySystems.map((system, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                <Server className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{system}</p>
                  <p className="text-xs text-muted-foreground">
                    {secret.protocol ? `Using ${secret.protocol}` : 'Generic connection'}
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Associated Assets */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Associated Assets</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-2">
            {secret.assetIds.map((assetId) => (
              <div key={assetId} className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono">{assetId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Zones */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Zones</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-2">
            {secret.zoneIds.map((zoneId) => (
              <div key={zoneId} className="flex items-center gap-2 p-2 bg-warning/10 rounded">
                <Shield className="w-4 h-4 text-warning" />
                <span className="text-sm">{zoneId.replace('zone-', '').replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecretRotation({ secret, rotationHistory }: { secret: SecretsCertificate; rotationHistory: CertificateRotationHistory[] }) {
  const secretRotationHistory = rotationHistory.filter(h => h.certificateId === secret.id);

  return (
    <div className="space-y-6">
      {/* Rotation Schedule */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Rotation Schedule</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Rotation Interval</p>
              <p className="text-sm font-medium">{secret.rotationIntervalDays} days</p>
            </div>
          </div>
          {secret.lastRotated && (
            <div className="p-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Rotated</p>
                <p className="text-sm font-medium">{new Date(secret.lastRotated).toLocaleString()}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Next Rotation Due</p>
              <p className="text-sm font-medium">
                {secret.lastRotated
                  ? new Date(new Date(secret.lastRotated).getTime() + secret.rotationIntervalDays * 24 * 3600000).toLocaleString()
                  : 'Not scheduled'
                }
              </p>
            </div>
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rotate Now
            </Button>
          </div>
        </div>
      </div>

      {/* Rotation History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Rotation History</h4>
        <div className="space-y-3">
          {secretRotationHistory.length > 0 ? (
            secretRotationHistory.map((rotation) => (
              <div key={rotation.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium capitalize">{rotation.rotationType} Rotation</p>
                      <Badge
                        variant={rotation.status === 'completed' ? 'default' :
                          rotation.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {rotation.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {rotation.rotationReason}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Requested</p>
                        <p>{new Date(rotation.rotationRequestedAt).toLocaleString()}</p>
                        <p className="text-muted-foreground">By: {rotation.requestedBy}</p>
                      </div>
                      {rotation.rotationCompletedAt && (
                        <div>
                          <p className="text-muted-foreground">Completed</p>
                          <p>{new Date(rotation.rotationCompletedAt).toLocaleString()}</p>
                          <p className="text-muted-foreground">By: {rotation.completedBy}</p>
                        </div>
                      )}
                    </div>
                    {rotation.affectedSystems.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Affected Systems:</p>
                        <div className="flex flex-wrap gap-1">
                          {rotation.affectedSystems.map((system) => (
                            <Badge key={system} variant="outline" className="text-xs">
                              {system}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No rotation history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Rotation Actions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Schedule Rotation
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Update Schedule
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export History
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecretSecurity({ secret }: { secret: SecretsCertificate }) {
  return (
    <div className="space-y-6">
      {/* Security Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            {secret.status === "active" ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : secret.status === "expired" ? (
              <XCircle className="w-8 h-8 text-destructive" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-warning" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Security Status</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {secret.status === "active"
                ? "This secret is active and secure"
                : secret.status === "expired"
                  ? "This secret has expired and should be rotated"
                  : "This secret has security concerns"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Access Control</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Requires Approval</p>
              <p className="text-sm font-medium">{secret.requiresApproval ? 'Yes' : 'No'}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Authorized Roles</p>
            <div className="flex flex-wrap gap-2">
              {secret.accessRoles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Encryption Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Encryption</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Encryption Key ID</p>
              <p className="text-sm font-medium font-mono">{secret.encryptionKeyId}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Key className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Storage</p>
              <p className="text-sm font-medium">Encrypted at rest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Recommendations</h4>
        <div className="space-y-3">
          {secret.status === 'expired' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-destructive mb-1">Expired Secret</h5>
                  <p className="text-xs text-destructive">
                    This secret has expired and should be rotated immediately to maintain security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {secret.validUntil && new Date(secret.validUntil) < new Date(Date.now() + 30 * 24 * 3600000) && secret.status === 'active' && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-warning mb-1">Expiring Soon</h5>
                  <p className="text-xs text-warning">
                    This secret expires soon. Consider rotating it before expiration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-success mb-1">Security Best Practices</h5>
                <ul className="text-xs text-success space-y-1">
                  <li>• Regularly rotate secrets and certificates</li>
                  <li>• Monitor usage patterns for anomalies</li>
                  <li>• Use role-based access control</li>
                  <li>• Enable approval workflows for sensitive operations</li>
                  <li>• Maintain audit trails for all access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateSecretForm({ onClose }: { onClose: () => void }) {
  const [secretType, setSecretType] = useState<'certificate' | 'private_key' | 'api_key' | 'password' | 'token' | 'shared_secret'>('certificate');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="secret-type">Type</Label>
        <Select value={secretType} onValueChange={(value: any) => setSecretType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certificate">Certificate</SelectItem>
            <SelectItem value="private_key">Private Key</SelectItem>
            <SelectItem value="api_key">API Key</SelectItem>
            <SelectItem value="password">Password</SelectItem>
            <SelectItem value="token">Token</SelectItem>
            <SelectItem value="shared_secret">Shared Secret</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a descriptive name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose of this secret"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onClose} className="flex-1">
          <Upload className="w-4 h-4 mr-2" />
          Create {secretType.replace('_', ' ')}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CreateSecretDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Secret or Certificate</DialogTitle>
        </DialogHeader>
        <CreateSecretForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}