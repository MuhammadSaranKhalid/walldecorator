'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Upload, X, CheckCircle2, Loader2 } from 'lucide-react'
import { CustomOrderSchema, type CustomOrderFormData } from '@/lib/validations/customize'
import { submitCustomOrder } from '@/actions/customize'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from '@/components/ui/field'

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// ─── Types ────────────────────────────────────────────────────────────────────
interface FileState {
  file: File
  preview: string
}

interface AttributeOption {
  value: string
  label: string
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomCraftSection() {
  const [fileInputRef] = [useRef<HTMLInputElement>(null)]
  const [fileState, setFileState] = useState<FileState | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [materials, setMaterials] = useState<AttributeOption[]>([])
  const [sizes, setSizes] = useState<AttributeOption[]>([])
  const [thicknesses, setThicknesses] = useState<AttributeOption[]>([])

  useEffect(() => {
    async function fetchAttributes() {
      const { data, error } = await supabase
        .from('product_attributes')
        .select(`
          name,
          product_attribute_values (
            value,
            display_name,
            display_order
          )
        `)

      if (error) {
        console.error('Error fetching attributes:', error)
        return
      }

      if (data) {
        data.forEach((attr: any) => {
          const sortedValues = (attr.product_attribute_values || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((v: any) => ({ value: v.value, label: v.display_name }))

          if (attr.name === 'material') setMaterials(sortedValues)
          if (attr.name === 'size') {
            setSizes([...sortedValues, { value: 'custom', label: 'Custom Size' }])
          }
          if (attr.name === 'thickness') setThicknesses(sortedValues)
        })
      }
    }

    fetchAttributes()
  }, [])

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<CustomOrderFormData>({
    resolver: zodResolver(CustomOrderSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      description: '',
      preferred_material: '',
      preferred_size: '',
      preferred_thickness: '',
    },
  })

  // ── File handling ──────────────────────────────────────────────────────────
  const validateAndSetFile = useCallback((file: File) => {
    setFileError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only JPG, PNG, GIF, and WebP images are allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Image must be smaller than 10 MB.')
      return
    }

    const preview = URL.createObjectURL(file)
    setFileState({ file, preview })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const removeFile = () => {
    if (fileState?.preview) URL.revokeObjectURL(fileState.preview)
    setFileState(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  const onSubmit = async (data: CustomOrderFormData) => {
    if (!fileState?.file) {
      setFileError('Please upload your design image.')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1 — Upload image directly from browser to Supabase Storage (Client Side)
      // Bypasses Next.js 1MB Server Action limit completely.
      const file = fileState.file
      const ext = file.name.split('.').pop() ?? 'jpg'

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const uniqueId = crypto.randomUUID()
      const storagePath = `${year}/${month}/${uniqueId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('custom-orders')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        toast.error('Failed to upload your image. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Step 2 — Submit order data to PostgreSQL via Server Action
      const orderResult = await submitCustomOrder({
        ...data,
        image_url: storagePath,
      })

      if (!orderResult.success) {
        toast.error(orderResult.error)
        setIsSubmitting(false)
        return
      }

      // Success
      setIsSuccess(true)
      toast.success(`Your request has been submitted! We\u2019ll get back to you soon.`)
      reset()
      removeFile()
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center py-20">
          <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-primary mb-3">Request Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            We&apos;ve received your custom order request and will reach out shortly with a quote.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* ── Left: Info + Image ─────────────────────────────────────── */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-primary mb-4">Your Vision, Our Craft</h2>
            <p className="text-muted-foreground leading-relaxed text-sm max-w-lg">
              Have a unique idea? We specialise in bringing custom wall décor to life. Upload your
              design, fill in your preferences, and our team will quote you a personalised price.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-border relative h-[400px]">
            <Image
              alt="Crafting tools and materials"
              className="object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhehHTxXFanmuEpilGW_UyY7j8tg2PsWPN2s173PHGMUTj3_Feaw0rRgsjCLsL07BkMUzcywJHgCtjIO5bKoBIJr2VrT6Vyqf_6s1_FxXUyNsZs_7YRjnYE5q3K2ZRiF4k1g3QAPuX9_eItIFGIlhMV_8SsbuQQdq6ygyAh2RyWx51Ctzf2LnZnzRtBk2cZ4J9OLaA1CJAqVKhxCXVufXOGCTaElxtfiOSmMdNTpS_x1AgKYxUcrffJP1oO8h6Qo4ZXK8IMZylzWk"
              fill
              unoptimized
            />
          </div>

          {/* Trust signals */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {[
              '100% hand-crafted to your specifications',
              'Pakistan-wide delivery',
              'Dedicated support throughout production',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-accent font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Form ────────────────────────────────────────────── */}
        <form id="custom-craft-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FieldGroup>
            {/* Row: Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="customer_name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="customer_name">
                      Full Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="customer_name"
                      placeholder="Muhammad Ali"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="customer_email"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="customer_email">
                      Email <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="customer_email"
                      type="email"
                      placeholder="you@example.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Phone */}
            <Controller
              name="customer_phone"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="customer_phone">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="customer_phone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Row: Material + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="preferred_material"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-full">
                    <FieldLabel htmlFor="preferred_material">Preferred Material</FieldLabel>
                    <NativeSelect {...field} id="preferred_material" aria-invalid={fieldState.invalid} className="w-full">
                      <NativeSelectOption value="">Any material</NativeSelectOption>
                      {materials.map((m) => (
                        <NativeSelectOption key={m.value} value={m.value}>
                          {m.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="preferred_size"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-full">
                    <FieldLabel htmlFor="preferred_size">Preferred Size</FieldLabel>
                    <NativeSelect {...field} id="preferred_size" aria-invalid={fieldState.invalid} className="w-full">
                      <NativeSelectOption value="">Any size</NativeSelectOption>
                      {sizes.map((s) => (
                        <NativeSelectOption key={s.value} value={s.value}>
                          {s.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Thickness */}
            <Controller
              name="preferred_thickness"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel htmlFor="preferred_thickness">Preferred Thickness</FieldLabel>
                  <NativeSelect {...field} id="preferred_thickness" aria-invalid={fieldState.invalid} className="w-full">
                    <NativeSelectOption value="">Any thickness</NativeSelectOption>
                    {thicknesses.map((t) => (
                      <NativeSelectOption key={t.value} value={t.value}>
                        {t.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Describe your customisation</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    rows={3}
                    placeholder="E.g., family name, favourite quote, specific design elements, colour preferences..."
                    className="resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* File Upload */}
            <Field data-invalid={!!fileError}>
              <FieldLabel>
                Upload Design File <span className="text-red-500">*</span>
              </FieldLabel>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {fileState ? (
                /* Preview */
                <div className="relative rounded-xl overflow-hidden border border-input bg-muted/20">
                  <div className="relative h-48 w-full">
                    <Image
                      src={fileState.preview}
                      alt="Design preview"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-t border-input bg-background">
                    <p className="text-xs text-muted-foreground truncate max-w-[80%]">{fileState.file.name}</p>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    w-full rounded-xl p-10 flex flex-col items-center justify-center text-center
                    border-2 border-dashed transition-all duration-200 cursor-pointer
                    ${isDragging
                      ? 'border-foreground bg-muted scale-[0.99]'
                      : fileError
                        ? 'border-destructive/50 bg-destructive/5 hover:border-destructive/80'
                        : 'border-input bg-muted/20 hover:border-muted-foreground hover:bg-muted/40'
                    }
                  `}
                >
                  <Upload
                    className={`h-9 w-9 mb-3 ${fileError ? 'text-destructive/60' : 'text-muted-foreground'}`}
                  />
                  <p className="text-sm text-foreground mb-1 font-medium">
                    Upload a file <span className="font-normal text-muted-foreground">or drag and drop</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP up to 10 MB</p>
                </button>
              )}

              {fileError && <FieldError errors={[{ message: fileError }]} />}
            </Field>
          </FieldGroup>

          {/* Submit */}
          <button
            type="submit"
            form="custom-craft-form"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-200 hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm mt-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Get a Quote'
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            We&apos;ll get back to you within 24 hours with a personalised quote.
          </p>
        </form>
      </div>
    </section>
  )
}
