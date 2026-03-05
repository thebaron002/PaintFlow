"use client";

import { NanoHeader } from "./components/nano-header";
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, where, doc, deleteDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar, Clock, AlertCircle, MoreVertical, CheckCircle, Trash } from "lucide-react";
// ... imports

// ... in MobileTicketsPage

const handleDelete = async (id: string) => {
    if (!firestore || !user) return;
    try {
        await deleteDoc(doc(firestore, 'users', user.uid, 'tickets', id));
        toast({ title: "Deleted", description: "Ticket removed permanently." });
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not delete ticket.", variant: "destructive" });
    }
}
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Assume basic Ticket Type for now
interface TicketType {
    id: string;
    title: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Closed';
    priority?: 'Low' | 'Medium' | 'High';
    createdAt: string;
    ticketId?: string; // e.g. T-1001
}

function NanoTicketCard({ ticket, onResolve, onDelete }: { ticket: TicketType, onResolve: (id: string) => void, onDelete: (id: string) => void }) {
    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Open': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-amber-100 text-amber-700';
            case 'Closed': return 'bg-zinc-100 text-zinc-500';
            default: return 'bg-zinc-100 text-zinc-500';
        }
    };

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-50 flex flex-col gap-3 relative">

            {/* Action Menu */}
            <div className="absolute top-4 right-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 -mr-1.5 rounded-full hover:bg-zinc-100 text-zinc-400">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[16px]">
                        {ticket.status !== 'Closed' && (
                            <DropdownMenuItem onClick={() => onResolve(ticket.id)} className="gap-2 p-3 cursor-pointer">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-zinc-700">Mark as Resolved</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(ticket.id)} className="gap-2 p-3 text-red-600 focus:text-red-700 cursor-pointer">
                            <Trash className="w-4 h-4" />
                            <span className="font-semibold">Delete Ticket</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex justify-between items-start pr-8">
                <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
                        #{ticket.ticketId || ticket.id.slice(0, 6)}
                    </span>
                    <h3 className="text-zinc-900 font-bold text-lg leading-tight">{ticket.title}</h3>
                </div>
            </div>
            <div className="self-start">
                <Badge variant="secondary" className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide border-0 ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                </Badge>
            </div>

            {ticket.description && (
                <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                    {ticket.description}
                </p>
            )}

            <div className="flex items-center gap-4 pt-1 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ticket.createdAt ? format(new Date(ticket.createdAt), "MMM dd") : "N/A"}</span>
                </div>
                {ticket.priority && (
                    <div className="flex items-center gap-1.5">
                        <AlertCircle className={`w-3.5 h-3.5 ${ticket.priority === 'High' ? 'text-red-500' : 'text-zinc-400'}`} />
                        <span className={ticket.priority === 'High' ? 'text-red-500' : ''}>{ticket.priority}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MobileTicketsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Placeholder query - verify collection name
    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'tickets'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: tickets, isLoading } = useCollection<TicketType>(ticketsQuery);

    const activeTickets = tickets?.filter(t => t.status !== 'Closed') || [];
    const closedTickets = tickets?.filter(t => t.status === 'Closed') || [];

    const handleResolve = async (id: string) => {
        if (!firestore || !user) return;
        try {
            await setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'tickets', id), { status: 'Closed' }, { merge: true });
            toast({ title: "Resolved", description: "Ticket moved to archive." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not resolve ticket.", variant: "destructive" });
        }
    }

    const handleDelete = async (id: string) => {
        if (!firestore || !user) return;
        try {
            await deleteDocument(doc(firestore, 'users', user.uid, 'tickets', id));
            toast({ title: "Deleted", description: "Ticket removed permanently." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not delete ticket.", variant: "destructive" });
        }
    }

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans">
            <NanoHeader
                title={`Support\nTickets`}
                subtitle="Issues & Tasks"
            />

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-zinc-200/50 rounded-full h-auto">
                    <TabsTrigger value="active" className="rounded-full py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Active
                    </TabsTrigger>
                    <TabsTrigger value="closed" className="rounded-full py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Resolved
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4 pb-20 mt-0">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[24px]" />)
                    ) : activeTickets.length > 0 ? (
                        activeTickets.map((ticket) => (
                            <NanoTicketCard key={ticket.id} ticket={ticket} onResolve={handleResolve} onDelete={handleDelete} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-400 font-medium">
                            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No active tickets.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="closed" className="space-y-4 pb-20 mt-0">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[24px]" />)
                    ) : closedTickets.length > 0 ? (
                        closedTickets.map((ticket) => (
                            <NanoTicketCard key={ticket.id} ticket={ticket} onResolve={handleResolve} onDelete={handleDelete} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-400 font-medium">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No resolved tickets.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
