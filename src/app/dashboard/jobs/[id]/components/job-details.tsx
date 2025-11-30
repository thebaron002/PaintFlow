

"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from "date-fns";
import {
  DollarSign,
  Calendar,
  User,
  MapPin,
  ListChecks,
  ArrowLeft,
  CalendarDays,
  Paintbrush,
  CheckCircle,
  Pencil,
  ChevronDown,
  PlusCircle,
  Clock,
  ChevronsUpDown,
  TrendingDown,
  TrendingUp,
  Check,
  Wallet,
  Circle,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayPicker } from "@/components/ui/calendar";
import type { Job, GeneralSettings, CrewMember, ProductionDay } from "@/app/lib/types";
import { useCollection, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, } from "firebase/firestore";
import { AddInvoiceForm } from "./add-invoice-form";
import { AddAdjustmentForm } from "./add-adjustment-form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JobAnalysisCard } from "./job-analysis-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { calculateJobPayout, calculateTotalAdjustments } from "@/app/lib/job-financials";
import { JobMap } from "@/components/job-map";
import { ScrollArea } from "@/components/ui/scroll-area";

const adjustmentIcons = {
  Time: Clock,
  Material: Paintbrush,
  General: ChevronsUpDown,
};

type ModalState<T> = {
    isOpen: boolean;
    item: T | null;
}

const StatusStepper = ({ statuses, current, onStatusChange }: { statuses: Job['status'][], current: Job['status'], onStatusChange: (status: Job['status']) => void }) => {
    const currentIndex = statuses.indexOf(current);

    return (
         <div className="w-full">
            <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4 sm:gap-x-4 md:gap-x-6">
                {statuses.map((status, index) => (
                    <div key={status} className="flex flex-col items-center gap-2 w-20">
                        <Button 
                            size="icon"
                            className={cn(
                                "rounded-full h-10 w-10 transition-all duration-300",
                                index < currentIndex ? "bg-primary text-primary-foreground" :
                                index === currentIndex ? "bg-primary ring-4 ring-primary/30 text-primary-foreground" :
                                "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                            )}
                            onClick={() => onStatusChange(status)}
                        >
                            {index < currentIndex ? <Check className="h-5 w-5" /> : index + 1}
                        </Button>
                        <p className={cn(
                            "text-xs text-center font-medium leading-tight",
                            index <= currentIndex ? "text-primary" : "text-muted-foreground"
                        )}>
                            {status}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};


export function JobDetails({
  job,
  allCrew,
  settings,
  jobTitle,
}: {
  job: Job;
  allCrew: CrewMember[];
  settings: GeneralSettings | null;
  jobTitle: string;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<Job["status"]>(job.status);
  const [invoiceModal, setInvoiceModal] = useState<ModalState<Job['invoices'][0]>>({ isOpen: false, item: null });
  const [adjustmentModal, setAdjustmentModal] = useState<ModalState<Job['adjustments'][0]>>({ isOpen: false, item: null });
  const [productionDays, setProductionDays] = useState<ProductionDay[]>(job.productionDays || []);
  const [notes, setNotes] = useState(job.specialRequirements || "");
  
  const jobStatuses: Job["status"][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);
  const { data: allJobs } = useCollection<Job>(jobsQuery);
  const invoiceOrigins = [...new Set(allJobs?.flatMap(j => j.invoices?.map(i => i.origin)).filter(Boolean) ?? [])];
  
  const globalHourlyRate = settings?.hourlyRate ?? 0;

  const jobCrew = job.crew?.map(c => allCrew.find(ac => ac.id === c.crewMemberId)).filter(Boolean) as CrewMember[] | undefined;

  useEffect(() => {
    setCurrentStatus(job.status);
    setProductionDays(job.productionDays || [])
    setNotes(job.specialRequirements || "");
  }, [job.status, job.productionDays, job.specialRequirements]);
  
  const handleStatusChange = (newStatus: Job["status"]) => {
    if (!firestore || !user || newStatus === currentStatus) return;
    
    let updatedData: Partial<Job> = { status: newStatus };

    if (newStatus === 'Complete' && job.status !== 'Complete' && job.status !== 'Open Payment' && job.status !== 'Finalized') {
        updatedData.deadline = new Date().toISOString();
    }
    
    setCurrentStatus(newStatus); 

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, updatedData);
  }

  const handleInvoiceSuccess = (action: 'add' | 'edit' | 'delete') => {
    setInvoiceModal({ isOpen: false, item: null });
    toast({
        title: `Invoice ${action === 'add' ? 'Added' : action === 'edit' ? 'Updated' : 'Deleted'}`,
        description: `The invoice has been successfully ${action === 'add' ? 'added' : action === 'edit' ? 'updated' : 'deleted'}.`,
    });
  };

  const handleAdjustmentSuccess = (action: 'add' | 'edit' | 'delete') => {
    setAdjustmentModal({ isOpen: false, item: null });
    toast({
        title: `Adjustment ${action === 'add' ? 'Added' : action === 'edit' ? 'Updated' : 'Deleted'}`,
        description: `The adjustment has been successfully ${action === 'add' ? 'added' : action === 'edit' ? 'updated' : 'deleted'}.`,
    });
  };

  const handleProductionDaysChange = (newDays: ProductionDay[]) => {
    if (!firestore || !user) return;
    setProductionDays(newDays);

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, { productionDays: newDays });
  }

   const handleNotesBlur = () => {
    if (!firestore || !user || notes === job.specialRequirements) return;
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, { specialRequirements: notes });
    toast({
        title: "Notes Saved",
    });
  };

  const getEndDateDisplay = () => {
    switch(job.status) {
      case 'Not Started':
        return 'Not Started';
      case 'In Progress':
        return 'In Progress';
      case 'Complete':
      case 'Open Payment':
      case 'Finalized':
        return format(new Date(job.deadline), "MMMM dd, yyyy");
      default:
        return 'N/A';
    }
  };

  const payout = calculateJobPayout(job, settings);

  const [selectedDates, setSelectedDates] = useState<Date[]>((productionDays || []).map(pd => parseISO(pd.date)));
  const [openCalendar, setOpenCalendar] = React.useState(false);


  useEffect(() => {
    setSelectedDates((job.productionDays || []).map(pd => parseISO(pd.date)));
  }, [job.productionDays]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    const newDates = dates || [];
    setSelectedDates(newDates);
    const newProductionDays = newDates.map(date => {
        const existing = productionDays.find(pd => isSameDay(parseISO(pd.date), date));
        return existing || { date: date.toISOString(), dayType: 'full' };
    });
    handleProductionDaysChange(newProductionDays);
  }

  const handleDayTypeChange = (date: Date, dayType: 'full' | 'half') => {
      const newProductionDays = productionDays.map(pd => {
          if (isSameDay(parseISO(pd.date), date)) {
              return { ...pd, dayType };
          }
          return pd;
      });
      handleProductionDaysChange(newProductionDays);
  }

  return (
    <div className="relative pb-24">
      <PageHeader
        title={jobTitle}
        prefix={
          <Button variant="outline" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft />
            </Link>
          </Button>
        }
      >
      </PageHeader>
      
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Job Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusStepper statuses={jobStatuses} current={currentStatus} onStatusChange={handleStatusChange} />
                    </CardContent>
                </Card>

            <Card>
                <CardHeader>
                <CardTitle>Job Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p className="text-lg font-semibold">{job.clientName || "N/A"}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">
                        {format(new Date(job.startDate), "MMMM dd, yyyy")}
                    </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">
                        {getEndDateDisplay()}
                    </p>
                    </div>
                </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 mb-4">
                        <div className="bg-muted p-2 rounded-md mt-1">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <p className="font-semibold">{job.address}</p>
                        </div>
                    </div>
                    <JobMap address={job.address} />
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                <CardTitle>Financials</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Payout</p>
                    <p className="text-lg font-semibold">${payout.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Initial Value</p>
                    <p className="text-lg font-semibold">${(job.initialValue || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <Paintbrush className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Ideal Material Cost</p>
                    <p className="text-lg font-semibold">${(job.idealMaterialCost || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Fixed Pay</p>
                    <p className="text-lg font-semibold">{job.isFixedPay ? 'Yes' : 'No'}</p>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Scheduling</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-muted-foreground">Ideal Number of Days</p>
                    <p className="text-lg font-semibold">{job.idealNumberOfDays}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="w-full">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Production Days</p>
                        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <CalendarDays className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <DayPicker
                                    mode="multiple"
                                    min={0}
                                    selected={selectedDates}
                                    onSelect={handleDateSelect}
                                    defaultMonth={selectedDates[0] || new Date()}
                                />
                                <div className="p-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Selected Days</h4>
                                    <ScrollArea className="h-40">
                                    <div className="space-y-2 pr-4">
                                        {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map(date => {
                                            const dayInfo = productionDays.find(pd => isSameDay(parseISO(pd.date), date));
                                            return (
                                                <div key={date.toISOString()} className="flex items-center justify-between text-sm">
                                                    <span>{format(date, "MMM dd, yyyy")}</span>
                                                    <div className="flex items-center gap-1 rounded-full border bg-background p-0.5">
                                                        <Button 
                                                            size="sm" 
                                                            variant={dayInfo?.dayType === 'full' ? 'default' : 'ghost'} 
                                                            className="h-6 px-2 rounded-full text-xs"
                                                            onClick={() => handleDayTypeChange(date, 'full')}
                                                        >
                                                            Full
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant={dayInfo?.dayType === 'half' ? 'default' : 'ghost'} 
                                                            className="h-6 px-2 rounded-full text-xs"
                                                            onClick={() => handleDayTypeChange(date, 'half')}
                                                        >
                                                            Half
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {selectedDates.length === 0 && <p className="text-xs text-muted-foreground">No days selected.</p>}
                                    </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {productionDays.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map(day => (
                            <Badge key={day.date} variant="secondary" className="flex items-center gap-1.5">
                                {day.dayType === 'half' ? <Circle className="h-2.5 w-2.5 fill-current" /> : <Sun className="h-3 w-3" />}
                                {format(parseISO(day.date), "MMM dd")}
                            </Badge>
                        ))}
                        {productionDays.length === 0 && <p className="text-sm text-muted-foreground">No days logged</p>}
                    </div>
                    </div>
                </div>
                </CardContent>
            </Card>

            </div>

            <div className="lg:col-span-1 grid gap-6 content-start">
            <JobAnalysisCard job={job} settings={settings} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Crew</CardTitle>
                <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Assign
                </Button>
                </CardHeader>
                <CardContent>
                {jobCrew && jobCrew.length > 0 ? (
                    <div className="space-y-4">
                    {jobCrew.map(member => (
                        <div key={member.id} className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.type}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No crew assigned.</p>
                )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <Dialog open={invoiceModal.isOpen && !invoiceModal.item} onOpenChange={(isOpen) => setInvoiceModal(prev => ({ ...prev, isOpen }))}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Invoice</DialogTitle>
                        </DialogHeader>
                        <AddInvoiceForm 
                            jobId={job.id}
                            existingInvoices={job.invoices || []}
                            origins={invoiceOrigins}
                            onSuccess={() => handleInvoiceSuccess('add')} 
                        />
                    </DialogContent>
                </Dialog>
                </CardHeader>
                <CardContent>
                {(job.invoices || []).length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Origin</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {job.invoices.map((invoice) => (
                        <TableRow key={invoice.id} onClick={() => setInvoiceModal({isOpen: true, item: invoice})} className="cursor-pointer">
                            <TableCell>
                                <div className="font-medium flex items-center gap-2">
                                    {invoice.paidByContractor && <Wallet className="h-3 w-3 text-blue-500" title="Paid by contractor" />}
                                    {invoice.isPayoutDiscount && <TrendingDown className="h-3 w-3 text-destructive" title="Discounted from payout" />}
                                    {invoice.isPayoutAddition && <TrendingUp className="h-3 w-3 text-green-500" title="Added to payout" />}
                                    {invoice.origin}
                                </div>
                                {invoice.notes && <div className="text-xs text-muted-foreground">{invoice.notes}</div>}
                            </TableCell>
                            <TableCell>{format(new Date(invoice.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No invoices yet.</p>
                )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Adjustments</CardTitle>
                <Dialog open={adjustmentModal.isOpen && !adjustmentModal.item} onOpenChange={(isOpen) => setAdjustmentModal(prev => ({...prev, isOpen}))}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Adjustment</DialogTitle>
                        </DialogHeader>
                        <AddAdjustmentForm 
                            jobId={job.id}
                            settings={settings}
                            existingAdjustments={job.adjustments || []}
                            onSuccess={() => handleAdjustmentSuccess('add')} 
                        />
                    </DialogContent>
                </Dialog>
                </CardHeader>
                <CardContent>
                {(job.adjustments || []).length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {job.adjustments.map((adj) => {
                        const Icon = adjustmentIcons[adj.type];
                        const rate = adj.hourlyRate ?? globalHourlyRate;
                        const amount = adj.type === 'Time' ? adj.value * rate : adj.value;
                        const sign = amount >= 0 ? '+' : '-';
                        const color = amount >= 0 ? 'text-green-600' : 'text-red-600';

                        return (
                        <TableRow key={adj.id} onClick={() => setAdjustmentModal({isOpen: true, item: adj})} className="cursor-pointer">
                            <TableCell className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{adj.description}</div>
                                {adj.type === 'Time' && <div className="text-xs text-muted-foreground">{adj.value} hrs @ ${rate}/hr</div>}
                            </div>
                            </TableCell>
                            <TableCell className={cn("text-right font-semibold", color)}>{sign} ${Math.abs(amount).toLocaleString()}</TableCell>
                        </TableRow>
                        )})}
                    </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">No adjustments.</p>
                )}
                </CardContent>
            </Card>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Add special requirements or notes for this job..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={4}
                />
            </CardContent>
        </Card>
      </div>
      
        {/* Edit Invoice Modal */}
        <Dialog open={invoiceModal.isOpen && !!invoiceModal.item} onOpenChange={(isOpen) => setInvoiceModal({ isOpen, item: isOpen ? invoiceModal.item : null })}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Edit Invoice</DialogTitle>
                </DialogHeader>
                <AddInvoiceForm 
                    jobId={job.id}
                    existingInvoices={job.invoices || []}
                    origins={invoiceOrigins}
                    onSuccess={() => handleInvoiceSuccess(invoiceModal.item ? 'edit' : 'add')} 
                    invoiceToEdit={invoiceModal.item!}
                />
            </DialogContent>
        </Dialog>

        {/* Edit Adjustment Modal */}
         <Dialog open={adjustmentModal.isOpen && !!adjustmentModal.item} onOpenChange={(isOpen) => setAdjustmentModal({ isOpen, item: isOpen ? adjustmentModal.item : null })}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Edit Adjustment</DialogTitle>
                </DialogHeader>
                <AddAdjustmentForm 
                    jobId={job.id}
                    settings={settings}
                    existingAdjustments={job.adjustments || []}
                    onSuccess={() => handleAdjustmentSuccess(adjustmentModal.item ? 'edit' : 'add')}
                    adjustmentToEdit={adjustmentModal.item!}
                />
            </DialogContent>
        </Dialog>
        
        {/* Floating Edit Button */}
        <div className="fixed bottom-16 left-0 right-0 md:hidden bg-background/80 backdrop-blur-sm p-4 border-t">
             <Button asChild className="w-full">
                <Link href={`/dashboard/jobs/${job.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Job
                </Link>
            </Button>
        </div>
        <div className="hidden md:flex justify-center mt-8">
            <Button asChild>
                <Link href={`/dashboard/jobs/${job.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Job
                </Link>
            </Button>
        </div>
    </div>
  );
}

    


