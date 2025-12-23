
import { Job } from "@/app/lib/types";

export type JobStatus = Job['status'];

export const getStatusColor = (status: JobStatus | string) => {
    switch (status) {
        case "Not Started":
            // Background - usually subtle
            return "bg-zinc-100 text-zinc-600";
        case "In Progress":
            // Secondary - Yellow in Nano Banana
            return "bg-secondary text-secondary-foreground";
        case "Complete":
            // Accent - Pale Yellow in Nano Banana
            return "bg-accent text-accent-foreground";
        case "Open Payment":
            // Destructive - Red
            return "bg-destructive text-destructive-foreground";
        case "Finalized":
            // Ghost
            return "bg-transparent text-zinc-400 border border-zinc-200";
        default:
            return "bg-zinc-100 text-zinc-600";
    }
};
