
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export type Transaction = {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string; // ISO
    category?: string;
};
interface RecentTransactionsListProps {
    transactions: Transaction[];
    isLoading: boolean;
    className?: string;
}
export function RecentTransactionsList({ transactions, isLoading, className }: RecentTransactionsListProps) {
    return (
        <Card className={cn("h-full flex flex-col", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8" asChild>
                        <Link href="#">View All</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                                <div className="space-y-1 flex-1">
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                                </div>
                                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                            </div>
                        ))
                    ) : transactions.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No recent transactions.
                        </div>
                    ) : (
                        transactions.slice(0, 6).map((t) => (
                            <div key={t.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full border border-opacity-50",
                                        t.type === 'income'
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                            : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                    )}>
                                        {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none truncate max-w-[150px]">{t.description}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            {format(parseISO(t.date), "MMM d")}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "font-medium text-sm tabular-nums",
                                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
