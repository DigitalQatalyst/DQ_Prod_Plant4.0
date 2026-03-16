import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { StatusBadge, DataTable, TableConfigs, EmptyStates, ListItem, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Plus,
  Calendar,
  Filter,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  History,
  Link,
  Target,
} from "lucide-react";
import { SwitchingOrder, SwitchingOrderImpact, CreateSwitchingOrderRequest, UpdateSwitchingOrderRequest, SwitchingOrderFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SwitchingOrders() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const queryClient = useQueryClient();

  // Close PopPane when this component mounts (no right sidebar needed on this page)
  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("plannedStart");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use selectedAsset from AppContext for SwitchingOrder selection
  const selectedOrder = selectedAsset as unknown as SwitchingOrder | null;

  // Fetch sites for filter
  const { data: sites = [] } = useQuery({
    queryKey: ['sites', currentTenant.id],
    queryFn: () => provider.getSiteSummaryByTenant(currentTenant.id),
    enabled: !!currentTenant.id,
  });

  // Fetch switching orders data
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['switching-orders', currentTenant.id, siteFilter, statusFilter, priorityFilter, dateFromFilter, dateToFilter],
    queryFn: () => provider.listSwitchingOrders(currentTenant.id, {
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter : undefined,
      priority: (priorityFilter && priorityFilter !== "all") ? priorityFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
    enabled: !!currentTenant.id,
  });

  // Filter and sort orders based on search query
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.assignedOwner?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "plannedStart":
        return sorted.sort((a, b) => {
          if (!a.plannedStart) return 1;
          if (!b.plannedStart) return -1;
          return new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime();
        });
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [orders, searchQuery, sortBy]);

  // Status transition mutation
  const statusTransitionMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: SwitchingOrder['status'] }) => {
      const updateData: UpdateSwitchingOrderRequest = { status };

      // Set timestamps based on status
      if (status === 'in-progress') {
        updateData.actualStart = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.actualEnd = new Date().toISOString();
      }

      return provider.updateSwitchingOrder(orderId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['switching-orders'] });
      toast.success("Switching order status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusTransition = (orderId: string, newStatus: SwitchingOrder['status']) => {
    statusTransitionMutation.mutate({ orderId, status: newStatus });
  };

  const handleOrderSelect = (order: SwitchingOrder) => {
    setSelectedAsset(order as any);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetchOrders();
    toast.success("Switching order created successfully");
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetchOrders();
    toast.success("Switching order updated successfully");
  };



  // Prepare tabs for ErrorAwareWorkPane
  const workPaneTabs = selectedOrder ? [
    {
      id: "summary",
      label: "Summary",
      content: <SwitchingOrderSummary order={selectedOrder} onStatusChange={handleStatusTransition} />,
      isLoading: false,
      error: null,
    },
    {
      id: "impacts",
      label: "Impacts",
      content: <SwitchingOrderImpacts order={selectedOrder} />,
      isLoading: false,
      error: null,
    },
    {
      id: "checklist",
      label: "Checklist",
      content: <SwitchingOrderChecklist order={selectedOrder} />,
      isLoading: false,
      error: null,
    },
    {
      id: "actions",
      label: "Linked Actions",
      content: <SwitchingOrderActions order={selectedOrder} />,
      isLoading: false,
      error: null,
    },
    {
      id: "history",
      label: "History",
      content: <SwitchingOrderHistory order={selectedOrder} />,
      isLoading: false,
      error: null,
    },
  ] : [
    {
      id: "overview",
      label: "Orders Overview",
      content: <SwitchingOrdersOverview orders={filteredOrders} onCreateOrder={() => setIsCreateModalOpen(true)} />,
      isLoading: false,
      error: null,
    }
  ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ErrorAwareListPane
        title="Switching Orders"
        subtitle="Manage transmission switching operations"
        count={filteredOrders.length}
        isLoading={ordersLoading}
        error={ordersError}
        onRetry={refetchOrders}
        contentType="switching orders"
        showFilters={false}
        className="rounded-lg border bg-background shadow-sm"
        actions={
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Switching Order</DialogTitle>
              </DialogHeader>
              <CreateSwitchingOrderForm
                tenantId={currentTenant.id}
                onSuccess={handleCreateSuccess}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search orders..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Site</label>
                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    <SelectItem value="plannedStart">Planned Start (Soonest First)</SelectItem>
                    <SelectItem value="priority">Priority (High to Low)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        <div className="space-y-2">
          {filteredOrders.length === 0 ? (
            <EmptyStates.NoData
              title="No switching orders found"
              description="Create your first switching order to get started"
              action={{
                label: "Create Order",
                onClick: () => setIsCreateModalOpen(true),
                variant: "default"
              }}
            />
          ) : (
            filteredOrders.map((order) => (
              <ListItemVariants.SwitchingOrder
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => handleOrderSelect(order)}
              />
            ))
          )}
        </div>
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        key={selectedOrder ? `order-${selectedOrder.id}` : 'orders-overview'}
        title={selectedOrder ? `Order ${selectedOrder.orderNo}` : "Switching Orders"}
        subtitle={selectedOrder ? selectedOrder.description : `${filteredOrders.length} switching orders`}
        tabs={workPaneTabs}
        defaultTab={selectedOrder ? "summary" : "overview"}
        isLoading={ordersLoading}
        error={ordersError}
        onRetry={refetchOrders}
        contentType="switching order details"
        className="rounded-lg border bg-background shadow-sm"
        actions={
          selectedOrder ? (
            <div className="flex gap-2">
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Switching Order</DialogTitle>
                  </DialogHeader>
                  <EditSwitchingOrderForm
                    order={selectedOrder}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setIsEditModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function SwitchingOrdersOverview({
  orders,
  onCreateOrder,
}: {
  orders: SwitchingOrder[];
  onCreateOrder: () => void;
}) {
  const { setSelectedAsset } = useApp();

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const inProgressCount = orders.filter(o => o.status === 'in-progress').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    return { totalOrders, pendingCount, inProgressCount, completedCount };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        if (!a.plannedStart) return 1;
        if (!b.plannedStart) return -1;
        return new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime();
      })
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          subtitle="All switching orders"
          icon={ClipboardList}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={stats.pendingCount.toString()}
          subtitle="Awaiting approval"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressCount.toString()}
          subtitle="Being executed"
          icon={Play}
          variant="default"
        />
        <KPICard
          title="Completed"
          value={stats.completedCount.toString()}
          subtitle="Finished"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Recent Orders</h3>
          <Button size="sm" className="gap-2" onClick={onCreateOrder}>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'orderNo', label: 'Order No.' },
            { key: 'description', label: 'Description' },
            {
              key: 'priority',
              label: 'Priority',
              render: (priority) => (
                <StatusBadge
                  status={priority === "high" ? "offline" : priority === "medium" ? "maintenance" : "online"}
                  size="sm"
                />
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "completed" ? "online" : status === "in-progress" ? "maintenance" : "offline"}
                  size="sm"
                />
              ),
            },
            { key: 'assignedOwner', label: 'Owner' },
            { key: 'plannedStart', label: 'Planned Start', render: (date) => date ? new Date(date).toLocaleString() : '-' },
          ]}
          data={recentOrders}
          onRowClick={(order) => setSelectedAsset(order as any)}
          emptyState={
            <EmptyStates.NoData
              title="No recent orders"
              description="No switching orders found."
            />
          }
        />
      </div>
    </div>
  );
}

// Helper functions for styling
function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed': return 'default';
    case 'in-progress': return 'secondary';
    case 'approved': return 'outline';
    case 'pending': return 'secondary';
    case 'cancelled': return 'destructive';
    default: return 'default';
  }
}

function getStatusForListItem(status: string): "online" | "offline" | "maintenance" {
  switch (status) {
    case 'completed': return 'online';
    case 'in-progress': return 'maintenance';
    case 'approved': return 'online';
    case 'pending': return 'maintenance';
    case 'cancelled': return 'offline';
    default: return 'maintenance';
  }
}

// Tab content components
function SwitchingOrderSummary({
  order,
  onStatusChange
}: {
  order: SwitchingOrder;
  onStatusChange: (orderId: string, status: SwitchingOrder['status']) => void;
}) {
  const getStatusActions = (currentStatus: SwitchingOrder['status']) => {
    const actions = [];

    switch (currentStatus) {
      case 'pending':
        actions.push(
          <Button key="approve" size="sm" onClick={() => onStatusChange(order.id, 'approved')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        );
        actions.push(
          <Button key="cancel" variant="destructive" size="sm" onClick={() => onStatusChange(order.id, 'cancelled')}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        );
        break;
      case 'approved':
        actions.push(
          <Button key="start" size="sm" onClick={() => onStatusChange(order.id, 'in-progress')}>
            <Play className="h-4 w-4 mr-2" />
            Start Execution
          </Button>
        );
        break;
      case 'in-progress':
        actions.push(
          <Button key="complete" size="sm" onClick={() => onStatusChange(order.id, 'completed')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        );
        break;
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Order Details
              </CardTitle>
              <CardDescription>Basic information and current status</CardDescription>
            </div>
            <div className="flex gap-2">
              {getStatusActions(order.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Order Number</label>
              <p className="text-sm font-mono">{order.orderNo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <div className="mt-1">
                <Badge variant={getPriorityVariant(order.priority || 'medium')}>
                  {(order.priority || 'medium').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Assigned Owner</label>
              <p className="text-sm">{order.assignedOwner || "Unassigned"}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="text-sm mt-1">{order.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Planned Start</label>
              <p className="text-sm">{order.plannedStart ? new Date(order.plannedStart).toLocaleString() : "Not scheduled"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Planned End</label>
              <p className="text-sm">{order.plannedEnd ? new Date(order.plannedEnd).toLocaleString() : "Not scheduled"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Actual Start</label>
              <p className="text-sm">{order.actualStart ? new Date(order.actualStart).toLocaleString() : "Not started"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Actual End</label>
              <p className="text-sm">{order.actualEnd ? new Date(order.actualEnd).toLocaleString() : "Not completed"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SwitchingOrderImpacts({ order }: { order: SwitchingOrder }) {
  const impacts = order.impacts || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Impacted Equipment
          </CardTitle>
          <CardDescription>Grid nodes, lines, and assets affected by this switching order</CardDescription>
        </CardHeader>
        <CardContent>
          {impacts.length === 0 ? (
            <EmptyStates.NoData
              title="No impacts defined"
              description="This switching order has no defined equipment impacts"
            />
          ) : (
            <div className="space-y-4">
              {impacts.map((impact, index) => (
                <div key={impact.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Impact {index + 1}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Grid Node</label>
                      <p>{impact.node?.name || impact.nodeId || "N/A"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Grid Line</label>
                      <p>{impact.line?.name || impact.lineId || "N/A"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Asset</label>
                      <p>{impact.asset?.name || impact.assetId || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SwitchingOrderChecklist({ order }: { order: SwitchingOrder }) {
  const checklistItems = order.checklist || [
    { text: "Verify system conditions", completed: order.status !== 'pending' },
    { text: "Obtain necessary approvals", completed: ['approved', 'in-progress', 'completed'].includes(order.status) },
    { text: "Coordinate with control center", completed: order.status === 'in-progress' || order.status === 'completed' },
    { text: "Execute switching sequence", completed: order.status === 'completed' },
    { text: "Verify final system state", completed: order.status === 'completed' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Execution Checklist
          </CardTitle>
          <CardDescription>Standard procedures for switching order execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checklistItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  item.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                )}>
                  {item.completed && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span className={cn(
                  "text-sm",
                  item.completed ? "text-muted-foreground line-through" : ""
                )}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SwitchingOrderActions({ order }: { order: SwitchingOrder }) {
  const actions = order.actions || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Linked Actions
          </CardTitle>
          <CardDescription>Actions and tasks related to this switching order</CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <EmptyStates.NoData
              title="No linked actions"
              description="No actions have been linked to this switching order yet"
            />
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{action.actionRef}</span>
                      <StatusBadge status={action.status === 'completed' ? 'online' : 'maintenance'} size="sm" />
                    </div>
                    <p className="text-sm">{action.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {action.owner}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SwitchingOrderHistory({ order }: { order: SwitchingOrder }) {
  const historyEvents = order.history && order.history.length > 0 ? order.history : [
    { timestamp: order.createdAt, event: "Order created", user: "System" },
    ...(order.status === 'approved' ? [{ timestamp: order.updatedAt, event: "Order approved", user: "Supervisor" }] : []),
    ...(order.actualStart ? [{ timestamp: order.actualStart, event: "Execution started", user: order.assignedOwner || "Operator" }] : []),
    ...(order.actualEnd ? [{ timestamp: order.actualEnd, event: "Execution completed", user: order.assignedOwner || "Operator" }] : []),
  ];

  // Sort history by timestamp descending if it's from the database
  const sortedHistory = [...historyEvents].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>Timeline of events for this switching order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedHistory.map((event, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()} • {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Form components
function CreateSwitchingOrderForm({
  tenantId,
  onSuccess,
  onCancel
}: {
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orderNo: '',
    description: '',
    priority: 'medium' as const,
    plannedStart: '',
    plannedEnd: '',
    assignedOwner: '',
    impacts: [{ nodeId: '', lineId: '', assetId: '' }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateSwitchingOrderRequest = {
        orderNo: formData.orderNo,
        description: formData.description,
        priority: formData.priority,
        plannedStart: formData.plannedStart || undefined,
        plannedEnd: formData.plannedEnd || undefined,
        assignedOwner: formData.assignedOwner || undefined,
        impacts: formData.impacts.filter(impact =>
          impact.nodeId || impact.lineId || impact.assetId
        )
      };

      await provider.createSwitchingOrder(tenantId, payload);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to create switching order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImpact = () => {
    setFormData(prev => ({
      ...prev,
      impacts: [...prev.impacts, { nodeId: '', lineId: '', assetId: '' }]
    }));
  };

  const removeImpact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      impacts: prev.impacts.filter((_, i) => i !== index)
    }));
  };

  const updateImpact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      impacts: prev.impacts.map((impact, i) =>
        i === index ? { ...impact, [field]: value } : impact
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Order Number *</label>
          <Input
            value={formData.orderNo}
            onChange={(e) => setFormData(prev => ({ ...prev, orderNo: e.target.value }))}
            placeholder="SW-2024-001"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description *</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the switching operation..."
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Assigned Owner</label>
        <Input
          value={formData.assignedOwner}
          onChange={(e) => setFormData(prev => ({ ...prev, assignedOwner: e.target.value }))}
          placeholder="Operator name or ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Planned Start</label>
          <Input
            type="datetime-local"
            value={formData.plannedStart}
            onChange={(e) => setFormData(prev => ({ ...prev, plannedStart: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Planned End</label>
          <Input
            type="datetime-local"
            value={formData.plannedEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, plannedEnd: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Equipment Impacts</label>
          <Button type="button" variant="outline" size="sm" onClick={addImpact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Impact
          </Button>
        </div>
        <div className="space-y-3">
          {formData.impacts.map((impact, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Impact {index + 1}</span>
                {formData.impacts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImpact(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Grid Node ID</label>
                  <Input
                    value={impact.nodeId}
                    onChange={(e) => updateImpact(index, 'nodeId', e.target.value)}
                    placeholder="Node ID"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Grid Line ID</label>
                  <Input
                    value={impact.lineId}
                    onChange={(e) => updateImpact(index, 'lineId', e.target.value)}
                    placeholder="Line ID"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Asset ID</label>
                  <Input
                    value={impact.assetId}
                    onChange={(e) => updateImpact(index, 'assetId', e.target.value)}
                    placeholder="Asset ID"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Order'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditSwitchingOrderForm({
  order,
  onSuccess,
  onCancel
}: {
  order: SwitchingOrder;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: order.description,
    priority: order.priority,
    plannedStart: order.plannedStart ? new Date(order.plannedStart).toISOString().slice(0, 16) : '',
    plannedEnd: order.plannedEnd ? new Date(order.plannedEnd).toISOString().slice(0, 16) : '',
    assignedOwner: order.assignedOwner || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: UpdateSwitchingOrderRequest = {
        description: formData.description,
        priority: formData.priority,
        plannedStart: formData.plannedStart || undefined,
        plannedEnd: formData.plannedEnd || undefined,
        assignedOwner: formData.assignedOwner || undefined,
      };

      await provider.updateSwitchingOrder(order.id, payload);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to update switching order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Order Number</label>
          <Input value={order.orderNo} disabled className="bg-muted" />
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description *</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the switching operation..."
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Assigned Owner</label>
        <Input
          value={formData.assignedOwner}
          onChange={(e) => setFormData(prev => ({ ...prev, assignedOwner: e.target.value }))}
          placeholder="Operator name or ID"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Planned Start</label>
          <Input
            type="datetime-local"
            value={formData.plannedStart}
            onChange={(e) => setFormData(prev => ({ ...prev, plannedStart: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Planned End</label>
          <Input
            type="datetime-local"
            value={formData.plannedEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, plannedEnd: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Equipment impacts cannot be modified after creation.
          Create a new order if different equipment impacts are needed.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}