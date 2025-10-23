import Image from "next/image";
import { subcontractors } from "@/app/lib/data";
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


export default function SubcontractorsPage() {
    return (
        <div>
            <PageHeader title="Subcontractors">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subcontractor
                </Button>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subcontractors.map((sub) => (
                    <Card key={sub.id}>
                        <CardHeader className="flex flex-col items-center text-center">
                            <Image
                                alt={sub.name}
                                className="aspect-square rounded-full object-cover mb-4"
                                height="100"
                                src={sub.avatarUrl}
                                width="100"
                                data-ai-hint="person portrait"
                            />
                            <CardTitle>{sub.name}</CardTitle>
                            <CardDescription>Painting Services</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                           <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-2">
                                <Mail className="w-4 h-4"/>
                                <span>{sub.email}</span>
                           </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4"/>
                                <span>{sub.phone}</span>
                           </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
