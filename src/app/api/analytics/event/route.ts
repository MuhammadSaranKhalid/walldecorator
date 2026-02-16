import { geolocation, ipAddress } from '@vercel/functions';
import { NextRequest, NextResponse, userAgent } from 'next/server';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_name, page_url, metadata, referrer } = body;

        if (!event_name) {
            return NextResponse.json({ error: 'Missing event_name' }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = user.id;

        // --- Auto-create session if it doesn't exist (First Touch Attribution) ---
        // Geo & Device Info
        const geoData = geolocation(request) || {};
        let { country, city, region, latitude, longitude } = geoData;
        let ip = ipAddress(request) || request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Dev Fallback
        if (!country && process.env.NODE_ENV === 'development') {
            try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 1000);
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    country = data.country_code;
                    city = data.city;
                    region = data.region_code;
                    latitude = data.latitude;
                    longitude = data.longitude;
                    ip = data.ip || ip;
                }
            } catch { }
        }

        const userAgentData = userAgent(request);
        const device = userAgentData?.device || {};
        const browser = userAgentData?.browser || {};
        const os = userAgentData?.os || {};
        const deviceType = device.type ? (device.type.charAt(0).toUpperCase() + device.type.slice(1)) : 'Desktop';

        const { utm_source, utm_medium, utm_campaign, utm_term, utm_content } = metadata || {};

        // Upsert session (no-op if it already exists thanks to onConflict)
        await supabase
            .from('analytics_sessions')
            .upsert({
                id: sessionId,
                country: country || null,
                city: city || null,
                region: region || null,
                latitude: latitude ? String(latitude) : null,
                longitude: longitude ? String(longitude) : null,
                ip_address: ip,
                user_agent: request.headers.get('user-agent'),
                referer: referrer,
                device_type: deviceType,
                os_name: os.name || 'Unknown',
                browser_name: browser.name || 'Unknown',
                utm_source, utm_medium, utm_campaign, utm_term, utm_content
            }, { onConflict: 'id', ignoreDuplicates: true });

        // --- Event Logging ---
        const { error: eventError } = await supabase.from('analytics_events').insert({
            event_name,
            session_id: sessionId,
            page_url,
            referrer_url: referrer,
            page_title: metadata?.title,
            metadata: metadata || {}
        });

        if (eventError) {
            console.error('[Analytics] Event Insert Error:', eventError);
            return NextResponse.json({ error: eventError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('[Analytics] Internal Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
