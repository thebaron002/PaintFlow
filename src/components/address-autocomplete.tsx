"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function AddressAutocomplete({ value, onChange, className }: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value || "");
    const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        if (value !== undefined && value !== inputValue) {
            setInputValue(value);
        }
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (text: string) => {
        if (!text || text.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`/api/places?input=${encodeURIComponent(text)}`);
            const data = await res.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Error fetching places:", error);
        }
    };

    // Debounce manual implementation
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue && document.activeElement === containerRef.current?.querySelector('input')) {
                fetchSuggestions(inputValue);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue]);

    const handleSelect = (description: string) => {
        setInputValue(description);
        onChange(description);
        setIsOpen(false);
        setSuggestions([]);
    };

    return (
        <div ref={containerRef} className={cn("relative address-autocomplete-container", className)}>
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    onChange(e.target.value); // Allow free typing
                }}
                onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                }}
                placeholder="e.g., 123 Main St, Anytown, USA"
                className="border-0 p-0 h-auto text-[17px] font-normal text-zinc-900 placeholder:text-gray-300 focus-visible:ring-0 shadow-none bg-transparent rounded-none"
            />

            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-zinc-100 z-[9999] overflow-hidden max-h-[200px] overflow-y-auto">
                    {suggestions.map((place) => (
                        <button
                            key={place.place_id}
                            type="button"
                            onClick={() => handleSelect(place.description)}
                            className="w-full text-left px-4 py-3 text-[15px] text-zinc-700 hover:bg-zinc-50 transition-colors flex items-start gap-3 border-b border-zinc-50 last:border-0"
                        >
                            <MapPin className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                            <span className="line-clamp-2">{place.description}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
