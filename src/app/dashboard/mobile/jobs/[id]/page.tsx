"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import type { Job, CrewMember, GeneralSettings, ProductionDay } from "@/app/lib/types";
import { format, parseISO, isSameDay } from "date-fns";
import { MapPin, PlusCircle, ArrowLeft, Clock, DollarSign, Calendar, CircleDot, CircleDashed, X, PaintBucket, Zap, Trash2, Plus, Receipt, Wallet, TrendingDown, TrendingUp, ShoppingBag, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { JobMap } from "@/components/job-map";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";
import { AddJobForm } from "@/app/dashboard/jobs/components/add-job-form";
import { EditJobForm } from "@/app/dashboard/jobs/components/edit-job-form";
import { useToast } from "@/hooks/use-toast";
import { FloatingNav } from "../../components/floating-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Edit, AlertCircle, MoreVertical } from "lucide-react";
import { CustomMobileCalendar } from "@/components/ui/custom-mobile-calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusColor } from "@/app/lib/status-styles";
import { IdealDaysCalculator } from "./components/ideal-days-calculator";
import { DailyProfitCalculator } from "./components/daily-profit-calculator";
import { calculateJobPayout, calculateJobProfit } from "@/app/lib/job-financials";

// Helper components for the cards
function DetailCard({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("bg-white rounded-[24px] p-5 shadow-sm mb-4", className)}>
            {title && <h3 className="text-lg font-bold text-zinc-900 mb-3">{title}</h3>}
            {children}
        </div>
    );
}

function SectionRow({ label, value, valueClass }: { label: string, value: string | number, valueClass?: string }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-[15px] font-medium text-zinc-500">{label}</span>
            <span className={cn("text-[15px] font-bold text-zinc-900", valueClass)}>{value}</span>
        </div>
    );
}

function JobStatusCard({ currentStatus, onUpdate }: { currentStatus: Job['status'], onUpdate: (s: Job['status']) => void }) {
    const statuses: Job['status'][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];
    const currentIndex = statuses.indexOf(currentStatus);

    return (
        <DetailCard className="p-6">
            <h3 className="text-xl font-extrabold text-[#00343D] mb-6">Job Status</h3>
            <div className="flex justify-between items-start relative px-1">
                {statuses.map((status, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <div
                            key={status}
                            onClick={() => onUpdate(status)}
                            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all relative z-10",
                                isCompleted && "bg-[#00343D] text-white",
                                isActive && "bg-[#00343D] text-white shadow-lg ring-4 ring-zinc-100",
                                isFuture && "bg-[#FDF9F0] text-[#00343D] border border-transparent"
                            )}>
                                {isCompleted ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold text-center leading-tight transition-colors",
                                (isCompleted || isActive) ? "text-[#00343D]" : "text-zinc-400"
                            )}>
                                {status === "Open Payment" ? "Open\nPayment" : status}
                            </span>
                        </div>
                    );
                })}
            </div>
        </DetailCard>
    );
}

export default function MobileJobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { user } = useUser();
    const firestore = useFirestore();

    // -- Data Fetching --
    const jobRef = useMemoFirebase(() => {
        if (!firestore || !user || !id) return null;
        return doc(firestore, "users", user.uid, "jobs", id);
    }, [firestore, user, id]);
    const { data: job, isLoading } = useDoc<Job>(jobRef);

    // -- Production Days State & Logic --
    const [productionDays, setProductionDays] = React.useState<ProductionDay[]>([]);
    const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
    const [isCalendarOpen, setCalendarOpen] = React.useState(false);

    // -- Settings Fetching --
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);

    // -- Adjustments State --
    const [isAdjustmentSheetOpen, setAdjustmentSheetOpen] = React.useState(false);
    const [newAdjustmentType, setNewAdjustmentType] = React.useState<'Time' | 'Material' | 'General'>('Time');
    const [newAdjustmentDescription, setNewAdjustmentDescription] = React.useState("");
    const [newAdjustmentAmount, setNewAdjustmentAmount] = React.useState("");
    const [newAdjustmentIsPayoutAddition, setNewAdjustmentIsPayoutAddition] = React.useState(true);

    // -- Invoices State --
    const [isInvoiceSheetOpen, setInvoiceSheetOpen] = React.useState(false);
    const [newInvoiceOrigin, setNewInvoiceOrigin] = React.useState("");
    const [newInvoiceAmount, setNewInvoiceAmount] = React.useState("");
    const [newInvoiceDate, setNewInvoiceDate] = React.useState(new Date());
    const [newInvoiceNotes, setNewInvoiceNotes] = React.useState("");
    const [newInvoicePaidByContractor, setNewInvoicePaidByContractor] = React.useState(false);
    const [newInvoiceIsPayoutDiscount, setNewInvoiceIsPayoutDiscount] = React.useState(false);
    const [newInvoiceIsPayoutAddition, setNewInvoiceIsPayoutAddition] = React.useState(false);

    // -- Invoice Sheet Refinement State --
    const [isCustomOrigin, setIsCustomOrigin] = React.useState(false);
    const [invoiceAmountDigits, setInvoiceAmountDigits] = React.useState("0");

    // -- Job Modal Logic --
    const [isAddJobOpen, setAddJobOpen] = React.useState(false);
    const [isJobFormValid, setIsJobFormValid] = React.useState(false);
    const { toast } = useToast();
    const jobSubmitTriggerRef = React.useRef<(() => void) | null>(null);
    const handleJobSubmit = () => { jobSubmitTriggerRef.current?.(); };

    // -- Edit Job Modal Logic --
    const [isEditJobOpen, setEditJobOpen] = React.useState(false);
    const [isEditFormValid, setIsEditFormValid] = React.useState(false);
    const editJobSubmitTriggerRef = React.useRef<(() => void) | null>(null);
    const handleEditJobSubmit = () => { editJobSubmitTriggerRef.current?.(); };

    // -- Centralized Sheet Cleanup Effect --
    // This ensures that when all sheets are closed, the body style is reset.
    // This is a robust fix for the Radix UI "pointer-events: none" freeze bug.
    // -- Aggressive Sheet Cleanup Effect (MutationObserver) --
    // Radix UI can be persistent about adding pointer-events: none. 
    // This observer actively fights it when we know no sheets should be open.
    React.useEffect(() => {
        const allClosed = !isEditJobOpen && !isAddJobOpen && !isCalendarOpen && !isAdjustmentSheetOpen && !isInvoiceSheetOpen;

        if (allClosed && typeof document !== 'undefined') {
            // 1. Immediate Cleanup
            const cleanup = () => {
                const body = document.body;
                if (body.style.pointerEvents === 'none') {
                    body.style.pointerEvents = 'auto'; // Force reset
                }
                if (body.style.overflow === 'hidden') {
                    body.style.overflow = 'auto';
                }
                if (body.hasAttribute('data-scroll-locked')) {
                    body.removeAttribute('data-scroll-locked');
                }
            };
            cleanup(); // Run once immediately

            // 2. Continuous Monitoring
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'data-scroll-locked')) {
                        // If we see the bad style come back, kill it.
                        cleanup();
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'data-scroll-locked']
            });

            return () => observer.disconnect();
        }
    }, [isEditJobOpen, isAddJobOpen, isCalendarOpen, isAdjustmentSheetOpen, isInvoiceSheetOpen]);

    const handleUpdateStatus = async (newStatus: Job['status']) => {
        if (!job || !firestore || !user) return;
        const jobRef = doc(firestore, "users", user.uid, "jobs", job.id);
        updateDocumentNonBlocking(jobRef, { status: newStatus });
        toast({ title: "Status Updated", description: `Job marked as ${newStatus}` });
    };

    const handleAddAdjustment = async () => {
        if (!job || !newAdjustmentDescription || !newAdjustmentAmount || !firestore || !user) return;

        const amount = parseFloat(newAdjustmentAmount);
        if (isNaN(amount)) return;

        const newAdjustment: Job['adjustments'][0] = {
            id: Math.random().toString(36).substr(2, 9),
            type: newAdjustmentType,
            description: newAdjustmentDescription,
            value: amount,
            isPayoutAddition: newAdjustmentIsPayoutAddition,
        };

        if (newAdjustmentType === 'Time') {
            newAdjustment.hourlyRate = settings?.hourlyRate || 0;
        }

        const updatedAdjustments = [...(job.adjustments || []), newAdjustment];

        const jobDocRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
        await updateDocumentNonBlocking(jobDocRef, { adjustments: updatedAdjustments });

        // Reset and close
        setNewAdjustmentDescription("");
        setNewAdjustmentAmount("");
        setNewAdjustmentType('Time');
        setNewAdjustmentIsPayoutAddition(true);
        setAdjustmentSheetOpen(false);
    }

    const handleDeleteAdjustment = async (adjId: string) => {
        if (!job) return;
        const updatedAdjustments = (job.adjustments || []).filter(a => a.id !== adjId);
        const jobDocRef = doc(firestore!, 'users', user!.uid, 'jobs', job.id);
        await updateDocumentNonBlocking(jobDocRef, { adjustments: updatedAdjustments });
    }

    const handleNotesBlur = async (newNotes: string) => {
        if (!job || !user) return;
        if (newNotes === job.specialRequirements) return; // No change
        const jobDocRef = doc(firestore!, 'users', user.uid, 'jobs', job.id);
        await updateDocumentNonBlocking(jobDocRef, { specialRequirements: newNotes });
    }

    const handleAddInvoice = async () => {
        if (!job || !newInvoiceOrigin || !newInvoiceAmount || !firestore || !user) return;

        const amount = parseFloat(newInvoiceAmount);
        if (isNaN(amount)) return;

        const newInvoice = {
            id: Math.random().toString(36).substr(2, 9),
            origin: newInvoiceOrigin,
            amount: amount,
            date: newInvoiceDate.toISOString(),
            notes: newInvoiceNotes,
            paidByContractor: newInvoicePaidByContractor,
            // Self-Managed defaults to true, others to false
            isPayoutDiscount: job.managementType === 'Self' ? true : newInvoiceIsPayoutDiscount,
            isPayoutAddition: newInvoiceIsPayoutAddition,
        };

        const updatedInvoices = [...(job.invoices || []), newInvoice];
        const jobDocRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
        await updateDocumentNonBlocking(jobDocRef, { invoices: updatedInvoices });

        // Reset and close
        setNewInvoiceOrigin("");
        setNewInvoiceAmount("");
        setNewInvoiceDate(new Date());
        setNewInvoiceNotes("");
        setNewInvoicePaidByContractor(false);
        setNewInvoiceIsPayoutDiscount(false);
        setNewInvoiceIsPayoutAddition(false);
        setInvoiceSheetOpen(false);
        setInvoiceAmountDigits("0");
        setIsCustomOrigin(false);
    }

    // Reverse Currency Formatting Logic
    const formatInvoiceDisplay = (digits: string) => {
        const cents = parseInt(digits || '0', 10);
        const value = cents / 100;
        return value.toFixed(2).replace('.', ',');
    };

    const handleInvoiceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const newDigits = input.replace(/\D/g, '');
        const limited = newDigits.slice(0, 10);
        setInvoiceAmountDigits(limited);

        const cents = parseInt(limited || '0', 10);
        const decimalValue = cents / 100;
        setNewInvoiceAmount(decimalValue.toString());
    };

    const handleDeleteInvoice = async (invId: string) => {
        if (!job || !firestore || !user) return;
        const updatedInvoices = (job.invoices || []).filter(inv => inv.id !== invId);
        const jobDocRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
        await updateDocumentNonBlocking(jobDocRef, { invoices: updatedInvoices });
    }

    // Auto-toggle for Sherwin-Williams
    React.useEffect(() => {
        if (newInvoiceOrigin === 'Sherwin-Williams') {
            setNewInvoicePaidByContractor(true);
            setNewInvoiceIsPayoutDiscount(false);
        }
    }, [newInvoiceOrigin]);

    React.useEffect(() => {
        if (job?.productionDays) {
            setProductionDays(job.productionDays);
            setSelectedDates(job.productionDays.filter(pd => pd && pd.date).map(pd => parseISO(pd.date)));
        } else {
            setProductionDays([]);
            setSelectedDates([]);
        }
    }, [job?.productionDays]);

    const handleProductionDaysChange = (newDays: ProductionDay[]) => {
        if (!firestore || !user || !job) return;
        setProductionDays(newDays);
        const jobDocRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
        updateDocumentNonBlocking(jobDocRef, { productionDays: newDays });
    }

    const handleDateClick = (date: Date) => {
        const existingDayIndex = productionDays.findIndex(pd => pd && pd.date && isSameDay(parseISO(pd.date), date));

        let newProductionDays = [...productionDays];

        if (existingDayIndex >= 0) {
            // Day exists
            const existingDay = productionDays[existingDayIndex];
            if (existingDay.dayType === 'full') {
                // Full -> Half
                newProductionDays[existingDayIndex] = { ...existingDay, dayType: 'half' };
            } else {
                // Half -> Remove (Deselect)
                newProductionDays.splice(existingDayIndex, 1);
            }
        } else {
            // Day does not exist -> Select as Full
            newProductionDays.push({ date: date.toISOString(), dayType: 'full' });
        }

        handleProductionDaysChange(newProductionDays);
    }

    // Kept for the list view manual toggles
    const handleDayTypeChange = (date: Date, dayType: 'full' | 'half') => {
        const newProductionDays = productionDays.map(pd => {
            if (pd && pd.date && isSameDay(parseISO(pd.date), date)) {
                return { ...pd, dayType };
            }
            return pd;
        });
        handleProductionDaysChange(newProductionDays.filter((pd): pd is ProductionDay => !!pd));
    }

    if (isLoading) {
        return <div className="p-6 bg-[#F2F1EF] min-h-screen"><Skeleton className="h-64 w-full rounded-[24px]" /></div>;
    }

    if (!job) {
        return (
            <div className="p-6 bg-[#F2F1EF] min-h-screen flex items-center justify-center">
                <p className="text-zinc-500">Job not found.</p>
            </div>
        );
    }

    const payout = calculateJobPayout(job, settings || null);
    const profit = calculateJobProfit(job, settings || null);
    const clientLastName = (job.clientName || "").split(" ").pop() || "Client";
    const jobTitle = job.title || `${clientLastName} #${job.quoteNumber || '0001'}`;

    // Get unique invoice origins from current job as suggestions (or hardcoded common ones)
    const commonOrigins = ["Sherwin-Williams", "Home Depot", "Lowe's", "Benjamin Moore"];
    const jobInvoiceOrigins = (job.invoices || []).map(i => i.origin);
    const allUniqueOrigins = Array.from(new Set([...commonOrigins, ...jobInvoiceOrigins]));

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-6 pb-32 font-sans">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                    {/* Back Button (returns to Mobile Dashboard) */}
                    <button onClick={() => router.push('/dashboard/mobile')} className="mb-2 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-zinc-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <h1 className="text-[28px] font-extrabold text-black leading-none tracking-tight break-words max-w-[280px]">
                        {jobTitle}
                    </h1>
                    {/* Status Pill */}
                    <div className={cn("self-start px-3 py-1 rounded-full", getStatusColor(job.status))}>
                        <span className="text-xs font-bold uppercase tracking-wide">
                            {job.status === "In Progress" ? "In Progress" : job.status}
                        </span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform outline-none">
                            <MoreVertical className="w-5 h-5 text-zinc-600" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 bg-white/95 backdrop-blur-md border-zinc-200/50 shadow-xl">
                        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Job Actions</DropdownMenuLabel>

                        <DropdownMenuItem
                            onClick={() => setEditJobOpen(true)}
                            className="flex items-center gap-2 p-2.5 rounded-lg focus:bg-zinc-100 cursor-pointer outline-none"
                        >
                            <Edit className="w-4 h-4 text-zinc-700" />
                            <span className="font-medium text-zinc-700">Edit Job</span>
                        </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Job Status Card */}
            <JobStatusCard currentStatus={job.status} onUpdate={handleUpdateStatus} />

            {/* 1. Basic Info Card */}
            <DetailCard>
                <div className="flex flex-col gap-4">
                    <div className="pb-3 border-b border-gray-100">
                        <p className="text-[17px] font-bold text-zinc-900">{job.clientName}</p>
                    </div>
                    <div>
                        <p className="text-[15px] font-medium text-zinc-500 mb-1">Quote: {job.quoteNumber || "N/A"}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[13px] font-bold text-zinc-400 uppercase">Start Date</span>
                            <div className="bg-[#EEE] px-3 py-1.5 rounded-lg self-start">
                                <span className="text-sm font-semibold text-zinc-900">
                                    {job.startDate ? format(new Date(job.startDate), "MMM dd, yyyy") : "-"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-[13px] font-bold text-zinc-400 uppercase">End Date</span>
                            <div className="bg-[#EEE] px-3 py-1.5 rounded-lg self-end min-h-[32px] min-w-[80px]">
                                <span className="text-sm font-semibold text-zinc-900">
                                    {(job.status === 'Complete' || job.status === 'Finalized' || job.status === 'Open Payment') && job.deadline
                                        ? format(new Date(job.deadline), "MMM dd, yyyy")
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </DetailCard>

            {/* 2. Location Card */}
            <DetailCard>
                <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-zinc-900 mt-0.5 shrink-0" />
                    <p className="text-[16px] font-bold text-zinc-900 leading-tight">
                        {job.address}
                    </p>
                </div>
                <div className="rounded-xl overflow-hidden border border-zinc-100 h-[140px] relative z-0">
                    <JobMap address={job.address} />
                    <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-sm">
                        <a
                            href={`https://maps.apple.com/?q=${encodeURIComponent(job.address)}`}
                            target="_blank"
                            className="text-[10px] font-bold text-blue-600 uppercase"
                        >
                            View larger map
                        </a>
                    </div>
                </div>
            </DetailCard>

            {/* 3. Financials Card */}
            <DetailCard>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[17px] font-bold text-zinc-900">
                            {job.managementType === 'Self' ? `Payout (${settings?.selfShare || 52}%)` :
                                job.managementType === 'Company' ? `Payout (${settings?.companyShare || 35}%)` : 'Payout'}
                        </span>
                        <div className="bg-zinc-100 px-4 py-2 rounded-2xl">
                            <span className="text-[17px] font-bold text-zinc-900">
                                $ {payout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {job.managementType === 'Self' && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[14px] font-medium text-zinc-400">
                                Contract Total
                            </span>
                            <span className="text-[14px] font-bold text-zinc-900">
                                $ {(job.contractTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[14px] font-medium text-zinc-400">
                            {job.managementType === 'Self' ? `Base Payout (${settings?.selfShare || 52}%)` :
                                job.managementType === 'Company' ? `Base Payout (${settings?.companyShare || 35}%)` : 'Initial Value'}
                        </span>
                        <span className="text-[14px] font-bold text-zinc-400">
                            $ {(job.initialValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </DetailCard>

            {/* 4. Production Card */}
            <DetailCard>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="pr-4">
                        <p className="text-[15px] font-bold text-zinc-900 leading-tight mb-3">Ideal Number<br />of Days</p>
                        <IdealDaysCalculator initialValue={job.initialValue || 0} />
                    </div>
                    <div className="pl-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <p className="text-[15px] font-bold text-zinc-900">Production Days</p>
                            <button onClick={() => setCalendarOpen(true)}>
                                <PlusCircle className="w-5 h-5 text-zinc-900 active:scale-90 transition-transform" />
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 max-h-[80px] overflow-hidden">
                            {productionDays.length > 0 ? (
                                productionDays.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map(day => (
                                    <Badge key={day.date} variant="secondary" className="flex items-center gap-1 h-5 px-1.5 text-[10px]">
                                        {day.dayType === 'half' ? <CircleDashed className="w-3 h-3 text-zinc-500" /> : <CircleDot className="w-3 h-3 text-secondary-foreground" />}
                                        {format(parseISO(day.date), "MMM dd")}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-[13px] text-zinc-400">No days logged</p>
                            )}
                        </div>
                    </div>
                </div>
            </DetailCard>

            {/* 5. Analysis Card */}
            <DetailCard title="Analysis">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[15px] font-medium text-zinc-500">Ideal Days</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Target: ${settings?.dailyPayTarget || 0}/day</p>
                        </div>
                        <IdealDaysCalculator initialValue={job.initialValue || 0} />
                    </div>

                    <div className="flex justify-between items-center">
                        <p className="text-[15px] font-medium text-zinc-500">Profit</p>
                        <span className={cn(
                            "text-[15px] font-bold",
                            profit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            $ {profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {/* Daily Profit Mock - Assuming profit / days */}
                    <div className="flex justify-between items-center py-1">
                        <span className="text-[15px] font-medium text-zinc-500">Daily Profit</span>
                        <DailyProfitCalculator job={job} />
                    </div>
                </div>
            </DetailCard>

            {/* 6. Invoices Card [NEW] */}
            <DetailCard>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-zinc-900">Invoices</h3>
                        <span className="text-[14px] font-bold text-zinc-500">
                            {(() => {
                                const totalInvoiced = (job.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
                                const denominator = (job.managementType === 'Self' && job.contractTotal) ? job.contractTotal : (job.initialValue || 0);
                                const percentage = denominator > 0 ? (totalInvoiced / denominator) * 100 : 0;
                                return `$${totalInvoiced.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${percentage.toFixed(0)}%)`;
                            })()}
                        </span>
                    </div>
                    <button onClick={() => setInvoiceSheetOpen(true)}>
                        <PlusCircle className="w-6 h-6 text-zinc-900" />
                    </button>
                </div>

                <div className="space-y-4">
                    {job.invoices && job.invoices.length > 0 ? (
                        job.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="mt-1">
                                    <Receipt className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[15px] font-medium text-zinc-900 leading-snug">{inv.origin}</p>
                                        <div className="flex gap-1">
                                            {inv.paidByContractor && <Wallet className="w-3 h-3 text-blue-500" />}
                                            {inv.isPayoutDiscount && <TrendingDown className="w-3 h-3 text-red-500" />}
                                            {inv.isPayoutAddition && <TrendingUp className="w-3 h-3 text-green-500" />}
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-400">{format(new Date(inv.date), "MMM dd, yyyy")}</p>
                                    {inv.notes && <p className="text-[11px] text-zinc-400 italic mt-0.5 line-clamp-1">{inv.notes}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[15px] font-bold text-zinc-900">
                                        $ {inv.amount.toLocaleString()}
                                    </span>
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="text-zinc-300 hover:text-red-500 active:text-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-zinc-400 text-sm italic">No invoices added.</p>
                    )}
                </div>
            </DetailCard>

            {/* 7. Adjustments Card */}
            <DetailCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-900">Adjustments</h3>
                    <button onClick={() => setAdjustmentSheetOpen(true)}>
                        <PlusCircle className="w-6 h-6 text-zinc-900" />
                    </button>
                </div>

                <div className="space-y-4">
                    {job.adjustments && job.adjustments.length > 0 ? (
                        job.adjustments.map((adj) => {
                            const displayValue = adj.type === 'Time'
                                ? (adj.value * (adj.hourlyRate || 0))
                                : adj.value;

                            return (
                                <div key={adj.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="mt-1">
                                        {adj.type === 'Time' && <Clock className="w-5 h-5 text-zinc-400" />}
                                        {adj.type === 'Material' && <PaintBucket className="w-5 h-5 text-zinc-400" />}
                                        {adj.type === 'General' && <Zap className="w-5 h-5 text-zinc-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[15px] font-medium text-zinc-900 leading-snug">{adj.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-zinc-400">{adj.type}</p>
                                            {adj.type === 'Time' && (
                                                <p className="text-[10px] text-zinc-400 px-1.5 py-0.5 bg-zinc-100 rounded-full font-medium">
                                                    {adj.value} hrs × ${adj.hourlyRate}/hr
                                                </p>
                                            )}
                                            {adj.isPayoutAddition === false && (
                                                <p className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                    Not in Payout
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "text-[15px] font-bold",
                                            adj.isPayoutAddition === false ? "text-zinc-400" : (displayValue >= 0 ? "text-green-600" : "text-red-600")
                                        )}>
                                            {adj.isPayoutAddition === false ? '' : (displayValue >= 0 ? '+' : '-')} $ {Math.abs(displayValue).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                        </span>
                                        <button onClick={() => handleDeleteAdjustment(adj.id)} className="text-zinc-300 hover:text-red-500 active:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-zinc-400 text-sm italic">No adjustments added.</p>
                    )}
                </div>
            </DetailCard>

            {/* 8. Crew Card */}
            <DetailCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-900">Crew</h3>
                    <div className="flex items-center gap-1 opacity-50">
                        <Users className="w-4 h-4" />
                    </div>
                </div>
                <div className="space-y-4">
                    {job.crew && job.crew.length > 0 ? (
                        job.crew.map(member => (
                            <div key={member.crewMemberId} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-zinc-500">{member.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-zinc-900">{member.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">{member.type}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-zinc-400 text-sm italic">No crew assigned.</p>
                    )}
                </div>
            </DetailCard>

            {/* 9. Notes Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm mt-4">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Notes</h3>
                <Textarea
                    defaultValue={job.specialRequirements}
                    placeholder="Add special requirements or notes for this job..."
                    onBlur={(e) => handleNotesBlur(e.target.value)}
                    className="bg-transparent border-0 ring-0 shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-zinc-800 leading-relaxed resize-none min-h-[100px] rounded-none placeholder:text-zinc-400"
                />
            </div>

            <FloatingNav onPrimaryClick={() => setAddJobOpen(true)} />

            {/* New Job Sheet */}
            <Sheet
                open={isAddJobOpen}
                onOpenChange={(open) => {
                    setAddJobOpen(open);
                    if (!open) {
                        document.body.style.pointerEvents = 'auto';
                        document.body.style.overflow = 'auto';
                    }
                }}
            >
                <SheetContent side="bottom" className="bg-[#F2F2F7]">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-1">
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">New Job</SheetTitle>
                        <SheetDescription className="sr-only">Create a new job record</SheetDescription>

                        <button
                            type="button"
                            onClick={handleJobSubmit}
                            disabled={!isJobFormValid}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isJobFormValid
                                ? 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
                                : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
                                }`}
                        >
                            <ChevronRight className="w-4 h-4 rotate-[-90deg] stroke-[3]" />
                        </button>
                    </SheetHeader>
                    <AddJobForm
                        onSuccess={() => {
                            setAddJobOpen(false);
                            toast({ title: "Job Created", description: "New job added successfully." });
                        }}
                        onFormStateChange={(isValid) => setIsJobFormValid(isValid)}
                        submitTriggerRef={jobSubmitTriggerRef}
                    />
                </SheetContent>
            </Sheet>



            {/* Edit Job Sheet */}
            <Sheet
                open={isEditJobOpen}
                onOpenChange={(open) => {
                    setEditJobOpen(open);
                    if (!open) {
                        // Force layout cleanup to prevent pointer-events: none freeze
                        document.body.style.pointerEvents = 'auto';
                        document.body.style.overflow = 'auto';
                    }
                }}
            >
                <SheetContent side="bottom" className="bg-[#F2F2F7] h-[95vh]">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-1">
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">Edit Job</SheetTitle>
                        <SheetDescription className="sr-only">Modify job details</SheetDescription>

                        <button
                            type="button"
                            onClick={handleEditJobSubmit}
                            disabled={!isEditFormValid}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isEditFormValid
                                ? 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
                                : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
                                }`}
                        >
                            <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                    </SheetHeader>
                    <div className="h-full overflow-y-auto pb-20">
                        <EditJobForm
                            job={job}
                            settings={settings}
                            onSuccess={() => {
                                setEditJobOpen(false);
                                toast({ title: "Job Updated", description: "Changes saved successfully." });
                            }}
                            onFormStateChange={(isValid) => setIsEditFormValid(isValid)}
                            submitTriggerRef={editJobSubmitTriggerRef}
                        />
                    </div>
                </SheetContent>
            </Sheet>



            {/* Calendar Sheet */}
            <Sheet open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[24px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="w-8"></div> {/* Spacer */}
                        <SheetTitle className="text-lg font-bold">Production Days</SheetTitle>
                        <SheetDescription className="sr-only">Select production days for this job</SheetDescription>
                        <SheetClose asChild>
                            <button className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center transition-opacity active:opacity-70">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </SheetClose>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

                        {/* Custom Calendar Implementation */}
                        <div className="bg-white rounded-xl border p-4">
                            <CustomMobileCalendar
                                productionDays={productionDays}
                                onDayClick={handleDateClick}
                            />
                        </div>

                        <div className="bg-zinc-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Selected Days ({selectedDates.length})</h4>
                            <div className="space-y-3">
                                {selectedDates.length > 0 ? (
                                    selectedDates.sort((a, b) => a.getTime() - b.getTime()).map(date => {
                                        const dayInfo = (productionDays || []).find(pd => pd && pd.date && isSameDay(parseISO(pd.date), date));
                                        return (
                                            <div key={date.toISOString()} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-2 h-2 rounded-full", dayInfo?.dayType === 'half' ? "bg-orange-400" : "bg-green-500")} />
                                                    <span className="font-semibold text-zinc-800">{format(date, "EEE, MMM dd")}</span>
                                                </div>
                                                <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                                                    <button
                                                        onClick={() => handleDayTypeChange(date, 'full')}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                                            dayInfo?.dayType !== 'half' ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                                                        )}
                                                    >
                                                        Full
                                                    </button>
                                                    <button
                                                        onClick={() => handleDayTypeChange(date, 'half')}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                                            dayInfo?.dayType === 'half' ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                                                        )}
                                                    >
                                                        Half
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8 text-zinc-400 flex flex-col items-center">
                                        <Calendar className="w-8 h-8 mb-2 opacity-50" />
                                        <p>Select dates from the calendar above</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Add Adjustment Sheet */}
            <Sheet open={isAdjustmentSheetOpen} onOpenChange={setAdjustmentSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[24px] p-0 flex flex-col max-h-[90vh]">
                    <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                        <SheetClose asChild>
                            <button className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </SheetClose>
                        <SheetTitle className="text-lg font-bold">Adjustments</SheetTitle>
                        <SheetDescription className="sr-only">Add financial adjustments to the job</SheetDescription>
                        <div className="w-8"></div>
                    </SheetHeader>

                    <div className="p-6 space-y-6">
                        {/* Type Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-zinc-900">Adjustment Type</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setNewAdjustmentType('Time')}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                                        newAdjustmentType === 'Time' ? "border-zinc-900 bg-zinc-50" : "border-gray-100 bg-white"
                                    )}
                                >
                                    <Clock className={cn("w-6 h-6", newAdjustmentType === 'Time' ? "text-zinc-900" : "text-zinc-400")} />
                                    <span className={cn("text-xs font-bold", newAdjustmentType === 'Time' ? "text-zinc-900" : "text-zinc-500")}>Time</span>
                                </button>
                                <button
                                    onClick={() => setNewAdjustmentType('Material')}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                                        newAdjustmentType === 'Material' ? "border-zinc-900 bg-zinc-50" : "border-gray-100 bg-white"
                                    )}
                                >
                                    <PaintBucket className={cn("w-6 h-6", newAdjustmentType === 'Material' ? "text-zinc-900" : "text-zinc-400")} />
                                    <span className={cn("text-xs font-bold", newAdjustmentType === 'Material' ? "text-zinc-900" : "text-zinc-500")}>Material</span>
                                </button>
                                <button
                                    onClick={() => setNewAdjustmentType('General')}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                                        newAdjustmentType === 'General' ? "border-zinc-900 bg-zinc-50" : "border-gray-100 bg-white"
                                    )}
                                >
                                    <Zap className={cn("w-6 h-6", newAdjustmentType === 'General' ? "text-zinc-900" : "text-zinc-400")} />
                                    <span className={cn("text-xs font-bold", newAdjustmentType === 'General' ? "text-zinc-900" : "text-zinc-500")}>General</span>
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-zinc-900">Description</Label>
                            <Textarea
                                placeholder="e.g., Extra hours for touch-ups"
                                className="bg-transparent border-0 border-b border-zinc-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-zinc-900 min-h-[80px] text-[16px]"
                                value={newAdjustmentDescription}
                                onChange={(e) => setNewAdjustmentDescription(e.target.value)}
                            />
                        </div>

                        {/* Amount / Hours */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <Label className="text-sm font-semibold text-zinc-900">
                                    {newAdjustmentType === 'Time' ? 'Hours' : 'Amount'}
                                </Label>
                                {newAdjustmentType === 'Time' && (
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                        Rate: ${settings?.hourlyRate || 0}/hr
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                {newAdjustmentType !== 'Time' && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                                )}
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className={cn(
                                        "bg-transparent border-0 border-b border-zinc-200 rounded-none px-0 shadow-none h-12 text-lg font-bold focus-visible:ring-0 focus-visible:border-zinc-900",
                                        newAdjustmentType !== 'Time' && "pl-4"
                                    )}
                                    value={newAdjustmentAmount}
                                    onChange={(e) => setNewAdjustmentAmount(e.target.value)}
                                />
                                {newAdjustmentType === 'Time' && (
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">hrs</span>
                                )}
                            </div>
                            {newAdjustmentType === 'Time' && newAdjustmentAmount && (() => {
                                const total = parseFloat(newAdjustmentAmount || '0') * (settings?.hourlyRate || 0);
                                return (
                                    <p className={cn(
                                        "text-xs font-bold mt-1",
                                        total >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        Total Value: {total >= 0 ? '' : '-'}${Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                );
                            })()}
                        </div>

                        {/* Payout Toggle */}
                        <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <Label className="text-[15px] font-bold text-zinc-900">Include in Payout?</Label>
                                <p className="text-[11px] text-zinc-400 font-medium">Adds this value to your earnings.</p>
                            </div>
                            <button
                                onClick={() => setNewAdjustmentIsPayoutAddition(!newAdjustmentIsPayoutAddition)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative p-1",
                                    newAdjustmentIsPayoutAddition ? "bg-[#00343D]" : "bg-zinc-200"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                    newAdjustmentIsPayoutAddition ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        {/* Submit Button */}
                        <Button
                            className="w-full h-12 rounded-xl bg-[#05363D] hover:bg-[#04282D] text-white font-bold text-[16px]"
                            onClick={handleAddAdjustment}
                        >
                            Add Adjustment
                        </Button>
                        <div className="h-4" /> {/* Spacer for safety */}
                    </div>
                </SheetContent>
            </Sheet>

            {/* -- Add Invoice Sheet -- */}
            <Sheet open={isInvoiceSheetOpen} onOpenChange={setInvoiceSheetOpen}>
                <SheetContent side="bottom" className="h-[92vh] rounded-t-[32px] bg-[#F2F1EF] p-0 border-none outline-none flex flex-col">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-6 border-b bg-white/50 backdrop-blur-md rounded-t-[32px]">
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">Add Invoice</SheetTitle>
                        <SheetDescription className="sr-only">Add a new invoice to this job</SheetDescription>

                        <button
                            type="button"
                            onClick={handleAddInvoice}
                            disabled={!newInvoiceOrigin || !newInvoiceAmount || parseFloat(newInvoiceAmount) === 0}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                (newInvoiceOrigin && newInvoiceAmount && parseFloat(newInvoiceAmount) > 0)
                                    ? 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
                                    : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
                            )}
                        >
                            <ChevronRight className="w-4 h-4 rotate-[-90deg] stroke-[3]" />
                        </button>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* iOS Grouped Fields Style */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {/* Origin Selector */}
                            <div className="px-4 py-4 border-b border-gray-50">
                                <Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Origin</Label>
                                {isCustomOrigin ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Enter new origin..."
                                            className="bg-white border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-[16px] font-medium placeholder:text-zinc-300"
                                            value={newInvoiceOrigin}
                                            onChange={(e) => setNewInvoiceOrigin(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                setIsCustomOrigin(false);
                                                setNewInvoiceOrigin("");
                                            }}
                                            className="p-1 hover:bg-zinc-100 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5 text-zinc-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <Select
                                        onValueChange={(val) => {
                                            if (val === "create_custom_opt") {
                                                setIsCustomOrigin(true);
                                                setNewInvoiceOrigin("");
                                            } else {
                                                setNewInvoiceOrigin(val);
                                            }
                                        }}
                                        value={newInvoiceOrigin && allUniqueOrigins.includes(newInvoiceOrigin) ? newInvoiceOrigin : undefined}
                                    >
                                        <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0 bg-transparent text-left shadow-none text-[16px] font-medium h-6">
                                            <SelectValue placeholder="Choose origin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUniqueOrigins.map((origin) => (
                                                <SelectItem key={origin} value={origin}>
                                                    {origin}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="create_custom_opt" className="text-blue-600 font-bold">
                                                + Create new origin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Amount Field (Reverse Input) */}
                            <div className="px-4 py-4 border-b border-gray-50">
                                <Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Amount</Label>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-900 font-bold text-[16px]">$</span>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={formatInvoiceDisplay(invoiceAmountDigits)}
                                        onChange={handleInvoiceAmountChange}
                                        placeholder="0,00"
                                        className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-bold flex-1 shadow-none bg-transparent text-[16px]"
                                    />
                                </div>
                            </div>

                            {/* Date Field (Native iOS Style) */}
                            <div className="px-4 py-4 border-b border-gray-50">
                                <Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Date</Label>
                                <input
                                    type="date"
                                    value={newInvoiceDate ? format(newInvoiceDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setNewInvoiceDate(new Date(e.target.value + "T12:00:00"));
                                        }
                                    }}
                                    className="w-full border-0 p-0 h-auto focus:outline-none focus:ring-0 bg-transparent text-[16px] font-medium"
                                />
                            </div>

                            {/* Notes Field */}
                            <div className="px-4 py-4">
                                <Label className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Notes (Optional)</Label>
                                <Textarea
                                    placeholder="e.g., Materials for exterior paint"
                                    className="bg-transparent border-none p-0 text-[16px] font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px] resize-none placeholder:text-zinc-300"
                                    value={newInvoiceNotes}
                                    onChange={(e) => setNewInvoiceNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Financial Toggles */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <Label className="text-[15px] font-bold text-zinc-900 leading-none">Paid by you?</Label>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1">Out of pocket expense</p>
                                </div>
                                <button
                                    onClick={() => setNewInvoicePaidByContractor(!newInvoicePaidByContractor)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative p-1",
                                        newInvoicePaidByContractor ? "bg-blue-500" : "bg-zinc-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                        newInvoicePaidByContractor ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            <div className="p-4 flex items-center justify-between border-b border-gray-50">
                                <div>
                                    <Label className="text-[15px] font-bold text-zinc-900 leading-none">Discount from Payout?</Label>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1">Subtract from earnings</p>
                                </div>
                                <button
                                    onClick={() => setNewInvoiceIsPayoutDiscount(!newInvoiceIsPayoutDiscount)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative p-1",
                                        newInvoiceIsPayoutDiscount ? "bg-red-500" : "bg-zinc-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                        newInvoiceIsPayoutDiscount ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <Label className="text-[15px] font-bold text-zinc-900 leading-none">Add to Payout?</Label>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1">Reimbursement</p>
                                </div>
                                <button
                                    onClick={() => setNewInvoiceIsPayoutAddition(!newInvoiceIsPayoutAddition)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative p-1",
                                        newInvoiceIsPayoutAddition ? "bg-green-500" : "bg-zinc-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                        newInvoiceIsPayoutAddition ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

        </div>
    );
}
