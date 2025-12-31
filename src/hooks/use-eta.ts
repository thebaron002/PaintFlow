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
            // Allow localhost, 127.0.0.1, or dev server port 9002
            const isDev = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.port === '9002';

            if (window.location.protocol !== 'https:' && !isDev) {
                console.warn('[useETA] Non-secure origin detected. Geolocation might be blocked.');
                setData({
                    duration: '-- min',
                    distance: '-- mi',
                    loading: false,
                    error: 'HTTPS required for GPS',
                });
                return;
            }

            // Safari iOS works better with watchPosition than getCurrentPosition
            let watchId: number | null = null;
            let gotPosition = false;

            console.log('[useETA] Starting watchPosition for Safari iOS compatibility');

            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (!gotPosition && isMounted) {
                        gotPosition = true;
                        console.log('[useETA] Got position from watchPosition');
                        if (watchId !== null) {
                            navigator.geolocation.clearWatch(watchId);
                        }
                        fetchETA(position.coords.latitude, position.coords.longitude);
                    }
                },
                (error) => {
                    console.warn('[useETA] watchPosition error:', error.message);
                    if (watchId !== null) {
                        navigator.geolocation.clearWatch(watchId);
                    }
                    // Fallback to getCurrentPosition
                    if (!gotPosition && isMounted) {
                        console.log('[useETA] Falling back to getCurrentPosition');
                        navigator.geolocation.getCurrentPosition(handleLocation, handleError, {
                            enableHighAccuracy: false,
                            timeout: 30000,
                            maximumAge: 300000,
                        });
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 300000,
                }
            );

            return () => {
                isMounted = false;
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
            };
        } else {
            setData({
                duration: '-- min',
                distance: '-- mi',
                loading: false,
                error: 'Geolocation not supported',
            });
        }
    }, [destinationAddress]);

    return data;
}
