'use client'

import { MapPin } from 'lucide-react'
import { useFormContext, Controller } from 'react-hook-form'
import type { Country } from 'react-phone-number-input'
import type { CheckoutFormData } from '@/lib/validations/checkout'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { CountrySelect } from '@/components/ui/country-select'

export function ShippingSection() {
  const { control } = useFormContext<CheckoutFormData>()

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-[var(--obsidian-border)]">
        <h2 className="text-xl font-semibold text-[var(--obsidian-gold)]">Delivery</h2>
        <p className="text-sm text-[var(--obsidian-text-muted)] mt-1">
          Where should we deliver your order?
        </p>
      </div>

      <div className="space-y-4 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6">
        <Controller
          name="shipping.line1"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Address Line 1
              </FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="House 123, Street 456"
                  className="pl-10 h-11"
                  autoComplete="address-line1"
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="shipping.line2"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Address Line 2 <span className="text-muted-foreground font-normal">(Optional)</span>
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="Near XYZ Landmark"
                className="h-11"
                autoComplete="address-line2"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="shipping.city"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                  City
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="City"
                  className="h-11"
                  autoComplete="address-level2"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="shipping.country"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                  Country
                </FieldLabel>
                <CountrySelect
                  id={field.name}
                  value={(field.value || undefined) as Country | undefined}
                  onChange={(c) => field.onChange(c)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="shipping.postalCode"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Postal Code <span className="text-muted-foreground font-normal">(Optional)</span>
              </FieldLabel>
              <Input
                {...field}
                value={field.value || ''}
                id={field.name}
                type="text"
                placeholder="Postal / ZIP code"
                maxLength={20}
                className="h-11"
                autoComplete="postal-code"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>
    </div>
  )
}
