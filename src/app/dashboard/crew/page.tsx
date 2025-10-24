
"use client";

import Image from "next/image";
import type { CrewMember } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, Phone, Users, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const CrewList = ({ members, isLoading, type }: { members: CrewMember[], isLoading: boolean, type: 'Helper' | 'Partner' }) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
                [...Array(3)].map((_, i) => (
                     <Card key={i}>
                        <CardHeader className="flex flex-col items-center text-center">
                            <Skeleton className="w-24 h-24 rounded-full mb-4" />
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent className="text-center">
                           <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-2">
                                <Mail className="w-4 h-4"/>
                                <Skeleton className="h-4 w-40" />
                           </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4"/>
                                <Skeleton className="h-4 w-32" />
                           </div>
                        </CardContent>
                    </Card>
                ))
            ) : members && members.length > 0 ? members.map((member) => (
                <Card key={member.id}>
                    <CardHeader className="flex flex-col items-center text-center">
                        <Image
                            alt={member.name}
                            className="aspect-square rounded-full object-cover mb-4"
                            height="100"
                            src={member.avatarUrl || `https://picsum.photos/seed/${member.id}/100/100`}
                            width="100"
                            data-ai-hint="person portrait"
                        />
                        <CardTitle>{member.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            {member.type === 'Helper' 
                                ? <><Users className="w-4 h-4" /> Helper - ${member.dailyRate}/day</>
                                : <><Percent className="w-4 h-4" /> Partner - {member.profitPercentage}%</>
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                       {member.email && (
                         <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-2">
                            <Mail className="w-4 h-4"/>
                            <span>{member.email}</span>
                       </div>
                       )}
                        {member.phone && (
                           <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4"/>
                            <span>{member.phone}</span>
                       </div>
                        )}
                    </CardContent>
                </Card>
            )) : (
                <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex flex-col items-center justify-center h-48">
                        <p className="text-muted-foreground">No {type.toLowerCase()}s found.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function CrewPage() {
    const firestore = useFirestore();

    const crewQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'crew');
    }, [firestore]);

    const { data: crew, isLoading } = useCollection<CrewMember>(crewQuery);

    const helpers = crew?.filter(c => c.type === 'Helper') ?? [];
    const partners = crew?.filter(c => c.type === 'Partner') ?? [];

    return (
        <div>
            <PageHeader title="Crew">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Crew Member
                </Button>
            </PageHeader>
             <Tabs defaultValue="helpers">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="helpers">Helpers</TabsTrigger>
                    <TabsTrigger value="partners">Partners</TabsTrigger>
                </TabsList>
                <TabsContent value="helpers">
                   <CrewList members={helpers} isLoading={isLoading} type="Helper" />
                </TabsContent>
                <TabsContent value="partners">
                    <CrewList members={partners} isLoading={isLoading} type="Partner" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
