"use client";

import { useState, useEffect } from 'react';

interface ETAData {
    duration: string;
    distance: string;
    loading: boolean;
    error: string | null;
}

export function useETA(destinationAddress: string | undefined): ETAData & { refresh: () => void } {
    const [data, setData] = useState<ETAData>({
        duration: '-- min',
        distance: '-- mi',
        loading: false,
        error: null,
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(prev => prev + 1);

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
                    error: 'API Connection failed',
                });
            }
        };

        const handleLocation = (position: GeolocationPosition) => {
            fetchETA(position.coords.latitude, position.coords.longitude);
        };

        const handleError = (error: GeolocationPositionError) => {
            if (!isMounted) return;

            let errorMsg = 'GPS Error';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Location access denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location unavailable';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'GPS Timed out';
                    break;
            }

            setData({
                duration: '-- min',
                distance: '-- mi',
                loading: false,
                error: errorMsg,
            });
        };

        if ("geolocation" in navigator) {
            const isDev = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.port === '9002';

            if (window.location.protocol !== 'https:' && !isDev) {
                setData({
                    duration: '-- min',
                    distance: '-- mi',
                    loading: false,
                    error: 'HTTPS required for GPS',
                });
                return;
            }

            let watchId: number | null = null;
            let gotPosition = false;

            setData(prev => ({ ...prev, loading: true, error: null }));

            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (!gotPosition && isMounted) {
                        gotPosition = true;
                        if (watchId !== null) {
                            navigator.geolocation.clearWatch(watchId);
                        }
                        fetchETA(position.coords.latitude, position.coords.longitude);
                    }
                },
                (error) => {
                    if (watchId !== null) {
                        navigator.geolocation.clearWatch(watchId);
                    }
                    if (!gotPosition && isMounted) {
                        navigator.geolocation.getCurrentPosition(handleLocation, handleError, {
                            enableHighAccuracy: false,
                            timeout: 20000,
                            maximumAge: 120000,
                        });
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 120000,
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
    }, [destinationAddress, refreshKey]);

    return { ...data, refresh };
}
