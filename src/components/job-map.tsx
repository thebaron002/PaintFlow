
"use client";

import { Skeleton } from "./ui/skeleton";

interface JobMapProps {
    address: string;
}

export function JobMap({ address }: JobMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return (
            <div className="text-destructive text-sm p-4 border border-destructive/50 bg-destructive/10 rounded-md">
                Google Maps API Key is missing. Cannot display map.
            </div>
        );
    }
    
    if (!address) {
        return <Skeleton className="h-48 w-full rounded-lg" />;
    }

    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;

    return (
        <div className="aspect-video w-full">
            <iframe
                className="w-full h-full rounded-lg border"
                loading="lazy"
                allowFullScreen
                src={mapSrc}>
            </iframe>
        </div>
    );
}

    