'use client'

import { Banknote } from 'lucide-react'

export function PaymentSection() {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h2 className="text-xl font-semibold">Payment</h2>
        <p className="text-sm text-gray-600 mt-1">
          All transactions are secure and encrypted
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-navy bg-brand-navy mt-0.5 shrink-0">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Banknote className="h-5 w-5 text-brand-navy" />
              <p className="font-semibold text-base">Cash on Delivery</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pay with cash when your order is delivered
            </p>

            <div className="rounded-md bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Note:</span> Please have the exact
                amount ready when the delivery person arrives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
