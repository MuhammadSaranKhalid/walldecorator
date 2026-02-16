'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        trackEvent('page_view', {
            path: pathname,
            search: searchParams.toString(),
        });
    }, [pathname, searchParams, trackEvent]);

    return null;
}

export function AnalyticsProvider() {
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    );
}
