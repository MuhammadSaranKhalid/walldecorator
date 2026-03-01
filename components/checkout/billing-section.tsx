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
import { Checkbox } from '@/components/ui/checkbox'

export function BillingSection() {
  const { control, watch, setValue } = useFormContext<CheckoutFormData>()
  const useSameAddress = watch('useSameAddress')

  const handleSameAddressChange = (checked: boolean) => {
    setValue('useSameAddress', checked)
    if (checked) {
      // Clear billing when using same address
      setValue('billing', undefined)
    } else {
      // Initialize billing fields when user wants different address
      setValue('billing', {
        line1: '',
        line2: '',
        city: '',
        province: '',
        postalCode: '',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Controller
        name="useSameAddress"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal" className="flex items-start space-x-3 space-y-0 rounded-lg bg-white border p-4">
            <Checkbox
              id={field.name}
              checked={field.value}
              onCheckedChange={(checked) => handleSameAddressChange(checked as boolean)}
            />
            <div className="space-y-1 leading-none">
              <FieldLabel htmlFor={field.name} className="cursor-pointer text-sm font-medium">
                Billing address same as shipping
              </FieldLabel>
            </div>
          </Field>
        )}
      />

      {!useSameAddress && (
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-xl font-semibold">Billing Address</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter your billing information
            </p>
          </div>

          <div className="space-y-4 bg-white rounded-lg border p-6">
            <Controller
              name="billing.line1"
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
                      value={field.value || ''}
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
              name="billing.line2"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                    Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ''}
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
                name="billing.city"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                      City
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value || ''}
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
                name="billing.province"
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
              name="billing.postalCode"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                    Postal Code
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ''}
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
      )}
    </div>
  )
}
