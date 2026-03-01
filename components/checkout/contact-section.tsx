'use client'

import { Mail, User, Phone } from 'lucide-react'
import { useFormContext, Controller } from 'react-hook-form'
import type { CheckoutFormData } from '@/lib/validations/checkout'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ContactSection() {
  const { control } = useFormContext<CheckoutFormData>()

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h2 className="text-xl font-semibold">Contact Information</h2>
        <p className="text-sm text-gray-600 mt-1">
          We'll use this to send you order updates
        </p>
      </div>

      <div className="space-y-4 bg-white rounded-lg border p-6">
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Email Address
              </FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11"
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
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="Muhammad Ahmed"
                    className="pl-10 h-11"
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
                </FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    placeholder="03001234567"
                    className="pl-10 h-11"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
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
