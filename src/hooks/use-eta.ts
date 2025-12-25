"use client";

import { useState, useEffect } from 'react';

interface ETAData {
    duration: string;
    distance: string;
    loading: boolean;
    error: string | null;
}

export function useETA(destinationAddress: string | undefined): ETAData {
    const [data, setData] = useState<ETAData>({
        duration: '-- min',
        distance: '-- mi',
        loading: false,
        error: null,
    });

    useEffect(() => {
        if (!destinationAddress) return;

        let isMounted = true;

        const fetchETA = async (latitude: number, longitude: number) => {
            if (!isMounted) return;

            console.log('[useETA] Fetching for:', { latitude, longitude, destinationAddress });
            setData(prev => ({ ...prev, loading: true, error: null }));

            try {
                const origin = `${latitude},${longitude}`;
                const response = await fetch(`/api/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationAddress)}`);
                const result = await response.json();

                if (!isMounted) return;

                if (result.error) {
                    setData({
                        duration: '-- min',
                        distance: '-- mi',
                        loading: false,
                        error: result.error,
                    });
                } else {
                    setData({
                        duration: result.duration,
                        distance: result.distance,
                        loading: false,
                        error: null,
                    });
                }
            } catch (err) {
                if (!isMounted) return;
                setData({
                    duration: '-- min',
                    distance: '-- mi',
                    loading: false,
                    error: 'Failed to calculate ETA',
                });
            }
        };

        const handleLocation = (position: GeolocationPosition) => {
            fetchETA(position.coords.latitude, position.coords.longitude);
        };

        const handleError = (error: GeolocationPositionError) => {
            if (!isMounted) return;

            // Retrying with lower accuracy if it timed out or was unavailable
            if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                navigator.geolocation.getCurrentPosition(handleLocation, (err) => {
                    setData({
                        duration: '-- min',
                        distance: '-- mi',
                        loading: false,
                        error: 'Location unavailable',
                    });
                }, { enableHighAccuracy: false, timeout: 15000 });
                return;
            }

            let errorMsg = 'Location access denied';
            if (error.code === error.TIMEOUT) errorMsg = 'Location request timed out';
            if (error.code === error.POSITION_UNAVAILABLE) errorMsg = 'Location unavailable';

            setData({
                duration: '-- min',
                distance: '-- mi',
                loading: false,
                error: errorMsg,
            });
        };

        if ("geolocation" in navigator) {
            // Check for secure context (Safari requirement)
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.warn('[useETA] Non-secure origin detected. Geolocation might be blocked.');
                setData({
                    duration: '-- min',
                    distance: '-- mi',
                    loading: false,
                    error: 'HTTPS required for GPS',
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(handleLocation, handleError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            });
        } else {
            setData({
                duration: '-- min',
                distance: '-- mi',
                loading: false,
                error: 'Geolocation not supported',
            });
        }

        return () => {
            isMounted = false;
        };
    }, [destinationAddress]);

    return data;
}
