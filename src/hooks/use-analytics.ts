'use client';

import { useCallback } from 'react';

const isDev = process.env.NODE_ENV === 'development';

export const useAnalytics = () => {
    // trackEvent — fires event to the server (session is auto-created by the endpoint)
    const trackEvent = useCallback(async (
        eventName: string,
        metadata: Record<string, any> = {},
    ) => {
        // Skip analytics in development to avoid slow compilation
        if (isDev) return;

        try {
            await fetch('/api/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: eventName,
                    page_url: window.location.href,
                    referrer: document.referrer,
                    metadata: {
                        ...metadata,
                        path: window.location.pathname,
                        search: window.location.search
                    },
                }),
            });
        } catch (error) {
            console.error('[Analytics] Failed to track event:', error);
        }
    }, []);

    return { trackEvent };
};

