"use client";

import { NanoHeader } from "./components/nano-header";
import { FloatingNav } from "./components/floating-nav";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, addDoc, deleteDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { CrewMember } from "@/app/lib/types";
import { Phone, Mail, User, Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { useToast } from "@/hooks/use-toast";

// --- Schema ---
const crewSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["Helper", "Partner"]),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    dailyRate: z.coerce.number().min(0).optional(),
});

type CrewFormValues = z.infer<typeof crewSchema>;

// --- Components ---

function NanoCrewCard({ member, onClick }: { member: CrewMember, onClick: () => void }) {
    return (
        <div onClick={onClick} className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-zinc-50 active:scale-[0.98] transition-all cursor-pointer">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="text-zinc-900 font-bold text-lg truncate pr-2">{member.name}</h3>
                    {member.type === 'Helper' && member.dailyRate && (
                        <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center whitespace-nowrap">
                            ${member.dailyRate}/day
                        </span>
                    )}
                </div>

                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-1">
                    {member.type}
                </p>

                <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                    {member.phone && (
                        <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md hover:bg-zinc-100">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                        </a>
                    )}
                    {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md hover:bg-zinc-100">
                            <Mail className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MobileCrewPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [editingMember, setEditingMember] = React.useState<CrewMember | null>(null);

    const crewQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'crew');
    }, [firestore, user]);

    const { data: crew, isLoading } = useCollection<CrewMember>(crewQuery);

    const partners = crew?.filter(m => m.type === 'Partner') || [];
    const helpers = crew?.filter(m => m.type === 'Helper') || [];

    // --- Form Handling ---
    const form = useForm<CrewFormValues>({
        resolver: zodResolver(crewSchema),
        defaultValues: {
            name: "",
            type: "Helper",
            email: "",
            phone: "",
            dailyRate: 0,
        }
    });

    // Reset form when opening/closing or switching members
    React.useEffect(() => {
        if (editingMember) {
            form.reset({
                name: editingMember.name,
                type: editingMember.type,
                email: editingMember.email || "",
                phone: editingMember.phone || "",
                dailyRate: editingMember.dailyRate || 0,
            });
        } else {
            form.reset({
                name: "",
                type: "Helper",
                email: "",
                phone: "",
                dailyRate: 0,
            });
        }
    }, [editingMember, form, isSheetOpen]);

    const onSubmit = async (data: CrewFormValues) => {
        if (!firestore || !user) return;

        try {
            const memberData = {
                ...data,
                // Clean up empty strings
                email: data.email || null,
                phone: data.phone || null,
                // Only save dailyRate for Helpers
                dailyRate: data.type === 'Helper' ? data.dailyRate : null,
            };

            if (editingMember) {
                await setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'crew', editingMember.id), memberData, { merge: true });
                toast({ title: "Updated", description: "Crew member updated." });
            } else {
                await addDoc(collection(firestore, 'users', user.uid, 'crew'), {
                    ...memberData,
                    avatarUrl: "" // Placeholder
                });
                toast({ title: "Added", description: "New crew member added." });
            }
            setIsSheetOpen(false);
            setEditingMember(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not save crew member.", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!firestore || !user || !editingMember) return;
        if (confirm("Are you sure you want to delete this member?")) {
            try {
                await deleteDoc(doc(firestore, 'users', user.uid, 'crew', editingMember.id));
                toast({ title: "Deleted", description: "Member removed." });
                setIsSheetOpen(false);
                setEditingMember(null);
            } catch (error) {
                toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
            }
        }
    };

    const router = useRouter();

    // ... (rest of imports/setup)

    const handleCardClick = (memberId: string) => {
        router.push(`/dashboard/crew/${memberId}`);
    };

    const handleAddNew = () => {
        setEditingMember(null);
        setIsSheetOpen(true);
    };

    const watchType = form.watch("type");

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans pb-32">
            <NanoHeader
                subtitle="Team Management,"
                title={"Our Techs &\nPartners"}
            />
            <Tabs defaultValue="partners" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-zinc-200/50 rounded-full h-auto">
                    <TabsTrigger value="partners" className="rounded-full py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Partners
                    </TabsTrigger>
                    <TabsTrigger value="helpers" className="rounded-full py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Helpers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="partners" className="space-y-4 pb-20 mt-0">
                    {isLoading ? (
                        [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)
                    ) : partners.length > 0 ? (
                        partners.map((member) => (
                            <NanoCrewCard key={member.id} member={member} onClick={() => handleCardClick(member.id)} />
                        ))
                    ) : (
                        <EmptyState message="No partners yet." icon={User} />
                    )}
                </TabsContent>

                <TabsContent value="helpers" className="space-y-4 pb-20 mt-0">
                    {isLoading ? (
                        [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)
                    ) : helpers.length > 0 ? (
                        helpers.map((member) => (
                            <NanoCrewCard key={member.id} member={member} onClick={() => handleCardClick(member.id)} />
                        ))
                    ) : (
                        <EmptyState message="No helpers yet." icon={User} />
                    )}
                </TabsContent>
            </Tabs>
            {/* ... Add Button & Sheet ... */}

            {/* Floating Add Button */}
            <button
                onClick={handleAddNew}
                className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Edit/Add Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[32px] p-0 overflow-hidden h-[85vh]">
                    <div className="overflow-y-auto h-full p-6 pb-10 custom-scrollbar">
                        <SheetHeader className="mb-6 text-left">
                            <SheetTitle className="text-2xl font-bold">{editingMember ? `Edit ${editingMember.name}` : "Add Crew Member"}</SheetTitle>
                            <SheetDescription>
                                {editingMember ? "Update member details." : "Add a new partner or helper to your team."}
                            </SheetDescription>
                        </SheetHeader>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input {...form.register("name")} placeholder="John Doe" className="rounded-[16px] h-12 bg-zinc-50 border-zinc-200" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        onValueChange={(val) => form.setValue("type", val as "Helper" | "Partner")}
                                        defaultValue={form.getValues("type")}
                                    >
                                        <SelectTrigger className="rounded-[16px] h-12 bg-zinc-50 border-zinc-200">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Partner">Partner (Profit Share)</SelectItem>
                                            <SelectItem value="Helper">Helper (Daily Rate)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {watchType === 'Helper' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Daily Rate ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <Input type="number" {...form.register("dailyRate")} placeholder="0.00" className="pl-9 rounded-[16px] h-12 bg-zinc-50 border-zinc-200" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <Input {...form.register("phone")} placeholder="(555) 000-0000" className="pl-9 rounded-[16px] h-12 bg-zinc-50 border-zinc-200" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <Input {...form.register("email")} placeholder="email@example.com" className="pl-9 rounded-[16px] h-12 bg-zinc-50 border-zinc-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <Button type="submit" className="w-full h-14 rounded-[20px] text-lg font-bold">
                                    {editingMember ? "Save Changes" : "Add Member"}
                                </Button>
                                {editingMember && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleDelete}
                                        className="w-full h-14 rounded-[20px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-5 h-5 mr-2" />
                                        Delete Member
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>

            <FloatingNav />
        </div>
    );
}

function EmptyState({ message, icon: Icon }: { message: string, icon: any }) {
    return (
        <div className="text-center py-10 text-zinc-400">
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>{message}</p>
        </div>
    );
}
