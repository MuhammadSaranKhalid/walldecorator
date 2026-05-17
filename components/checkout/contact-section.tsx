'use client'

import { Mail, User } from 'lucide-react'
import { useFormContext, Controller } from 'react-hook-form'
import type { Country } from 'react-phone-number-input'
import type { CheckoutFormData } from '@/lib/validations/checkout'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'

type Props = {
  initialCountry: Country
}

export function ContactSection({ initialCountry }: Props) {
  const { control } = useFormContext<CheckoutFormData>()

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-[var(--obsidian-border)]">
        <h2 className="text-xl font-semibold text-[var(--obsidian-gold)]">Contact Information</h2>
        <p className="text-sm text-[var(--obsidian-text-muted)] mt-1">
          We'll use this to send you order updates
        </p>
      </div>

      <div className="space-y-4 bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] p-6">
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Email Address
              </FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  autoComplete="email"
                  spellCheck={false}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                  Full Name
                </FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="Muhammad Ahmed"
                    className="pl-10 h-11"
                    autoComplete="name"
                    spellCheck={false}
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
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                  Phone Number
                  <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                    Our courier will call before delivery
                  </span>
                </FieldLabel>
                <PhoneInput
                  id={field.name}
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  onBlur={field.onBlur}
                  defaultCountry={initialCountry}
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
    </div>
  )
}
