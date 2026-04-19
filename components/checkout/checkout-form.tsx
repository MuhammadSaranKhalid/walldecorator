'use client'

import { useRef, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, FormProvider, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle, ChevronRight, ShoppingCart, Lock } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

import { checkoutSchema, type CheckoutFormData } from '@/lib/validations/checkout'
import { useCartStore } from '@/store/cart.store'
import { createOrder } from '@/actions/checkout'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'

import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

import { ContactSection } from './contact-section'
import { ShippingSection } from './shipping-section'
import { BillingSection } from './billing-section'
import { PaymentSection, type PaymentMethod } from './payment-section'
import { OrderSummary } from './order-summary'
import type { StripeCardSectionRef } from './stripe-card-section'

type CheckoutFormProps = {
  ipAddress: string
  userAgent: string
}

export function CheckoutForm({ ipAddress, userAgent }: CheckoutFormProps) {
  const router = useRouter()
  const { items, clearCart } = useCartStore()

  // Payment method state — lifted here so the submit handler can branch on it
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')

  // Ref to the StripeCardSection imperative handle
  const stripeRef = useRef<StripeCardSectionRef>(null)

  // Compute total in PKR paisa for Stripe Elements amount hint
  const amountInPaisa = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    return Math.round((subtotal + shipping) * 100)
  }, [items])

  const methods = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      shipping: {
        line1: '',
        line2: '',
        city: '',
        province: '',
        postalCode: '',
      },
      billing: undefined,
      useSameAddress: true,
      orderNotes: '',
    },
    mode: 'onBlur',
  })

  const { isSubmitting, errors } = methods.formState

  const onSubmit: SubmitHandler<CheckoutFormData> = async (data) => {
    try {
      let paymentIntentId: string | undefined

      if (paymentMethod === 'card') {
        // ── Card payment ──────────────────────────────────────────────
        if (!stripeRef.current) {
          methods.setError('root.serverError', {
            type: 'server',
            message: 'Payment form is not ready. Please wait and try again.',
          })
          return
        }

        const cartItems = items.map((i) => ({ price: i.price, quantity: i.quantity }))
        const result = await stripeRef.current.confirmPayment(cartItems)

        if (!result.success) {
          methods.setError('root.serverError', {
            type: 'server',
            message: result.error ?? 'Payment failed. Please try again.',
          })
          toast.error(result.error ?? 'Payment failed')
          return
        }

        paymentIntentId = result.paymentIntentId
      }

      // ── Create order in DB ────────────────────────────────────────
      const orderResult = await createOrder({
        email: data.email,
        name: data.name,
        phone: data.phone,
        shippingAddress: data.shipping,
        billingAddress: data.useSameAddress ? null : data.billing!,
        cartItems: items,
        orderNotes: data.orderNotes,
        ipAddress,
        userAgent,
        paymentMethod,
        paymentIntentId,
      })

      if (orderResult.success) {
        clearCart()
        toast.success('Order placed successfully!')
        router.push(`/checkout/confirmation/${orderResult.orderId}`)
      } else {
        methods.setError('root.serverError', {
          type: 'server',
          message: orderResult.error ?? 'Failed to place order',
        })
        toast.error(orderResult.error ?? 'Failed to place order')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      methods.setError('root.serverError', {
        type: 'server',
        message: 'An unexpected error occurred. Please try again.',
      })
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="w-full">
      {/* Header with Logo */}
      <div className="border-b border-[var(--obsidian-border)] bg-[var(--obsidian-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Wall Decorator"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <nav className="hidden lg:flex items-center text-sm text-[var(--obsidian-text-muted)]">
              <Link href="/" className="hover:text-[var(--obsidian-gold)] transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <Link href="/products" className="hover:text-[var(--obsidian-gold)] transition-colors">
                Shop
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-[var(--obsidian-gold)] font-medium">Checkout</span>
            </nav>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
              {/* Left Column - Form */}
              <div className="order-2 lg:order-1 px-4 py-6 lg:px-0">
                <Link
                  href="/products"
                  className="hidden lg:inline-flex items-center text-sm text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-gold)] transition-colors mb-6"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Continue shopping
                </Link>

                <div className="space-y-6">
                  <ContactSection />
                  <ShippingSection />
                  <BillingSection />

                  <PaymentSection
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    amountInPaisa={amountInPaisa}
                    stripeRef={stripeRef}
                  />

                  {/* Order Notes */}
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-[var(--obsidian-border)]">
                      <h2 className="text-xl font-semibold text-[var(--obsidian-gold)]">Order Notes</h2>
                      <p className="text-sm text-[var(--obsidian-text-muted)] mt-1">
                        Add any special instructions for your order (optional)
                      </p>
                    </div>
                    <Controller
                      name="orderNotes"
                      control={methods.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                            Special Instructions{' '}
                            <span className="text-muted-foreground font-normal">(Optional)</span>
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            placeholder="Any special delivery instructions or notes about your order..."
                            className="min-h-[100px] resize-none"
                            maxLength={500}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Server error */}
                  {errors.root?.serverError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.root.serverError.message}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[var(--obsidian-gold)] hover:bg-[var(--obsidian-gold-light)] text-[var(--obsidian-bg)] font-[family-name:var(--font-dm-sans)] tracking-[0.1em] uppercase text-[11px]"
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {paymentMethod === 'card' ? 'Processing Payment…' : 'Processing Order…'}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {paymentMethod === 'card' ? 'Pay & Complete Order' : 'Complete Order'}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-[var(--obsidian-text-muted)] pt-4">
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      <span>Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-8">
                  <OrderSummary items={items} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
