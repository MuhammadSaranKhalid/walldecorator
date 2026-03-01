'use client'

import { MapPin } from 'lucide-react'
import { useFormContext, Controller } from 'react-hook-form'
import type { CheckoutFormData } from '@/lib/validations/checkout'
import { PAKISTAN_PROVINCES } from '@/lib/constants'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ShippingSection() {
  const { control } = useFormContext<CheckoutFormData>()

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h2 className="text-xl font-semibold">Delivery</h2>
        <p className="text-sm text-gray-600 mt-1">
          Where should we deliver your order?
        </p>
      </div>

      <div className="space-y-4 bg-white rounded-lg border p-6">
        <Controller
          name="shipping.line1"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Address Line 1
              </FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="House 123, Street 456"
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
          name="shipping.line2"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="Near XYZ Landmark"
                className="h-11"
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
                  placeholder="Lahore"
                  className="h-11"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="shipping.province"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                  Province
                </FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger
                    id={field.name}
                    className="h-11"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAKISTAN_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Postal Code
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="54000"
                maxLength={5}
                className="h-11"
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
