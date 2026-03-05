
"use client";

import { useRouter } from "next/navigation";
import { NewJobForm } from "../components/new-job-form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default function NewJobPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSuccess = () => {
        toast({
            title: "Job Created!",
            description: "The new job has been added to your list.",
        });
        router.push('/dashboard/jobs');
    };

    return (
        <div>
            <PageHeader title="Create New Job">
                <Button asChild variant="outline">
                    <Link href="/dashboard/jobs">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                    </Link>
                </Button>
            </PageHeader>
            <div className="max-w-2xl mx-auto">
                <NewJobForm onSuccess={handleSuccess} />
            </div>
        </div>
    );
}
