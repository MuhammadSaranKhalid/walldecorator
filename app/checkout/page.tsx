import { Suspense } from 'react'
import { headers } from 'next/headers'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutForm ipAddress={ipAddress} userAgent={userAgent} />
      </Suspense>
    </div>
  )
}
