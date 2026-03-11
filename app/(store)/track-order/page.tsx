import type { Metadata } from 'next'
import { TrackOrderForm } from './track-order-form'

export const metadata: Metadata = {
  title: 'Track Your Order | Wall Decorator',
  description:
    'Track the status of your Wall Decorator order. Enter your order number and email address to see real-time updates.',
  robots: { index: false, follow: false },
}

export default function TrackOrderPage() {
  return <TrackOrderForm />
}
