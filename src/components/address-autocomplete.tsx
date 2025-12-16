"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function AddressAutocomplete({ value, onChange, className }: AddressAutocompleteProps) {
    return (
        <div className={cn("address-autocomplete-container", className)}>
            <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., 123 Main St, Anytown, USA"
                className="border-0 p-0 h-auto text-[17px] font-normal placeholder:text-gray-300 focus-visible:ring-0 shadow-none bg-transparent"
            />
        </div>
    );
}
