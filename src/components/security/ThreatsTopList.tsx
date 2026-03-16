import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TopListItem {
    id: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'destructive' | 'warning' | 'success';
}

interface ThreatsTopListProps {
    title: string;
    icon: LucideIcon;
    items: TopListItem[];
    onItemClick?: (id: string) => void;
    emptyMessage?: string;
    actionLabel?: string;
    onActionClick?: () => void;
}

export function ThreatsTopList({
    title,
    icon: Icon,
    items,
    onItemClick,
    emptyMessage = "No items to display",
    actionLabel,
    onActionClick
}: ThreatsTopListProps) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
                {actionLabel && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={onActionClick}>
                        {actionLabel}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3 mt-2">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onItemClick?.(item.id)}
                                className={`flex items-center gap-3 p-2 rounded-lg border border-transparent transition-all ${onItemClick ? "hover:border-border hover:bg-muted/30 cursor-pointer" : ""
                                    }`}
                            >
                                {item.icon && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-secondary/50`}>
                                        <item.icon className={`w-4 h-4 ${item.variant === 'destructive' ? 'text-destructive' :
                                                item.variant === 'warning' ? 'text-warning' :
                                                    item.variant === 'success' ? 'text-success' : 'text-primary'
                                            }`} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.title}</p>
                                    {item.subtitle && <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>}
                                </div>
                                {item.value !== undefined && (
                                    <div className="text-xs font-semibold tabular-nums">
                                        {item.value}
                                    </div>
                                )}
                                {onItemClick && <ChevronRight className="w-4 h-4 text-muted-foreground/30" />}
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center border border-dashed border-border rounded-lg bg-muted/5">
                            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
