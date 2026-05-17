import { Banknote } from 'lucide-react'

export function PaymentSection() {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-[var(--obsidian-border)]">
        <h2 className="text-xl font-semibold text-[var(--obsidian-gold)]">Payment</h2>
        <p className="text-sm text-[var(--obsidian-text-muted)] mt-1">
          Cash on Delivery — pay when your order arrives
        </p>
      </div>

      <div className="border border-[var(--obsidian-gold)]/40 bg-[var(--obsidian-gold)]/5 p-4">
        <div className="flex items-center gap-3">
          <Banknote className="h-5 w-5 text-[var(--obsidian-gold)] shrink-0" />
          <div>
            <p className="font-semibold text-sm text-[var(--obsidian-text)]">Cash on Delivery</p>
            <p className="text-xs text-[var(--obsidian-text-muted)]">
              Please have the exact amount ready when the courier arrives.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
