import Image from "next/image";
import { clients } from "@/app/lib/data";
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, Phone, Briefcase } from "lucide-react";


export default function ClientsPage() {
    return (
        <div>
            <PageHeader title="Clients">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
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
                ))}
            </div>
        </div>
    );
}
