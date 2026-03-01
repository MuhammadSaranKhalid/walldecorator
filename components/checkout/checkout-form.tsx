'use client'

import { useState } from 'react'
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

import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

import { ContactSection } from './contact-section'
import { ShippingSection } from './shipping-section'
import { BillingSection } from './billing-section'
import { PaymentSection } from './payment-section'
import { OrderSummary } from './order-summary'

type CheckoutFormProps = {
  ipAddress: string
  userAgent: string
}

export function CheckoutForm({ ipAddress, userAgent }: CheckoutFormProps) {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const onInvalid = (errors: object) => {
    console.log('Form validation errors:', errors)
  }

  const onSubmit: SubmitHandler<CheckoutFormData> = async (data) => {
    console.log('Submitting checkout form with data:', data)
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createOrder({
        email: data.email,
        name: data.name,
        phone: data.phone,
        shippingAddress: data.shipping,
        billingAddress: data.useSameAddress ? null : data.billing!,
        cartItems: items,
        orderNotes: data.orderNotes,
        ipAddress,
        userAgent,
      })

      if (result.success) {
        // Clear cart BEFORE redirect to prevent race conditions
        clearCart()

        // Show success toast
        toast.success('Order placed successfully!')

        // Redirect to confirmation page
        router.push(`/checkout/confirmation/${result.orderId}`)
      } else {
        setError(result.error || 'Failed to place order')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header with Logo */}
      <div className="border-b bg-white">
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
            {/* Breadcrumb - Hidden on mobile */}
            <nav className="hidden lg:flex items-center text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <Link href="/products" className="hover:text-gray-900 transition-colors">
                Shop
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-gray-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit, onInvalid)}>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
              {/* Left Column - Form */}
              <div className="order-2 lg:order-1 px-4 py-6 lg:px-0">
                {/* Return to cart link - Hidden on mobile */}
                <Link
                  href="/products"
                  className="hidden lg:inline-flex items-center text-sm text-brand-navy hover:text-brand-gold transition-colors mb-6"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Continue shopping
                </Link>

                <div className="space-y-6">
                  <ContactSection />
                  <ShippingSection />
                  <BillingSection />
                  <PaymentSection />

                  {/* Order Notes */}
                  <div className="space-y-4">
                    <div className="pb-2 border-b">
                      <h2 className="text-xl font-semibold">Order Notes</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Add any special instructions for your order (optional)
                      </p>
                    </div>
                    <Controller
                      name="orderNotes"
                      control={methods.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                            Special Instructions <span className="text-gray-400 font-normal">(Optional)</span>
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

                  {/* Error display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-brand-navy hover:bg-brand-navy-dark text-white"
                    disabled={isSubmitting || items.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Complete Order
                      </>
                    )}
                  </Button>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-4">
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
