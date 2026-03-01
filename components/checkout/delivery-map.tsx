'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, Navigation } from 'lucide-react'

type MapState = 'loading' | 'success' | 'unavailable'

type Props = {
    /** Ordered list of address strings to try geocoding, from most specific to least specific */
    addressQueryOptions?: string[]
    /** The human-readable address to display in the UI */
    addressLabel?: string
}

export function DeliveryMap({ addressQueryOptions, addressLabel }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const [mapState, setMapState] = useState<MapState>(
        addressQueryOptions && addressQueryOptions.length > 0 ? 'loading' : 'unavailable'
    )

    useEffect(() => {
        if (!addressQueryOptions || addressQueryOptions.length === 0) {
            setMapState('unavailable')
            return
        }
        if (!mapRef.current) return

        let isMounted = true

        const loadLeafletAndGeocode = async () => {
            try {
                let addressLat: number | null = null
                let addressLng: number | null = null

                // 1. Try to geocode the address using Nominatim (Client-Side)
                // We iterate through the fallback options until we get a hit
                for (const query of addressQueryOptions) {
                    try {
                        const params = new URLSearchParams({
                            q: query,
                            format: 'json',
                            limit: '1',
                        })

                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                            {
                                headers: {
                                    'User-Agent': 'WallDecorator/1.0 (walldecorator.com)',
                                    'Accept-Language': 'en-US,en;q=0.9',
                                },
                            }
                        )

                        if (!res.ok) continue
                        const data = await res.json()

                        if (Array.isArray(data) && data.length > 0) {
                            addressLat = parseFloat(data[0].lat)
                            addressLng = parseFloat(data[0].lon)
                            break // Found coordinates, stop trying fallbacks
                        }
                        // If no results, wait a tiny bit to respect rate limits before next try
                        await new Promise(r => setTimeout(r, 600))
                    } catch (e) {
                        console.warn(`Geocoding failed for query: ${query}`, e)
                    }
                }

                if (addressLat === null || addressLng === null) {
                    throw new Error('All geocoding fallbacks failed')
                }

                if (!isMounted) return

                // 2. Inject Leaflet CSS once
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link')
                    link.id = 'leaflet-css'
                    link.rel = 'stylesheet'
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
                    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
                    link.crossOrigin = ''
                    document.head.appendChild(link)

                    // Wait a tick for the stylesheet to apply before Leaflet reads dimensions
                    await new Promise((r) => setTimeout(r, 100))
                }

                // 3. Load Leaflet JS
                const L = (await import('leaflet' as any)).default ?? (await import('leaflet' as any))

                if (!isMounted) return

                // Fix broken webpack marker icon paths
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                })

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove()
                    mapInstanceRef.current = null
                }

                // 4. Initialize Map
                const map = L.map(mapRef.current!, {
                    center: [addressLat, addressLng],
                    zoom: 15,
                    zoomControl: true,
                    scrollWheelZoom: false,
                })

                mapInstanceRef.current = map

                // OpenStreetMap tiles — free, no API key
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(map)

                // Pulsing green marker
                const pulseIcon = L.divIcon({
                    className: '',
                    html: `
            <div style="position:relative;width:40px;height:40px;">
              <div style="
                position:absolute;inset:0;
                background:rgba(34,197,94,0.25);
                border-radius:50%;
                animation:pulse-ring 1.5s ease-out infinite;
              "></div>
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:20px;height:20px;
                background:#16a34a;
                border:3px solid #fff;
                border-radius:50%;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
              "></div>
            </div>
          `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                })

                L.marker([addressLat, addressLng], { icon: pulseIcon })
                    .addTo(map)
                    .bindPopup(
                        `<div style="text-align:center;padding:6px 10px;font-family:sans-serif;min-width:140px;">
              <strong style="color:#16a34a;font-size:13px;">📦 Delivery Address</strong><br/>
              ${addressLabel ? `<span style="color:#374151;font-size:12px;line-height:1.4;display:block;margin-top:2px;">${addressLabel}</span>` : ''}
              <small style="color:#6b7280;display:block;margin-top:4px;">Map view of delivery area</small>
            </div>`,
                        { offset: [0, -12] }
                    )
                    .openPopup()

                // Force Leaflet to recalculate tile layout after spinner hides
                setTimeout(() => map.invalidateSize(), 50)

                setMapState('success')
            } catch (err) {
                console.error('Failed to load map or geocode address:', err)
                if (isMounted) {
                    setMapState('unavailable')
                }
            }
        }

        loadLeafletAndGeocode()

        return () => {
            isMounted = false
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(addressQueryOptions)]) // using JSON.stringify to deep compare array prop

    return (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-100">
                <div className="rounded-full bg-green-100 p-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Delivery Location</h3>
                    <p className="text-xs text-gray-500">Map of your shipping area</p>
                </div>
            </div>

            {/* Address banner */}
            {addressLabel && mapState !== 'unavailable' && (
                <div className="bg-green-50 border-b border-green-100 px-5 py-2 flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <p className="text-xs text-green-800 font-medium truncate" title={addressLabel}>
                        {addressLabel}
                    </p>
                </div>
            )}

            {/* Map area — always rendered so Leaflet has a real DOM node to mount into */}
            <div className="relative">
                {/* Spinner overlay */}
                {mapState === 'loading' && (
                    <div className="absolute inset-0 z-10 bg-gray-50 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
                        <p className="text-sm text-gray-500">Locating address…</p>
                    </div>
                )}

                {/* Unavailable state */}
                {mapState === 'unavailable' && (
                    <div className="h-36 bg-gray-50 flex flex-col items-center justify-center gap-2 px-6 text-center">
                        <Navigation className="h-6 w-6 text-gray-300" />
                        <p className="text-sm text-gray-700 font-medium">Map preview unavailable</p>
                        <p className="text-xs text-gray-500 max-w-[250px]">
                            We couldn't automatically locate this exact address on the map, but your order was still placed successfully.
                        </p>
                    </div>
                )}

                {/* Leaflet mounts here */}
                <div
                    ref={mapRef}
                    style={{ height: mapState === 'unavailable' ? '0px' : '320px' }}
                />
            </div>

            {/* Pulse keyframe */}
            <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
        </div>
    )
}
