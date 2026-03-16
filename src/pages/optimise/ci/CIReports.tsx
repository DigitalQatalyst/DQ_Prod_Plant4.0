import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { SearchFilterSort } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  Plus,
  Download,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CIReport } from "@/types/optimise";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export function CIReports() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [reports, setReports] = useState<CIReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Use selectedAsset from AppContext for CIReport selection
  const selectedReport = selectedAsset as unknown as CIReport | null;

  // Clear any previous selection from other pages on mount
  useEffect(() => {
    setSelectedAsset(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load reports from database
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const data = await provider.listCiReports(currentTenant.id);
        setReports(data);
      } catch (error) {
        console.error('Failed to load CI reports:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [currentTenant.id, provider]);

  // Filter and sort reports based on search query
  const filteredReports = useMemo(() => {
    let filtered = reports;


    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(query) ||
          report.reportType.toLowerCase().includes(query) ||
          report.author.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime());
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [searchQuery, reports, sortBy]);

  const stats = useMemo(() => {
    const totalReports = filteredReports.length;
    const publishedReports = filteredReports.filter(report => report.status === "published").length;
    const inReviewReports = filteredReports.filter(report => report.status === "in-review").length;
    const draftReports = filteredReports.filter(report => report.status === "draft").length;
    return { totalReports, publishedReports, inReviewReports, draftReports };
  }, [filteredReports]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const reportTabs = selectedReport
    ? [
      {
        id: "configuration",
        label: "Configuration",
        content: <ConfigurationTab report={selectedReport} />,
      },
      {
        id: "content",
        label: "Content",
        content: <ContentTab report={selectedReport} />,
      },
      {
        id: "review",
        label: "Review",
        content: <ReviewTab report={selectedReport} />,
      },
      {
        id: "distribution",
        label: "Distribution",
        content: <DistributionTab report={selectedReport} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "CI Reports Overview",
        content: (
          <CIReportsOverview
            stats={stats}
            reports={filteredReports}
          />
        ),
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="CI Reports"
        subtitle={currentTenant.name}
        count={filteredReports.length}
        showFilters={false}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        }
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search reports..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            sortContent={
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        <div className="space-y-1">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReport?.id === report.id}
              onClick={() => setSelectedAsset(report as unknown as any)}
            />
          ))}
          {filteredReports.length === 0 && (
            <div className="p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reports found</p>
            </div>
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedReport ? selectedReport.name : "CI Reports"}
        subtitle={selectedReport ? `${selectedReport.reportType} · ${selectedReport.status}` : `${filteredReports.length} reports`}
        tabs={reportTabs}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Assist
            </Button>
          </div>
        }
      />
    </div>
  );
}

function ReportCard({
  report,
  isSelected,
  onClick,
}: {
  report: CIReport;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published": return "online";
      case "in-review": return "maintenance";
      case "draft": return "offline";
      default: return "offline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return CheckCircle;
      case "in-review": return Clock;
      case "draft": return FileText;
      default: return FileText;
    }
  };

  const StatusIcon = getStatusIcon(report.status);

  return (
    <div
      className={cn(
        "p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30 w-full max-w-full overflow-hidden",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {report.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {report.reportType} · {report.scope}
          </p>
        </div>
        <StatusBadge status={getStatusVariant(report.status)} size="sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Author</span>
          <span className="text-muted-foreground">{report.author}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground capitalize">{report.status}</span>
          </div>
          <span className="text-muted-foreground">{report.recipients} recipients</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Generated: {new Date(report.generatedDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function CIReportsOverview({
  stats,
  reports,
}: {
  stats: { totalReports: number; publishedReports: number; inReviewReports: number; draftReports: number };
  reports: CIReport[];
}) {

  // Prepare data for status distribution
  const statusData = useMemo(() => {
    return [
      { name: 'Published', value: stats.publishedReports, fill: 'hsl(var(--success))' },
      { name: 'In Review', value: stats.inReviewReports, fill: 'hsl(var(--warning))' },
      { name: 'Draft', value: stats.draftReports, fill: 'hsl(var(--muted))' },
    ].filter(d => d.value > 0);
  }, [stats]);


  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Reports"
          value={stats.totalReports.toString()}
          subtitle="All CI reports"
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Published"
          value={stats.publishedReports.toString()}
          subtitle="Available reports"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${stats.totalReports > 0 ? ((stats.publishedReports / stats.totalReports) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="In Review"
          value={stats.inReviewReports.toString()}
          subtitle="Pending approval"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Drafts"
          value={stats.draftReports.toString()}
          subtitle="Work in progress"
          icon={FileText}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-1 border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Report Status</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Table */}
        <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Recent Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border text-left">
                  <th className="font-medium p-3">Report Name</th>
                  <th className="font-medium p-3">Type</th>
                  <th className="font-medium p-3">Status</th>
                  <th className="font-medium p-3">Author</th>
                  <th className="font-medium p-3">Generated</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((report) => (
                  <tr key={report.id} className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50">
                    <td className="p-3 font-medium">{report.name}</td>
                    <td className="p-3 text-muted-foreground">{report.reportType}</td>
                    <td className="p-3">
                      <StatusBadge
                        status={report.status === "published" ? "online" : report.status === "in-review" ? "maintenance" : "offline"}
                        size="sm"
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">{report.author}</td>
                    <td className="p-3 text-muted-foreground">{new Date(report.generatedDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigurationTab({ report }: { report: CIReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
        <div className="space-y-4">
          <InfoRow label="Report Name" value={report.name} />
          <InfoRow label="Report Type" value={report.reportType} />
          <InfoRow label="Data Sources" value="CI Projects, Impact Tracking, RCA" />
          <InfoRow label="Formatting Options" value="PDF, Excel, PowerPoint" />
        </div>
      </div>
    </div>
  );
}

function ContentTab({ report }: { report: CIReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Report Content</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Sections</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Executive Summary</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Project Status Overview</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Impact Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm">Recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewTab({ report }: { report: CIReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Review Status</h3>
        <div className="space-y-4">
          <InfoRow label="Review Status" value={report.status === "published" ? "Approved" : report.status === "in-review" ? "Under Review" : "Not Started"} />
          <InfoRow label="Reviewer" value="CI Manager" />
          <InfoRow label="Feedback" value={report.status === "published" ? "Approved for distribution" : "Pending review"} />
          <InfoRow label="Approval Workflow" value="Manager → Director → Publish" />
        </div>
      </div>
    </div>
  );
}

function DistributionTab({ report }: { report: CIReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Distribution</h3>
        <div className="space-y-4">
          <InfoRow label="Distribution List" value={`${report.recipients} recipients`} />
          <InfoRow label="Delivery Methods" value="Email, SharePoint, Dashboard" />
          <InfoRow label="Schedule" value="Monthly, 1st of month" />
          <InfoRow label="Communication Tracking" value="Read receipts enabled" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}