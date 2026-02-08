'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const useAnalytics = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sessionId, setSessionId] = useState<string | null>(null);

    // 1. Define trackEvent first so it's available for useEffect
    const trackEvent = useCallback(async (
        eventName: string,
        metadata: Record<string, any> = {},
        explicitSessionId?: string
    ) => {
        // 2. Resolve Session ID: explicit > state > localStorage > null
        const currentSessionId =
            explicitSessionId ||
            sessionId ||
            (typeof window !== 'undefined' ? localStorage.getItem('analytics_session_id') : null);

        if (!currentSessionId) {
            // Optional: you might want to wait or queue events if session isn't ready
            // But for now we just log a warning
            // console.warn('Analytics: No session ID found, skipping event', eventName);
            return;
        }

        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_name: eventName,
                    session_id: currentSessionId,
                    page_url: window.location.href,
                    referrer: document.referrer,
                    metadata: {
                        ...metadata,
                        path: pathname,
                    },
                }),
            });
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }, [sessionId, pathname]);

    // 3. Initialize Session & Track Start
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let storedSessionId = localStorage.getItem('analytics_session_id');
        let isNewSession = false;

        if (!storedSessionId) {
            storedSessionId = crypto.randomUUID();
            localStorage.setItem('analytics_session_id', storedSessionId);
            isNewSession = true;
        }

        setSessionId(storedSessionId);

        if (isNewSession) {
            // Capture UTM params from URL
            const params = new URLSearchParams(window.location.search);
            const utmParams = {
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                utm_term: params.get('utm_term'),
                utm_content: params.get('utm_content'),
            };

            const metadata = Object.fromEntries(
                Object.entries(utmParams).filter(([_, v]) => v != null)
            );

            // Track session start
            trackEvent('session_start', metadata, storedSessionId);
        }
    }, [trackEvent]);

    return { trackEvent, sessionId };
};
