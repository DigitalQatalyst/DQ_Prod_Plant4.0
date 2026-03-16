import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, History, LifeBuoy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";

/**
 * PlatformHelpChangeLogPage
 * Static help documentation and platform changelog.
 * 
 * Requirements: Task 7.5 Refactor
 */
export function PlatformHelpChangeLogPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<{ id: string; type: "help" | "changelog" }>({
        id: "getting-started",
        type: "help",
    });

    const helpSections = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: LifeBuoy,
            content: [
                {
                    title: "Platform Overview",
                    description:
                        "Plant4.0 is an integrated IoT platform for industrial asset management, providing comprehensive tools for asset discovery, monitoring, and optimization across energy, security, and automation features.",
                },
                {
                    title: "Navigation",
                    description:
                        "Use the left sidebar to navigate between feature areas. The Overview section provides a consolidated view of platform health, alerts, and work items. Each feature area (Assets, Security, Energy, etc.) contains specialized tools grouped into feature sets.",
                },
                {
                    title: "Dashboard Customization",
                    description:
                        "Create custom dashboards by selecting widgets and arranging them to match your workflow. Access the Dashboards page from the Command Center feature set to get started.",
                },
            ],
        },
        {
            id: "features",
            title: "Feature Overview",
            icon: BookOpen,
            content: [
                {
                    title: "Overview & Command Center",
                    description:
                        "Monitor platform health, active alerts, work items, and advisor recommendations from a centralized location. The Command Center aggregates KPIs and provides quick access to critical platform insights.",
                },
                {
                    title: "Asset Management",
                    description:
                        "Discover, catalog, and manage IoT/IoE assets across your organization. Features include bulk discovery, manual asset capture, portfolio management, and detailed asset views with connectivity mapping.",
                },
                {
                    title: "Security (Cybersecurity)",
                    description:
                        "Comprehensive OT/IoT security features including posture monitoring, identity & access management, threat detection, compliance tracking, and platform protection capabilities.",
                },
                {
                    title: "Energy Management (EMS)",
                    description:
                        "Energy monitoring, analytics, sustainability tracking, and control advisory features. Monitor real-time consumption, track efficiency KPIs, and manage carbon emission calculations.",
                },
                {
                    title: "Automation (Process Automation)",
                    description:
                        "Integrate, monitor, and automate industrial processes with tag mapping, control models, event triggers, workflows, and governance features for safe automation deployment.",
                },
            ],
        },
        {
            id: "support",
            title: "Support & Resources",
            icon: Info,
            content: [
                {
                    title: "Technical Support",
                    description:
                        "For technical issues, contact support@plant40.com or use the in-app support chat (coming soon). Response times: Critical issues within 2 hours, standard issues within 24 hours.",
                },
                {
                    title: "Documentation",
                    description:
                        "Comprehensive API documentation and user guides are available at docs.plant40.com. Each feature page includes contextual help tooltips for quick reference.",
                },
                {
                    title: "Training Resources",
                    description:
                        "Access video tutorials, webinars, and training materials at training.plant40.com. New user onboarding guides are available for each feature area.",
                },
            ],
        },
    ];

    const changelog = [
        {
            version: "2.4.0",
            date: "2026-02-06",
            type: "feature",
            changes: [
                "Added Advisor & Help feature set to Overview area",
                "Implemented Recommended Actions page for AI-driven insights",
                "Enhanced navigation highlighting for active feature sets",
                "Improved Platform Health monitoring with data stream status",
            ],
        },
        {
            version: "2.3.0",
            date: "2026-01-30",
            type: "feature",
            changes: [
                "Added Alert Inbox and Exception Log pages to Overview",
                "Implemented Work Item routing with deep linking",
                "Enhanced Notifications Center with read/unread status",
                "Added cross-tenant portfolio management",
            ],
        },
        {
            version: "2.2.1",
            date: "2026-01-22",
            type: "fix",
            changes: [
                "Fixed tenant ID resolution in Supabase provider",
                "Resolved scrolling issues in portfolio pages",
                "Improved error handling for data fetching operations",
                "Fixed navigation highlighting edge cases",
            ],
        },
        {
            version: "2.2.0",
            date: "2026-01-15",
            type: "feature",
            changes: [
                "Implemented comprehensive asset connectivity features",
                "Added tag mapping and stream configuration",
                "Enhanced connection health monitoring",
                "Introduced sandbox streams for testing",
            ],
        },
        {
            version: "2.1.0",
            date: "2026-01-08",
            type: "feature",
            changes: [
                "Power Transmission sector profile fully implemented",
                "Asset compliance tracking with type-specific records",
                "Enhanced asset detail views with context tabs",
                "Improved lifecycle configuration for asset types",
            ],
        },
    ];

    const filteredHelpSections = useMemo(() => {
        if (!searchQuery.trim()) return helpSections;
        return helpSections
            .map((section) => ({
                ...section,
                content: section.content.filter(
                    (item) =>
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
                ),
            }))
            .filter((section) => section.content.length > 0);
    }, [searchQuery]);

    const filteredChangelog = useMemo(() => {
        if (!searchQuery.trim()) return changelog;
        return changelog.filter(
            (entry) =>
                entry.version.includes(searchQuery) ||
                entry.changes.some((change) =>
                    change.toLowerCase().includes(searchQuery.toLowerCase())
                )
        );
    }, [searchQuery]);

    const selectedContent = useMemo(() => {
        if (selectedItem.type === "help") {
            return helpSections.find((s) => s.id === selectedItem.id);
        } else {
            return changelog.find((c) => c.version === selectedItem.id);
        }
    }, [selectedItem]);

    const tabs = [
        {
            id: "content",
            label: selectedItem.type === "help" ? "Help Articles" : "Change Details",
            content: selectedContent ? (
                <div className="p-6 space-y-6">
                    {selectedItem.type === "help" ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                {(() => {
                                    const s = selectedContent as any;
                                    const Icon = s.icon;
                                    return <Icon className="w-8 h-8 text-primary" />;
                                })()}
                                <div>
                                    <h2 className="text-2xl font-bold">{(selectedContent as any).title}</h2>
                                    <p className="text-muted-foreground text-sm">Help & Documentation Articles</p>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {(selectedContent as any).content.map((item: any, index: number) => (
                                    <Card key={index} className="p-5 space-y-3 border-l-4 border-l-primary/30">
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed italic">
                                            {item.description}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <History className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Version {(selectedContent as any).version}</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Released on {new Date((selectedContent as any).date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        (selectedContent as any).type === "feature"
                                            ? "default"
                                            : (selectedContent as any).type === "fix"
                                                ? "secondary"
                                                : "outline"
                                    }
                                    className={cn(
                                        "text-xs px-3 py-1",
                                        (selectedContent as any).type === "feature" &&
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                        (selectedContent as any).type === "fix" &&
                                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    )}
                                >
                                    {(selectedContent as any).type}
                                </Badge>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-6 border">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    What's New
                                </h4>
                                <ul className="space-y-4">
                                    {(selectedContent as any).changes.map((change: string, index: number) => (
                                        <li key={index} className="flex gap-3 text-muted-foreground items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                                            <span className="leading-relaxed">{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <p>Select a topic or version to view details</p>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ListPane
                title="Help & Changelog"
                subtitle="Platform documentation and updates"
                actions={
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search help or versions..."
                            className="pl-8 h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            >
                <div className="space-y-6 mt-4">
                    {/* Help Topics Section */}
                    <div>
                        <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
                            Help Topics
                        </div>
                        <div className="space-y-1 mt-2">
                            {filteredHelpSections.map((section) => {
                                const Icon = section.icon;
                                const isSelected = selectedItem.type === "help" && selectedItem.id === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setSelectedItem({ id: section.id, type: "help" })}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                            isSelected
                                                ? "bg-primary/5 border-primary/30 shadow-sm"
                                                : "hover:bg-secondary/50 border-transparent"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/70")} />
                                        <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                                            {section.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Changelog Section */}
                    <div>
                        <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
                            Version History
                        </div>
                        <div className="space-y-1 mt-2">
                            {filteredChangelog.map((entry) => {
                                const isSelected = selectedItem.type === "changelog" && selectedItem.id === entry.version;
                                return (
                                    <button
                                        key={entry.version}
                                        onClick={() => setSelectedItem({ id: entry.version, type: "changelog" })}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 border",
                                            isSelected
                                                ? "bg-primary/5 border-primary/30 shadow-sm"
                                                : "hover:bg-secondary/50 border-transparent"
                                        )}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                                                Version {entry.version}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                                                {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 uppercase font-bold tracking-tight">
                                            {entry.type}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </ListPane>

            <WorkPane
                title={selectedItem.type === "help" ? "Help Article" : "Platform Update"}
                subtitle={
                    selectedItem.type === "help"
                        ? "Contextual documentation and guides"
                        : `Details for version ${selectedItem.id}`
                }
                tabs={tabs}
            />
        </div>
    );
}
