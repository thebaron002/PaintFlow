"use client";

import Image from "next/image";
import type { Client } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


export default function ClientsPage() {
    const isLoading = false;
    const clients: Client[] | null = [];

    if (isLoading) {
        return (
            <div>
                <PageHeader title="Clients">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Client
                    </Button>
                </PageHeader>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
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
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Clients">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients && clients.length > 0 ? clients.map((client) => (
                    <Card key={client.id}>
                        <CardHeader className="flex flex-col items-center text-center">
                            <Image
                                alt={client.name}
                                className="aspect-square rounded-full object-cover mb-4"
                                height="100"
                                src={client.avatarUrl}
                                width="100"
                                data-ai-hint="person portrait"
                            />
                            <CardTitle>{client.name}</CardTitle>
                            <CardDescription>
                                {client.name.includes("LLC") || client.name.includes("Renovators") 
                                    ? "General Contractor" 
                                    : "Homeowner"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                           <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-2">
                                <Mail className="w-4 h-4"/>
                                <span>{client.email}</span>
                           </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4"/>
                                <span>{client.phone}</span>
                           </div>
                        </CardContent>
                    </Card>
                )) : (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardContent className="flex flex-col items-center justify-center h-48">
                            <p className="text-muted-foreground">No clients found.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
