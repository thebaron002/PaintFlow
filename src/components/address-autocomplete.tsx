
"use client";

import React from "react";
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function AddressAutocomplete({ value, onChange, className }: AddressAutocompleteProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        return (
            <div className="text-destructive text-sm p-4 border border-destructive/50 bg-destructive/10 rounded-md">
                Google Maps API Key is missing. Please add it to your .env file to enable address autocomplete.
            </div>
        );
    }
    
    const handleSelect = (place: any) => {
        onChange(place?.label || '');
    };

    return (
        <div className={cn("address-autocomplete-container", className)}>
            <GooglePlacesAutocomplete
                apiKey={apiKey}
                selectProps={{
                    value: value ? { label: value, value } : null,
                    onChange: handleSelect,
                    placeholder: "e.g., 123 Main St, Anytown, USA",
                     styles: {
                        control: (provided) => ({
                            ...provided,
                            minHeight: '40px',
                            borderColor: 'hsl(var(--input))',
                            backgroundColor: 'hsl(var(--background))',
                             boxShadow: 'none',
                             '&:hover': {
                                borderColor: 'hsl(var(--input))',
                            }
                        }),
                        input: (provided) => ({
                            ...provided,
                            color: 'hsl(var(--foreground))',
                        }),
                        singleValue: (provided) => ({
                            ...provided,
                            color: 'hsl(var(--foreground))',
                        }),
                        menu: (provided) => ({
                            ...provided,
                            backgroundColor: 'hsl(var(--background))',
                        }),
                        option: (provided, state) => ({
                            ...provided,
                            backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
                            color: 'hsl(var(--foreground))',
                        }),
                    },
                }}
            />
        </div>
    );
}
