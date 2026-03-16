import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Clock,
  Shield,
  Activity,
  Building2,
  CheckCircle2,
  XCircle,
  Factory,
  Zap,
  Settings,
  AlertCircle,
} from "lucide-react";
import {
  getSecurityUsers,
  getSecurityUsersByRole,
  getSecurityUsersByStatus,
  validateUserRole,
  validateUserStatus,
  hasRequiredRole,
  getRoleLevel,
  canManageUser
} from "@/lib/securityQueries";
import type { SecurityUser, TransmissionRole, UserStatus } from "@/types/security";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";

// Helper function to get transmission role descriptions
function getRoleDescription(role: TransmissionRole): string {
  const descriptions: Record<TransmissionRole, string> = {
    'operator': 'Operates transmission equipment and monitors substation systems',
    'engineer': 'Designs, configures, and maintains transmission infrastructure systems',
    'supervisor': 'Supervises transmission operations and coordinates maintenance activities',
    'administrator': 'Manages overall system administration and security configurations',
    'auditor': 'Audits system configurations and ensures compliance with transmission standards'
  };

  return descriptions[role] || 'Transmission operations role';
}

export function UserRoleDirectory() {
  const { currentTenant } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from Supabase
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const userData = await getSecurityUsers(currentTenant?.id || "");
        setUsers(userData);
      } catch (err) {
        console.error('Failed to load security users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [currentTenant?.id]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    // Role Filter
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(user => user.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "recent") {
        const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy]);

  // No longer auto-selecting the first user to allow showing the Overview
  /*
  useEffect(() => {
    if (filteredUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);
  */

  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingState loadingText="Loading user role directory..." />
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

  // No early return for empty users to allow showing the Overview
  /*
  if (users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="No users found"
          description="No security users have been configured for this transmission tenant."
        />
      </div>
    );
  }
  */

  const overviewData = {
    title: "User & Role Directory Overview",
    description: "Manage and monitor security users, their roles, and access across transmission zones.",
    metrics: [
      {
        title: "Total Users",
        value: users.length,
        icon: UserIcon,
        variant: "primary" as const
      },
      {
        title: "Active Users",
        value: users.filter(u => u.status === 'active').length,
        icon: CheckCircle2,
        variant: "success" as const
      },
      {
        title: "MFA Enabled",
        value: users.filter(u => u.mfaEnabled).length,
        icon: Shield,
        variant: "success" as const
      },
      {
        title: "Failed Logins",
        value: users.reduce((acc, u) => acc + u.failedLoginAttempts, 0),
        icon: AlertCircle,
        variant: users.some(u => u.failedLoginAttempts > 0) ? "warning" as const : "default" as const
      }
    ]
  };

  const tabs = selectedUser
    ? [
      {
        id: "profile",
        label: "Profile",
        content: <UserProfile user={selectedUser} />,
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        content: <UserRolesPermissions user={selectedUser} />,
      },
      {
        id: "activity",
        label: "Activity",
        content: <UserActivity user={selectedUser} />,
      },
      {
        id: "zones",
        label: "Zone Access",
        content: <UserZoneAccess user={selectedUser} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <UserDirectoryOverview users={users} />,
      }
    ];

  return (
    <>
      <ListPane
        title="Users"
        context="DEWA – Transmission"
        count={filteredAndSortedUsers.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "role",
            label: "Role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "all", label: "All Roles" },
              { value: "administrator", label: "Administrators" },
              { value: "supervisor", label: "Supervisors" },
              { value: "engineer", label: "Engineers" },
              { value: "operator", label: "Operators" },
              { value: "auditor", label: "Auditors" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Full Name", value: "name" },
          { label: "User Role", value: "role" },
          { label: "Account Status", value: "status" },
          { label: "Recently Active", value: "recent" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedUsers.length === 0 ? (
            <EmptyState
              icon={UserIcon}
              title="No Users Found"
              description="No users match your current search and filters"
            />
          ) : (
            filteredAndSortedUsers.map((user) => (
              <ListPaneItem
                key={user.id}
                title={user.fullName}
                description={`${user.email}`}
                status={user.status === 'active' ? 'online' : (user.status === 'suspended' ? 'offline' : 'maintenance')}
                category={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                value={user.lastLogin ? `Active: ${new Date(user.lastLogin).toLocaleDateString()}` : 'Never'}
                isSelected={selectedUserId === user.id}
                onClick={() => setSelectedUserId(user.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedUser ? selectedUser.fullName : "User Directory Overview"}
        subtitle={selectedUser ? selectedUser.email : currentTenant.name}
        tabs={tabs}
      />
    </>
  );
}

function UserDirectoryOverview({ users }: { users: SecurityUser[] }) {
  // Users by role
  const usersByRole = users.reduce((acc, user) => {
    const role = user.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Users by status
  const usersByStatus = users.reduce((acc, user) => {
    const status = user.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent users (last 5 by lastLogin)
  const recentUsers = [...users]
    .filter(u => u.lastLogin)
    .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
    .slice(0, 5);

  // Prepare chart data
  const statusData = [
    { name: 'Active', value: usersByStatus['active'] || 0, color: 'hsl(var(--success))' },
    { name: 'Inactive', value: usersByStatus['inactive'] || 0, color: 'hsl(var(--muted))' },
    { name: 'Suspended', value: usersByStatus['suspended'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const roleData = Object.entries(usersByRole)
    .map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const keyAreas = [
    {
      icon: CheckCircle2,
      title: "Multi-Factor Authentication",
      description: "Enforce MFA for all transmission system access."
    },
    {
      icon: Factory,
      title: "Zone-Based Access Control",
      description: "Restrict user access to specific transmission zones."
    },
    {
      icon: Settings,
      title: "Role-Based Permissions",
      description: "Assign permissions based on operational roles."
    }
  ];

  const recentActivity = recentUsers.map(user => ({
    id: user.id,
    title: user.fullName,
    subtitle: user.lastLogin ? `Last Login: ${new Date(user.lastLogin).toLocaleDateString()}` : 'Never logged in',
    status: (user.status === 'active' ? 'success' : 'warning') as "success" | "warning" | "error" | "info"
  }));

  return (
    <IdentityOverview
      title="User & Role Directory Overview"
      description="Manage and monitor security users, their roles, and access across transmission zones."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Users",
          value: users.length,
          icon: UserIcon,
          variant: "primary"
        },
        {
          title: "Active Users",
          value: users.filter(u => u.status === 'active').length,
          icon: CheckCircle2,
          variant: "success"
        },
        {
          title: "MFA Enabled",
          value: users.filter(u => u.mfaEnabled).length,
          icon: Shield,
          variant: "success"
        },
        {
          title: "Failed Logins",
          value: users.reduce((acc, u) => acc + u.failedLoginAttempts, 0),
          icon: AlertCircle,
          variant: users.some(u => u.failedLoginAttempts > 0) ? "warning" : "default"
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="User Status Distribution"
        pieChartData={statusData}
        pieChartIcon={UserIcon}
        barChartTitle="Users by Role"
        barChartData={roleData}
        barChartIcon={Shield}
        keyAreasTitle="Key Access Areas"
        keyAreas={keyAreas}
        recentActivityTitle="Recent User Activity"
        recentActivity={recentActivity}
      />
    </IdentityOverview>
  );
}

function UserProfile({ user }: { user: SecurityUser }) {
  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-2xl">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{user.fullName}</h3>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{user.role}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${user.status === "active"
                  ? "bg-success/10 text-success"
                  : user.status === "inactive"
                    ? "bg-secondary text-muted-foreground"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {user.status}
              </span>
              {user.mfaEnabled && (
                <span className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  MFA Enabled
                </span>
              )}
              {user.failedLoginAttempts > 0 && (
                <span className="text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {user.failedLoginAttempts} Failed Attempts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="text-sm font-medium">{user.username}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">Transmission Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Account Details</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Login</p>
              <p className="text-sm font-medium">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Security Status</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {user.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
                </p>
                {user.failedLoginAttempts > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                    {user.failedLoginAttempts} Failed
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Factory className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Zone Access</p>
              <p className="text-sm font-medium">{user.accessZones.length} zones</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Permissions</p>
              <p className="text-sm font-medium">{user.permissions.length} permissions</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Account Created</p>
              <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRolesPermissions({ user }: { user: SecurityUser }) {
  // Define transmission role permissions based on role type
  const rolePermissions = useMemo(() => {
    const permissions: Record<TransmissionRole, string[]> = {
      'operator': [
        'view-transmission-assets',
        'operate-substation-controls',
        'view-grid-topology',
        'acknowledge-transmission-alarms',
        'monitor-power-flows'
      ],
      'engineer': [
        'configure-transmission-systems',
        'modify-protection-settings',
        'access-engineering-tools',
        'view-system-diagnostics',
        'manage-device-configurations',
        'perform-system-maintenance',
        'analyze-grid-stability'
      ],
      'supervisor': [
        'supervise-transmission-operations',
        'authorize-critical-operations',
        'view-all-transmission-systems',
        'manage-emergency-procedures',
        'coordinate-maintenance-activities',
        'approve-switching-operations'
      ],
      'administrator': [
        'manage-security-policies',
        'configure-access-controls',
        'view-all-security-data',
        'approve-security-exceptions',
        'manage-user-access',
        'configure-system-settings',
        'manage-certificates'
      ],
      'auditor': [
        'view-audit-logs',
        'generate-compliance-reports',
        'audit-system-configurations',
        'review-security-events',
        'access-forensic-data',
        'export-audit-data'
      ]
    };

    return permissions[user.role] || [];
  }, [user.role]);

  return (
    <div className="space-y-6">
      {/* Assigned Roles */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Assigned Role</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h5 className="text-sm font-medium capitalize">{user.role}</h5>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Level {getRoleLevel(user.role)}
              </span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {getRoleDescription(user.role)}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3" />
            <span>{rolePermissions.length} permissions</span>
          </div>
        </div>
      </div>

      {/* All Permissions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Role Permissions ({rolePermissions.length})
        </h4>
        <div className="bg-card border border-border rounded-lg">
          <div className="divide-y divide-border">
            {rolePermissions.map((permission) => (
              <div key={permission} className="p-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm">{permission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User-Specific Permissions */}
      {user.permissions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">
            Additional Permissions ({user.permissions.length})
          </h4>
          <div className="bg-card border border-border rounded-lg">
            <div className="divide-y divide-border">
              {user.permissions.map((permission) => (
                <div key={permission} className="p-3 flex items-center gap-3">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="text-sm">{permission.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zone Access */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Zone Access</h4>
        <div className="bg-card border border-border rounded-lg">
          <div className="divide-y divide-border">
            {user.accessZones.map((zone) => (
              <div key={zone} className="p-3 flex items-center gap-3">
                <Factory className="w-4 h-4 text-primary" />
                <span className="text-sm capitalize">{zone.replace(/-/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Available Roles */}
      <div>
        <h4 className="text-sm font-semibold mb-3">All Available Roles</h4>
        <div className="bg-card border border-border rounded-lg">
          <div className="divide-y divide-border">
            {[
              { name: 'administrator', displayName: 'Administrator', isSystem: true, userCount: 2, level: 4 },
              { name: 'supervisor', displayName: 'Supervisor', isSystem: true, userCount: 3, level: 3 },
              { name: 'auditor', displayName: 'Auditor', isSystem: true, userCount: 1, level: 3 },
              { name: 'engineer', displayName: 'Engineer', isSystem: false, userCount: 5, level: 2 },
              { name: 'operator', displayName: 'Operator', isSystem: false, userCount: 8, level: 1 }
            ].map((role) => (
              <div key={role.name} className="p-3 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{role.displayName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    Level {role.level}
                  </span>
                  {role.isSystem && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      System
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {role.userCount} users
                  </span>
                  {user.role === role.name ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserActivity({ user }: { user: SecurityUser }) {
  // Mock activity data based on transmission user role
  const activities = useMemo(() => {
    const baseTime = user.lastLogin ? new Date(user.lastLogin).getTime() : Date.now();

    const roleActivities: Record<TransmissionRole, any[]> = {
      'administrator': [
        {
          id: "1",
          action: "Logged in",
          timestamp: new Date(baseTime).toISOString(),
          details: "Successful privileged login with MFA",
          type: "authentication",
        },
        {
          id: "2",
          action: "Updated access policy",
          timestamp: new Date(baseTime - 30 * 60000).toISOString(),
          details: "Modified transmission zone access restrictions",
          type: "configuration",
        },
        {
          id: "3",
          action: "Created security user",
          timestamp: new Date(baseTime - 2 * 3600000).toISOString(),
          details: "Added new engineer user account",
          type: "user_management",
        }
      ],
      'supervisor': [
        {
          id: "1",
          action: "Logged in",
          timestamp: new Date(baseTime).toISOString(),
          details: "Successful login to transmission control",
          type: "authentication",
        },
        {
          id: "2",
          action: "Approved switching operation",
          timestamp: new Date(baseTime - 45 * 60000).toISOString(),
          details: "Authorized breaker operation at Substation A",
          type: "authorization",
        },
        {
          id: "3",
          action: "Reviewed security alerts",
          timestamp: new Date(baseTime - 2 * 3600000).toISOString(),
          details: "Investigated protection relay anomaly",
          type: "security",
        }
      ],
      'auditor': [
        {
          id: "1",
          action: "Logged in",
          timestamp: new Date(baseTime).toISOString(),
          details: "Successful login to audit console",
          type: "authentication",
        },
        {
          id: "2",
          action: "Generated compliance report",
          timestamp: new Date(baseTime - 60 * 60000).toISOString(),
          details: "Created IEC 62443 compliance summary",
          type: "report",
        },
        {
          id: "3",
          action: "Exported audit logs",
          timestamp: new Date(baseTime - 3 * 3600000).toISOString(),
          details: "Downloaded security events for investigation",
          type: "export",
        }
      ],
      'engineer': [
        {
          id: "1",
          action: "Logged in",
          timestamp: new Date(baseTime).toISOString(),
          details: "Successful login to engineering workstation",
          type: "authentication",
        },
        {
          id: "2",
          action: "Modified protection settings",
          timestamp: new Date(baseTime - 90 * 60000).toISOString(),
          details: "Updated relay configuration for Line 138kV-01",
          type: "configuration",
        },
        {
          id: "3",
          action: "Performed system diagnostics",
          timestamp: new Date(baseTime - 4 * 3600000).toISOString(),
          details: "Analyzed SCADA communication status",
          type: "diagnostics",
        }
      ],
      'operator': [
        {
          id: "1",
          action: "Logged in",
          timestamp: new Date(baseTime).toISOString(),
          details: "Successful login to operator console",
          type: "authentication",
        },
        {
          id: "2",
          action: "Acknowledged alarm",
          timestamp: new Date(baseTime - 15 * 60000).toISOString(),
          details: "Acknowledged transformer temperature alarm",
          type: "operation",
        },
        {
          id: "3",
          action: "Monitored grid status",
          timestamp: new Date(baseTime - 1 * 3600000).toISOString(),
          details: "Reviewed power flow and voltage levels",
          type: "monitoring",
        }
      ]
    };

    return roleActivities[user.role] || [
      {
        id: "1",
        action: "Logged in",
        timestamp: new Date(baseTime).toISOString(),
        details: "Successful system login",
        type: "authentication",
      }
    ];
  }, [user.role, user.lastLogin]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${activity.type === "authentication"
                  ? "bg-success"
                  : activity.type === "configuration"
                    ? "bg-warning"
                    : "bg-primary"
                  }`}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.details}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">
                    {activity.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Activity Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Logins</p>
            <p className="text-2xl font-bold">247</p>
            <p className="text-xs text-success mt-1">Last 30 days</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Actions Performed</p>
            <p className="text-2xl font-bold">1,432</p>
            <p className="text-xs text-primary mt-1">Last 30 days</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Failed Attempts</p>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserZoneAccess({ user }: { user: SecurityUser }) {
  // Mock transmission zone data
  const transmissionZones = useMemo(() => [
    {
      id: 'substation-control',
      name: 'Substation Control',
      type: 'substation-control',
      description: 'Primary control systems for substation operations',
      securityLevel: 3,
      assetCount: 45,
      status: 'secure'
    },
    {
      id: 'protection-systems',
      name: 'Protection Systems',
      type: 'protection-systems',
      description: 'Critical protection relay and safety systems',
      securityLevel: 4,
      assetCount: 32,
      status: 'secure'
    },
    {
      id: 'scada-network',
      name: 'SCADA Network',
      type: 'scada-network',
      description: 'Supervisory control and data acquisition infrastructure',
      securityLevel: 3,
      assetCount: 28,
      status: 'at-risk'
    },
    {
      id: 'corporate-network',
      name: 'Corporate Network',
      type: 'corporate-network',
      description: 'Business and administrative network zone',
      securityLevel: 2,
      assetCount: 156,
      status: 'secure'
    },
    {
      id: 'field-devices',
      name: 'Field Devices',
      type: 'field-devices',
      description: 'Remote field equipment and sensors',
      securityLevel: 2,
      assetCount: 89,
      status: 'secure'
    }
  ], []);

  // Filter zones based on user access
  const accessibleZones = transmissionZones.filter(zone =>
    user.accessZones.includes(zone.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Factory className="w-4 h-4 text-primary" />
          Accessible Zones ({accessibleZones.length})
        </h4>
        <div className="grid gap-4">
          {accessibleZones.map((zone) => (
            <div key={zone.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="text-sm font-medium">{zone.name}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {zone.description}
                  </p>
                </div>
                <StatusBadge status={zone.status} />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Security Level</p>
                  <p className="font-medium">Level {zone.securityLevel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assets</p>
                  <p className="font-medium">{zone.assetCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{zone.type.replace(/-/g, ' ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Access Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Access Summary</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Zones</span>
              <span className="text-sm font-medium">{transmissionZones.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accessible Zones</span>
              <span className="text-sm font-medium text-primary">{accessibleZones.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Restricted Zones</span>
              <span className="text-sm font-medium">{transmissionZones.length - accessibleZones.length}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Access Level</span>
                <span className="text-sm font-medium text-primary">
                  {Math.round((accessibleZones.length / transmissionZones.length) * 100)}% Coverage
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
