<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

=======

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
interface StatCardProps {
    title: string;
    value: number;
    trend?: number; // percentage (e.g. 15 for +15%, -5 for -5%)
    icon: React.ElementType;
    isLoading: boolean;
    valueColorClass?: string;
    subtext?: string;
}
<<<<<<< HEAD

export function StatCard({ title, value, trend, icon: Icon, isLoading, valueColorClass = "", subtext }: StatCardProps) {

=======
export function StatCard({ title, value, trend, icon: Icon, isLoading, valueColorClass = "", subtext }: StatCardProps) {
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
    const renderTrend = () => {
        if (trend === undefined || trend === 0) return null;
        const isPositive = trend > 0;
        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        const colorClass = isPositive ? "text-emerald-600" : "text-rose-600";
<<<<<<< HEAD

        // Contextual coloring: If it's Expenses, positive trend might be bad (Red), but let's stick to simple Up/Down semantics for now.
        // Or we can rely on the passed colorClass for the main value to imply good/bad.

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
        return (
            <div className={`flex items-center text-xs font-medium ${colorClass} ml-2`}>
                <TrendIcon className="mr-1 h-3 w-3" />
                {Math.abs(trend)}%
                <span className="text-muted-foreground ml-1">vs prev.</span>
            </div>
        )
    }
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div>
                        <div className="flex items-baseline">
                            <div className={`text-2xl font-bold ${valueColorClass}`}>
                                ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            {renderTrend()}
                        </div>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
