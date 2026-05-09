import { Suspense } from 'react'
import { headers, cookies } from 'next/headers'
import type { Country } from 'react-phone-number-input'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton'

export const metadata = {
  title: 'Checkout | Wall Decorator',
  description: 'Complete your order',
}

export default async function CheckoutPage() {
  // Get metadata from headers
  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  // Geo-detected country for the phone input default. Middleware refreshes
  // this cookie on every visit; if it's missing (local dev, header stripped)
  // we fall back to PK to match the rest of the app.
  const cookieStore = await cookies()
  const initialCountry =
    (cookieStore.get('obsidian-country-hint')?.value?.toUpperCase() as Country | undefined) ?? 'PK'

  return (
    <div className="min-h-screen bg-[var(--obsidian-bg)]">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutForm
          ipAddress={ipAddress}
          userAgent={userAgent}
          initialCountry={initialCountry}
        />
      </Suspense>
    </div>
  )
}
