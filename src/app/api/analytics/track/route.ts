import { geolocation, ipAddress } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event_name, session_id, user_id, page_url, metadata, referrer } = body;

        // 1. Get location data from Vercel headers
        let { country, city, region, latitude, longitude } = geolocation(request);
        let ip = ipAddress(request) || request.headers.get('x-forwarded-for') || 'unknown';

        // Fallback for local development if headers are missing
        if (!country && process.env.NODE_ENV === 'development') {
            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    country = data.country_code;
                    city = data.city;
                    region = data.region_code;
                    latitude = data.latitude;
                    longitude = data.longitude;
                    ip = data.ip || ip;
                }
            } catch (e) {
                console.warn('Failed to fetch fallback location:', e);
            }
        }

        const supabase = await createSupabaseServerClient();

        // Determine user_id: prefer explicit passed ID, fallback to auth session
        let finalUserId = user_id;
        if (!finalUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            finalUserId = user?.id;
        }

        // 2. Insert into DB
        const { error } = await supabase.from('analytics_events').insert({
            event_name,
            session_id,
            user_id: finalUserId,
            page_url,
            metadata: metadata || {},
            country,
            city,
            region,
            latitude: latitude ? String(latitude) : null,
            longitude: longitude ? String(longitude) : null,
            ip_address: ip,
            user_agent: request.headers.get('user-agent'),
            referer: referrer !== undefined ? referrer : request.headers.get('referer')
        });

        if (error) {
            console.error('Analytics Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Internal Analytics Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
