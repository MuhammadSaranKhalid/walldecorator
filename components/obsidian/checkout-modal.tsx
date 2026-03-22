'use client'

import { useState } from 'react'
import { useUIStore } from '@/store/ui.store'
import { useCartStore } from '@/store/cart.store'
import { useToastStore } from '@/store/toast.store'
import { X, ArrowLeft, Check } from 'lucide-react'

export function CheckoutModal() {
  const { isCheckoutModalOpen, closeCheckoutModal, checkoutStep, setCheckoutStep, setOrderId } =
    useUIStore()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { showSuccess } = useToastStore()

  const [deliveryData, setDeliveryData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  })

  const [paymentData, setPaymentData] = useState({
    method: 'cod',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })

  const total = getTotalPrice()
  const shippingCost = total >= 5000 ? 0 : 250

  const handleNextStep = () => {
    if (checkoutStep === 'delivery') {
      // Validate delivery data
      if (!deliveryData.fullName || !deliveryData.email || !deliveryData.phone || !deliveryData.address) {
        showSuccess('Error', 'Please fill in all required fields')
        return
      }
      setCheckoutStep('payment')
    } else if (checkoutStep === 'payment') {
      setCheckoutStep('review')
    } else if (checkoutStep === 'review') {
      // Simulate order placement
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`
      setOrderId(orderId)
      setCheckoutStep('confirmation')
      clearCart()
      showSuccess('Order Placed!', `Your order #${orderId} has been confirmed`)
    }
  }

  const handleBackStep = () => {
    if (checkoutStep === 'payment') {
      setCheckoutStep('delivery')
    } else if (checkoutStep === 'review') {
      setCheckoutStep('payment')
    }
  }

  if (!isCheckoutModalOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/85 z-[300] flex items-center justify-center transition-opacity duration-300 backdrop-blur-lg"
        onClick={checkoutStep !== 'confirmation' ? closeCheckoutModal : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] w-[580px] max-w-[95vw] max-h-[90vh] overflow-y-auto pointer-events-auto obsidian-scrollbar"
          style={{
            transform: isCheckoutModalOpen ? 'translateY(0)' : 'translateY(20px)',
            transition: 'transform 0.35s',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 px-10 py-8 pb-6 border-b border-[var(--obsidian-border)] flex items-center justify-between bg-[var(--obsidian-surface)] z-[2]">
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light">
              {checkoutStep === 'confirmation' ? 'Order Confirmed' : 'Checkout'}
            </h2>
            <button
              onClick={closeCheckoutModal}
              className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] w-9 h-9 cursor-pointer text-lg flex items-center justify-center transition-all duration-200 hover:border-[var(--obsidian-text)] hover:text-[var(--obsidian-text)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {checkoutStep !== 'confirmation' && (
            <>
              {/* Step Indicator */}
              <div className="flex items-center mx-10 my-6">
                <StepDot number={1} active={checkoutStep === 'delivery'} done={['payment', 'review'].includes(checkoutStep)} />
                <StepLine done={['payment', 'review'].includes(checkoutStep)} />
                <StepDot number={2} active={checkoutStep === 'payment'} done={checkoutStep === 'review'} />
                <StepLine done={checkoutStep === 'review'} />
                <StepDot number={3} active={checkoutStep === 'review'} done={false} />
              </div>

              {/* Step Labels */}
              <div className="flex justify-between px-10 mb-2">
                <div className="text-[9px] tracking-[0.09375em] uppercase text-[var(--obsidian-text-dim)]">
                  Delivery
                </div>
                <div className="text-[9px] tracking-[0.09375em] uppercase text-[var(--obsidian-text-dim)]">
                  Payment
                </div>
                <div className="text-[9px] tracking-[0.09375em] uppercase text-[var(--obsidian-text-dim)]">
                  Review
                </div>
              </div>
            </>
          )}

          {/* Body */}
          <div className="px-10 py-8 pb-10">
            {checkoutStep === 'delivery' && (
              <DeliveryStep data={deliveryData} setData={setDeliveryData} />
            )}
            {checkoutStep === 'payment' && (
              <PaymentStep data={paymentData} setData={setPaymentData} />
            )}
            {checkoutStep === 'review' && (
              <ReviewStep deliveryData={deliveryData} paymentData={paymentData} items={items} total={total} shippingCost={shippingCost} />
            )}
            {checkoutStep === 'confirmation' && <ConfirmationStep />}
          </div>

          {/* Footer */}
          {checkoutStep !== 'confirmation' && (
            <div className="sticky bottom-0 px-10 py-6 border-t border-[var(--obsidian-border)] flex justify-between items-center bg-[var(--obsidian-surface)]">
              {checkoutStep !== 'delivery' ? (
                <button
                  onClick={handleBackStep}
                  className="bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-6 py-3 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.125em] uppercase transition-all duration-200 hover:border-[var(--obsidian-text)] hover:text-[var(--obsidian-text)]"
                >
                  <ArrowLeft className="w-3 h-3 inline mr-2" />
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNextStep}
                className="bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-9 py-3.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.15625em] uppercase font-medium transition-all duration-200 hover:bg-[var(--obsidian-gold-light)]"
              >
                {checkoutStep === 'review' ? 'Place Order' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StepDot({ number, active, done }: { number: number; active: boolean; done: boolean }) {
  return (
    <div
      className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 transition-all duration-300 ${
        done
          ? 'bg-[var(--obsidian-gold)] border-[var(--obsidian-gold)] text-[var(--obsidian-bg)]'
          : active
            ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.1)]'
            : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)]'
      }`}
    >
      {done ? <Check className="w-3 h-3" /> : number}
    </div>
  )
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div
      className={`flex-1 h-px transition-colors duration-300 ${
        done ? 'bg-[var(--obsidian-gold)]' : 'bg-[var(--obsidian-border)]'
      }`}
    />
  )
}

function DeliveryStep({ data, setData }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => setData({ ...data, fullName: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          Email *
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          Phone *
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="+92 300 1234567"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          Address *
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => setData({ ...data, address: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="Street address"
        />
      </div>
      <div>
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          City
        </label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="City"
        />
      </div>
      <div>
        <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
          Postal Code
        </label>
        <input
          type="text"
          value={data.postalCode}
          onChange={(e) => setData({ ...data, postalCode: e.target.value })}
          className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
          placeholder="54000"
        />
      </div>
    </div>
  )
}

function PaymentStep({ data, setData }: any) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => setData({ ...data, method: 'cod' })}
          className={`flex-1 px-4 py-3 border transition-all duration-200 ${
            data.method === 'cod'
              ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
              : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
          }`}
        >
          <div className="text-[10px] tracking-[0.09375em] uppercase">Cash on Delivery</div>
        </button>
        <button
          onClick={() => setData({ ...data, method: 'card' })}
          className={`flex-1 px-4 py-3 border transition-all duration-200 ${
            data.method === 'card'
              ? 'border-[var(--obsidian-gold)] text-[var(--obsidian-gold)] bg-[rgba(201,168,76,0.05)]'
              : 'border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] hover:border-[var(--obsidian-text-muted)]'
          }`}
        >
          <div className="text-[10px] tracking-[0.09375em] uppercase">Credit/Debit Card</div>
        </button>
      </div>

      {data.method === 'cod' && (
        <div className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] px-6 py-4">
          <p className="text-[13px] text-[var(--obsidian-text-muted)] leading-relaxed">
            Pay with cash upon delivery. Our courier partner will collect the payment when your order arrives.
          </p>
        </div>
      )}

      {data.method === 'card' && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={data.cardNumber}
              onChange={(e) => setData({ ...data, cardNumber: e.target.value })}
              className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              placeholder="1234 5678 9012 3456"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={data.cardName}
              onChange={(e) => setData({ ...data, cardName: e.target.value })}
              className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              placeholder="Name on card"
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              value={data.expiryDate}
              onChange={(e) => setData({ ...data, expiryDate: e.target.value })}
              className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-muted)] mb-2">
              CVV
            </label>
            <input
              type="text"
              value={data.cvv}
              onChange={(e) => setData({ ...data, cvv: e.target.value })}
              className="w-full bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 font-[family-name:var(--font-dm-sans)] text-[13px] outline-none transition-colors duration-200 focus:border-[var(--obsidian-gold)] placeholder:text-[var(--obsidian-text-dim)]"
              placeholder="123"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewStep({ deliveryData, paymentData, items, total, shippingCost }: any) {
  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div>
        <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-4">
          Order Items
        </h3>
        {items.map((item: any) => (
          <div key={item.variantId} className="flex justify-between py-2.5 border-b border-[var(--obsidian-border)] text-[13px]">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span className="text-[var(--obsidian-gold)]">Rs. {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Delivery Info */}
      <div>
        <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-4">
          Delivery Address
        </h3>
        <div className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] px-6 py-4 text-[13px] text-[var(--obsidian-text-muted)] space-y-1">
          <p>{deliveryData.fullName}</p>
          <p>{deliveryData.email}</p>
          <p>{deliveryData.phone}</p>
          <p>{deliveryData.address}</p>
          <p>
            {deliveryData.city} {deliveryData.postalCode}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="text-[9px] tracking-[0.125em] uppercase text-[var(--obsidian-text-dim)] mb-4">
          Payment Method
        </h3>
        <div className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] px-6 py-4 text-[13px] text-[var(--obsidian-text-muted)]">
          {paymentData.method === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}
        </div>
      </div>

      {/* Order Total */}
      <div className="pt-4">
        <div className="flex justify-between py-2.5 font-[family-name:var(--font-cormorant)] text-[22px]">
          <span>Total</span>
          <span className="text-[var(--obsidian-gold)]">Rs. {(total + shippingCost).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function ConfirmationStep() {
  const { orderId } = useUIStore()

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-6">✓</div>
      <h3 className="font-[family-name:var(--font-cormorant)] text-[36px] font-light mb-3">
        Order Confirmed
      </h3>
      <p className="text-[13px] text-[var(--obsidian-text-muted)] leading-relaxed mb-7">
        Thank you for your order! We'll send you a confirmation email shortly with tracking details.
      </p>
      <div className="bg-[var(--obsidian-surface2)] border border-[var(--obsidian-border)] px-6 py-4.5 inline-block mx-auto mb-8">
        <div className="text-[10px] tracking-[0.125em] text-[var(--obsidian-text-muted)] uppercase mb-1">
          Order Number
        </div>
        <div className="font-[family-name:var(--font-cormorant)] text-[24px] text-[var(--obsidian-gold)]">
          {orderId}
        </div>
      </div>
    </div>
  )
}
