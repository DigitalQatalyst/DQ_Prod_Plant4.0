import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Key as KeyIcon,
  Shield,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Database,
  Lock,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  getEncryptionKeys,
  getKeyRotationHistory,
  getKeyUsageAudit,
  getEncryptionKeyManagementSummary,
  isEncryptionKeyQueriesAvailable,
  initiateKeyRotation,
} from "@/lib/encryptionKeyQueries";
import type {
  EncryptionKey,
  KeyRotationHistory,
  EncryptionKeyManagementSummary,
} from "@/types/security";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function EncryptionKeyManagement() {
  const { currentTenant } = useApp();
  const [keys, setKeys] = useState<EncryptionKey[]>([]);
  const [rotationHistory, setRotationHistory] = useState<KeyRotationHistory[]>([]);
  const [usageAudit, setUsageAudit] = useState<any[]>([]);
  const [summary, setSummary] = useState<EncryptionKeyManagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<EncryptionKey | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("status");

  const isSupabaseAvailable = isEncryptionKeyQueriesAvailable();

  // Load data from Supabase
  useEffect(() => {
    if (!isSupabaseAvailable) {
      setError("Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [keysData, rotationData, usageData, summaryData] = await Promise.all([
          getEncryptionKeys(currentTenant.id),
          getKeyRotationHistory(currentTenant.id, undefined, { limit: 50 }),
          getKeyUsageAudit(currentTenant.id, undefined, { limit: 100 }),
          getEncryptionKeyManagementSummary(currentTenant.id),
        ]);

        setKeys(keysData);
        setRotationHistory(rotationData);
        setUsageAudit(usageData);
        setSummary(summaryData);

        // Removed auto-selection to show overview by default
        /*
        if (keysData.length > 0 && !selectedKey) {
          setSelectedKey(keysData[0]);
        }
        */
      } catch (err) {
        console.error("Error loading encryption key management:", err);
        setError(err instanceof Error ? err.message : "Failed to load encryption key data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentTenant.id, isSupabaseAvailable]);

  // Filter and sort keys
  const filteredAndSortedKeys = useMemo(() => {
    let result = keys.filter((key) => {
      const matchesSearch =
        (key.keyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (key.algorithm || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (key.usageType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || key.status === filterStatus;
      const matchesType = filterType === "all" || key.usageType === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const statusOrder: Record<string, number> = { 'compromised': 0, 'expired': 1, 'pending-rotation': 2, 'active': 3, 'inactive': 4 };
          const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
          if (statusDiff !== 0) return statusDiff;
          return (a.keyName || '').localeCompare(b.keyName || '');
        }
        case 'name':
          return (a.keyName || '').localeCompare(b.keyName || '');
        case 'algorithm':
          return (a.algorithm || '').localeCompare(b.algorithm || '');
        case 'usage':
          return (a.usageType || '').localeCompare(b.usageType || '');
        case 'lastRotated':
          return new Date(b.lastRotated || 0).getTime() - new Date(a.lastRotated || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [keys, searchTerm, filterStatus, filterType, sortBy]);

  const isTransmissionTenant = currentTenant.sector === "transmission";

  // Handle loading state
  if (loading) {
    return (
      <>
        <ListPane
          title="Encryption Key Management"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <LoadingState loadingText="Loading encryption keys..." />
        </ListPane>
        <WorkPane title="Encryption Key" subtitle="Loading..." tabs={[]} />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <ListPane
          title="Encryption Key Management"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <EmptyState
            icon={AlertTriangle}
            title="Error Loading Data"
            description={error}
          />
        </ListPane>
        <WorkPane title="Encryption Key" subtitle="Error" tabs={[]} />
      </>
    );
  }

  // Handle empty data case
  if (!keys || keys.length === 0) {
    return (
      <>
        <ListPane
          title="Encryption Key Management"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <EmptyState
            icon={KeyIcon}
            title="No Encryption Keys"
            description={isTransmissionTenant
              ? "No transmission encryption keys configured"
              : "No encryption keys configured"
            }
          />
        </ListPane>
        <WorkPane
          title={selectedKey ? selectedKey.keyName : "Encryption Key Overview"}
          subtitle={selectedKey ? `${selectedKey.algorithm} • ${selectedKey.usageType.replace('-', ' ')}` : "Lifecycle management and policy enforcement for transmission cryptographic assets"}
          tabs={selectedKey ? [
            {
              id: "overview",
              label: "Overview",
              content: <OverviewTab keyData={selectedKey} summary={summary} />,
            },
            {
              id: "rotation",
              label: "Rotation",
              content: <RotationTab keyData={selectedKey} rotationHistory={rotationHistory.filter(r => r.keyId === selectedKey.id)} />,
            },
            {
              id: "usage",
              label: "Usage",
              content: <UsageAuditTab keyData={selectedKey} usageAudit={usageAudit.filter(u => u.key_id === selectedKey.id)} />,
            },
            {
              id: "policy",
              label: "Policy",
              content: <LifecycleTab keyData={selectedKey} />,
            },
          ] : [
            {
              id: "overview",
              label: "Overview",
              content: <KeysOverview keys={keys} summary={summary} rotationHistory={rotationHistory} onRotationClick={(id) => {
                const rotation = rotationHistory.find(r => r.id === id);
                if (rotation) {
                  const key = keys.find(k => k.id === rotation.keyId);
                  if (key) setSelectedKey(key);
                }
              }} />,
            }
          ]}
        />
      </>
    );
  }


  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Encryption Key Management"
        context="DEWA – Transmission"
        count={filteredAndSortedKeys.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "pending-rotation", label: "Pending Rotation" },
              { value: "inactive", label: "Inactive" },
              { value: "compromised", label: "Compromised" },
              { value: "expired", label: "Expired" },
            ],
            value: filterStatus,
            onChange: setFilterStatus,
          },
          {
            key: "usage",
            label: "Usage Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "data-encryption", label: "Data Encryption" },
              { value: "key-encryption", label: "Key Encryption" },
              { value: "signing", label: "Signing" },
              { value: "authentication", label: "Authentication" },
              { value: "protocol-encryption", label: "Protocol Encryption" },
            ],
            value: filterType,
            onChange: setFilterType,
          },
        ]}
        sortOptions={[
          { label: 'Status (Critical First)', value: 'status' },
          { label: 'Key Name', value: 'name' },
          { label: 'Algorithm', value: 'algorithm' },
          { label: 'Usage Type', value: 'usage' },
          { label: 'Last Rotated', value: 'lastRotated' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedKeys.length === 0 ? (
            <EmptyState
              icon={KeyIcon}
              title="No Keys Found"
              description="No encryption keys match your current filters"
            />
          ) : (
            filteredAndSortedKeys.map((key) => (
              <ListPaneItem
                key={key.id}
                title={key.keyName}
                description={key.description || `${key.algorithm} · ${key.keyLength}-bit`}
                status={key.status === 'active' ? 'online' : (key.status === 'pending-rotation' ? 'maintenance' : 'offline')}
                category={key.usageType.replace('-', ' ').toUpperCase()}
                value={key.algorithm.split('-')[0]}
                isSelected={selectedKey?.id === key.id}
                onClick={() => setSelectedKey(key)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedKey ? selectedKey.keyName : "Encryption Key Overview"}
        subtitle={selectedKey ? `${selectedKey.algorithm} • ${selectedKey.usageType.replace('-', ' ')}` : "Lifecycle management and policy enforcement for transmission cryptographic assets"}
        tabs={selectedKey ? [
          {
            id: "overview",
            label: "Overview",
            content: <OverviewTab keyData={selectedKey} summary={summary} />,
          },
          {
            id: "rotation",
            label: "Rotation",
            content: <RotationTab keyData={selectedKey} rotationHistory={rotationHistory.filter(r => r.keyId === selectedKey.id)} />,
          },
          {
            id: "usage",
            label: "Usage",
            content: <UsageAuditTab keyData={selectedKey} usageAudit={usageAudit.filter(u => u.key_id === selectedKey.id)} />,
          },
          {
            id: "policy",
            label: "Policy",
            content: <LifecycleTab keyData={selectedKey} />,
          },
        ] : [
          {
            id: "overview",
            label: "Overview",
            content: <KeysOverview keys={keys} summary={summary} rotationHistory={rotationHistory} onRotationClick={(id) => {
              const rotation = rotationHistory.find(r => r.id === id);
              if (rotation) {
                const key = keys.find(k => k.id === rotation.keyId);
                if (key) setSelectedKey(key);
              }
            }} />,
          }
        ]}
      />
    </div>
  );
}

function KeysOverview({
  keys,
  summary,
  rotationHistory,
  onRotationClick
}: {
  keys: EncryptionKey[];
  summary: any;
  rotationHistory: any[];
  onRotationClick: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Managed Cryptography Overview"
      description="Centralized lifecycle management for encryption keys, signing certificates, and hardware security modules."
      showTitleCard={false}
      metrics={[
        {
          title: "Active Keys",
          value: summary?.activeKeys || keys.filter(k => k.status === 'active').length,
          icon: KeyIcon,
          variant: 'primary'
        },
        {
          title: "Pending Rotation",
          value: summary?.pendingRotation || keys.filter(k => k.status === 'pending-rotation').length,
          icon: RefreshCw,
          variant: (summary?.pendingRotation || 0) > 0 ? "warning" : "success"
        },
        {
          title: "Expiring Soon",
          value: summary?.expiringSoon || 0,
          icon: Clock,
          variant: (summary?.expiringSoon || 0) > 5 ? "destructive" : (summary?.expiringSoon || 0) > 0 ? "warning" : "success"
        },
        {
          title: "Compromised",
          value: summary?.compromisedKeys || keys.filter(k => k.status === 'compromised').length,
          icon: AlertTriangle,
          variant: (summary?.compromisedKeys || 0) > 0 ? "destructive" : "default"
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Key Status Distribution"
        pieChartData={[
          { name: 'Active', value: keys.filter(k => k.status === 'active').length, color: 'hsl(var(--success))' },
          { name: 'Pending Rotation', value: keys.filter(k => k.status === 'pending-rotation').length, color: 'hsl(var(--warning))' },
          { name: 'Inactive', value: keys.filter(k => k.status === 'inactive').length, color: 'hsl(var(--muted-foreground))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Keys by Usage Count"
        barChartData={keys
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5)
          .map(k => ({ name: k.keyName, value: k.usageCount }))}
        keyAreasTitle="Key Security Areas"
        keyAreas={[
          {
            icon: Lock,
            title: "HSM Protection",
            description: "Hardware Security Module storage for root and high-criticality keys."
          },
          {
            icon: RefreshCw,
            title: "Automated Rotation",
            description: "Policy-driven key rotation workflows to limit cryptographic material exposure."
          },
          {
            icon: Shield,
            title: "Cryptographic Compliance",
            description: "Alignment with FIPS 140-2, NERC CIP, and industrial encryption standards."
          },
          {
            icon: Activity,
            title: "Key Usage Auditing",
            description: "Real-time monitoring and logging of all cryptographic operations."
          },
        ]}
        recentActivityTitle="Recent Key Rotations"
        recentActivity={rotationHistory
          .slice(0, 3)
          .map(rotation => ({
            id: rotation.id,
            title: rotation.rotationType.replace('-', ' ') + " Rotation",
            subtitle: rotation.requestedBy,
            status: rotation.status === 'completed' ? 'success' : 'error',
            value: new Date(rotation.rotationCompletedAt || rotation.rotationRequestedAt).toLocaleDateString()
          }))}
        onActivityClick={onRotationClick}
      />
    </IdentityOverview>
  );
}

function OverviewTab({ keyData, summary }: { keyData: EncryptionKey; summary: EncryptionKeyManagementSummary | null }) {
  const needsRotation = keyData.nextRotation && new Date(keyData.nextRotation) < new Date();
  const isExpiringSoon = keyData.expirationDate &&
    new Date(keyData.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* Key Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{keyData.keyName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {keyData.description || `${keyData.algorithm} encryption key for ${keyData.usageType.replace('-', ' ')}`}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${keyData.status === "active"
              ? "bg-success/10 text-success"
              : keyData.status === "pending-rotation"
                ? "bg-warning/10 text-warning"
                : keyData.status === "compromised"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-muted-foreground"
              }`}
          >
            <div className="flex items-center gap-2">
              {keyData.status === "active" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium capitalize">{keyData.status}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Usage Count</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{keyData.usageCount.toLocaleString()}</p>
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Key Age (days)</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">
                {Math.floor((Date.now() - new Date(keyData.createdDate).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
              <Clock className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Protected Assets</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{keyData.usedByAssets.length}</p>
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Backup Status</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{keyData.backupExists ? "Yes" : "No"}</p>
              <Database className={`w-5 h-5 ${keyData.backupExists ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(needsRotation || isExpiringSoon || !keyData.backupExists) && (
        <div className="space-y-2">
          {needsRotation && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-warning mb-1">Rotation Required</h4>
                <p className="text-xs text-muted-foreground">
                  This key is due for rotation. Next rotation was scheduled for {new Date(keyData.nextRotation!).toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}
          {isExpiringSoon && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-1">Expiring Soon</h4>
                <p className="text-xs text-muted-foreground">
                  This key will expire on {new Date(keyData.expirationDate!).toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}
          {!keyData.backupExists && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <Database className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-1">No Backup</h4>
                <p className="text-xs text-muted-foreground">
                  This key does not have a backup. Consider creating a backup for disaster recovery.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <KeyIcon className="w-4 h-4 text-primary" />
          Key Details
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Key Type</span>
            <span className="text-sm font-medium capitalize">{keyData.keyType.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Algorithm</span>
            <span className="text-sm font-medium">{keyData.algorithm}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Key Length</span>
            <span className="text-sm font-medium">{keyData.keyLength} bits</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Usage Type</span>
            <span className="text-sm font-medium capitalize">{keyData.usageType.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">HSM Protected</span>
            <span className={`text-sm font-medium ${keyData.requiresHsm ? 'text-success' : 'text-muted-foreground'}`}>
              {keyData.requiresHsm ? 'Yes' : 'No'}
            </span>
          </div>
          {keyData.hsmLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">HSM Location</span>
              <span className="text-sm font-medium">{keyData.hsmLocation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Protected Resources */}
      {(keyData.usedByServices.length > 0 || keyData.usedByAssets.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Protected Resources
          </h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {keyData.usedByServices.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Services</p>
                <div className="flex flex-wrap gap-1">
                  {keyData.usedByServices.map((service, index) => (
                    <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {keyData.usedByAssets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Assets</p>
                <div className="flex flex-wrap gap-1">
                  {keyData.usedByAssets.slice(0, 10).map((asset, index) => (
                    <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {asset}
                    </span>
                  ))}
                  {keyData.usedByAssets.length > 10 && (
                    <span className="px-2 py-0.5 bg-secondary text-xs rounded">
                      +{keyData.usedByAssets.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Standards */}
      {keyData.complianceStandards && keyData.complianceStandards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Compliance Standards
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {keyData.complianceStandards.map((standard) => (
                <span
                  key={standard}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {standard}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LifecycleTab({ keyData }: { keyData: EncryptionKey }) {
  return (
    <div className="space-y-6">
      {/* Lifecycle Timeline */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Key Lifecycle
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-success mt-2" />
            <div className="flex-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-xs text-muted-foreground">
                {new Date(keyData.createdDate).toLocaleString()}
              </p>
              {keyData.createdBy && (
                <p className="text-xs text-muted-foreground mt-1">By: {keyData.createdBy}</p>
              )}
            </div>
          </div>

          {keyData.activatedDate && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-success mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Activated</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(keyData.activatedDate).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {keyData.lastRotated && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-warning mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Last Rotated</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(keyData.lastRotated).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {keyData.nextRotation && (
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${new Date(keyData.nextRotation) < new Date() ? 'bg-destructive' : 'bg-primary'
                }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Next Rotation</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(keyData.nextRotation).toLocaleString()}
                </p>
                {new Date(keyData.nextRotation) < new Date() && (
                  <p className="text-xs text-destructive mt-1">Overdue</p>
                )}
              </div>
            </div>
          )}

          {keyData.expirationDate && (
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${new Date(keyData.expirationDate) < new Date() ? 'bg-destructive' : 'bg-warning'
                }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Expiration</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(keyData.expirationDate).toLocaleString()}
                </p>
                {new Date(keyData.expirationDate) < new Date() && (
                  <p className="text-xs text-destructive mt-1">Expired</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Policy */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          Rotation Policy
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rotation Interval</span>
            <span className="text-sm font-medium">{keyData.rotationIntervalDays} days</span>
          </div>
          {keyData.lastRotated && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days Since Last Rotation</span>
              <span className="text-sm font-medium">
                {Math.floor((Date.now() - new Date(keyData.lastRotated).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          )}
          {keyData.nextRotation && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days Until Next Rotation</span>
              <span className={`text-sm font-medium ${new Date(keyData.nextRotation) < new Date() ? 'text-destructive' : 'text-success'
                }`}>
                {Math.ceil((new Date(keyData.nextRotation).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Backup Information */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Backup & Recovery
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Backup Exists</span>
            <span className={`text-sm font-medium ${keyData.backupExists ? 'text-success' : 'text-destructive'}`}>
              {keyData.backupExists ? 'Yes' : 'No'}
            </span>
          </div>
          {keyData.backupLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backup Location</span>
              <span className="text-sm font-medium">{keyData.backupLocation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RotationTab({ keyData, rotationHistory }: { keyData: EncryptionKey; rotationHistory: KeyRotationHistory[] }) {
  return (
    <div className="space-y-6">
      {/* Rotation Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{rotationHistory.length}</p>
            <p className="text-sm text-muted-foreground">Total Rotations</p>
          </div>
        </div>

        {keyData.lastRotated && (
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Last Rotation</p>
            <p className="text-sm font-medium">{new Date(keyData.lastRotated).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor((Date.now() - new Date(keyData.lastRotated).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
        )}
      </div>

      {/* Rotation History */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Rotation History
        </h3>
        {rotationHistory.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold mb-1">No Rotation History</h3>
            <p className="text-xs text-muted-foreground">
              This key has not been rotated yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rotationHistory.map((rotation) => (
              <div key={rotation.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold capitalize">
                        {rotation.rotationType.replace('-', ' ')} Rotation
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${rotation.status === "completed"
                          ? "bg-success/10 text-success"
                          : rotation.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : rotation.status === "in-progress"
                              ? "bg-warning/10 text-warning"
                              : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        {rotation.status}
                      </span>
                    </div>
                    {rotation.rotationReason && (
                      <p className="text-xs text-muted-foreground">{rotation.rotationReason}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Requested</span>
                    <span className="font-medium">
                      {new Date(rotation.rotationRequestedAt).toLocaleString()}
                    </span>
                  </div>
                  {rotation.rotationCompletedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">
                        {new Date(rotation.rotationCompletedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Requested By</span>
                    <span className="font-medium">{rotation.requestedBy}</span>
                  </div>
                  {rotation.downtime !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Downtime</span>
                      <span className="font-medium">{rotation.downtime} minutes</span>
                    </div>
                  )}
                </div>

                {rotation.errorMessage && (
                  <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                    {rotation.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsageAuditTab({ keyData, usageAudit }: { keyData: EncryptionKey; usageAudit: any[] }) {
  return (
    <div className="space-y-6">
      {/* Usage Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{keyData.usageCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Operations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Last Used</p>
            <p className="text-sm font-medium">
              {keyData.lastUsed
                ? new Date(keyData.lastUsed).toLocaleString()
                : 'Never'
              }
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Audit Records</p>
            <p className="text-sm font-medium">{usageAudit.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Usage */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Recent Usage
        </h3>
        {usageAudit.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold mb-1">No Usage Records</h3>
            <p className="text-xs text-muted-foreground">
              No usage audit records available for this key
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {usageAudit.slice(0, 20).map((audit) => (
              <div key={audit.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold capitalize">
                        {audit.operation_type?.replace('_', ' ') || 'Unknown Operation'}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${audit.operation_status === "success"
                          ? "bg-success/10 text-success"
                          : audit.operation_status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                          }`}
                      >
                        {audit.operation_status}
                      </span>
                    </div>
                    {audit.username && (
                      <p className="text-xs text-muted-foreground">By: {audit.username}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(audit.usage_timestamp).toLocaleString()}
                  </span>
                </div>

                {audit.data_type && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {audit.data_type}
                    </span>
                  </div>
                )}

                {audit.error_message && (
                  <div className="mt-2 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                    {audit.error_message}
                  </div>
                )}

                {audit.is_anomalous && (
                  <div className="mt-2 p-2 bg-warning/5 border border-warning/20 rounded text-xs text-warning flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Anomalous activity detected
                  </div>
                )}
              </div>
            ))}
            {usageAudit.length > 20 && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Showing 20 of {usageAudit.length} records
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
