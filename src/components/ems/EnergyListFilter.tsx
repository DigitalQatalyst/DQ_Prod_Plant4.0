import { Filter, ArrowUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTransmissionData } from "@/hooks/useTransmissionData";

export interface EnergyFilterState {
    status: string;
    role: string;
    substationId: string;
    feederId: string;
    type: string;
}

interface FilterOption {
    label: string;
    value: string;
}

interface EnergyListFilterProps {
    filters: EnergyFilterState;
    onFiltersChange: (filters: EnergyFilterState) => void;
    showTypeFilter?: boolean;
    showRoleFilter?: boolean;
    showSubstationFilter?: boolean;
    showFeederFilter?: boolean;
    showStatusFilter?: boolean;
    statusOptions?: FilterOption[];
    roleOptions?: FilterOption[];
    typeOptions?: FilterOption[];
}

export function EnergyListFilter({
    filters,
    onFiltersChange,
    showTypeFilter = true,
    showRoleFilter = true,
    showSubstationFilter = true,
    showFeederFilter = true,
    showStatusFilter = true,
    statusOptions,
    roleOptions,
    typeOptions
}: EnergyListFilterProps) {
    const { txSubstations, txFeeders, isTransmission } = useTransmissionData();

    const updateFilter = (key: keyof EnergyFilterState, value: string) => {
        onFiltersChange({ ...filters, [key]: value === "all" ? "" : value });
    };

    const defaultStatusOptions: FilterOption[] = isTransmission
        ? [
            { label: "Normal", value: "Normal" },
            { label: "High", value: "High" },
            { label: "Critical", value: "Critical" },
            { label: "Offline", value: "Offline" }
        ]
        : [
            { label: "Normal", value: "Normal" },
            { label: "Warning", value: "Warning" },
            { label: "Critical", value: "Critical" }
        ];

    const defaultRoleOptions: FilterOption[] = [
        { label: "Grid Incomer", value: "grid_incomer" },
        { label: "Feeder Outgoing", value: "feeder_outgoing" },
        { label: "Transformer LV", value: "transformer_lv" },
        { label: "Station Service", value: "station_service" },
        { label: "Line Monitoring", value: "line_monitoring" }
    ];

    const defaultTypeOptions: FilterOption[] = [
        { label: "Electricity", value: "electricity" },
        { label: "Gas", value: "gas" },
        { label: "Diesel", value: "diesel" },
        { label: "Steam", value: "steam" }
    ];

    const currentStatusOptions = statusOptions || defaultStatusOptions;
    const currentRoleOptions = roleOptions || defaultRoleOptions;
    const currentTypeOptions = typeOptions || defaultTypeOptions;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4 py-1">
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Sort
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {showStatusFilter && (
                    <Select
                        value={filters.status || "all"}
                        onValueChange={(val) => updateFilter("status", val)}
                    >
                        <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                            {currentStatusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {isTransmission ? (
                    <>
                        {showRoleFilter && (
                            <Select
                                value={filters.role || "all"}
                                onValueChange={(val) => updateFilter("role", val)}
                            >
                                <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                                    {currentRoleOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {showSubstationFilter && (
                            <Select
                                value={filters.substationId || "all"}
                                onValueChange={(val) => updateFilter("substationId", val)}
                            >
                                <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                                    <SelectValue placeholder="All Substations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Substations</SelectItem>
                                    {txSubstations.map((substation) => (
                                        <SelectItem key={substation.id} value={substation.id} className="text-xs">
                                            {substation.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {showFeederFilter && (
                            <Select
                                value={filters.feederId || "all"}
                                onValueChange={(val) => updateFilter("feederId", val)}
                            >
                                <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                                    <SelectValue placeholder="All Feeders" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Feeders</SelectItem>
                                    {txFeeders
                                        .filter((feeder) => !filters.substationId || feeder.substation_id === filters.substationId)
                                        .map((feeder) => (
                                            <SelectItem key={feeder.id} value={feeder.id} className="text-xs">
                                                {feeder.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                ) : (
                    <>
                        {showTypeFilter && (
                            <Select
                                value={filters.type || "all"}
                                onValueChange={(val) => updateFilter("type", val)}
                            >
                                <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border/50">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                    {currentTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
