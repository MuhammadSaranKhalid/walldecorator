'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CustomOrderSchema, type CustomOrderFormData } from '@/lib/validations/customize'
import { submitCustomOrder } from '@/actions/customize'
import { supabase } from '@/lib/supabase/client'

export default function CustomCraftSection() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomOrderFormData>({
    resolver: zodResolver(CustomOrderSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: CustomOrderFormData) => {
    if (!imageFile) {
      setErrorMessage('Please upload a reference image.')
      setSubmitResult('error')
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)
    setErrorMessage('')

    try {
      // Upload image directly to Supabase storage from the browser
      const ext = imageFile.name.split('.').pop()
      const path = `custom-orders/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('custom-orders')
        .upload(path, imageFile, { upsert: false })

      if (uploadError) {
        setErrorMessage('Image upload failed. Please try again.')
        setSubmitResult('error')
        return
      }

      const result = await submitCustomOrder({ ...data, storagePath: path })

      if (result.success) {
        setSubmitResult('success')
        reset()
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setErrorMessage(result.error)
        setSubmitResult('error')
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
      setSubmitResult('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitResult === 'success') {
    return (
      <section className="py-20 px-6 sm:px-12 bg-[var(--obsidian-bg)]">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl font-light mb-3 text-[var(--obsidian-gold)]">
            Request Received
          </h2>
          <p className="text-sm text-[var(--obsidian-text-muted)] leading-relaxed">
            We&apos;ll review your submission and send you a personalised quote within 24 hours.
          </p>
          <button
            onClick={() => setSubmitResult(null)}
            className="mt-8 border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] px-8 py-3 text-[11px] tracking-[2px] uppercase hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)] transition-colors duration-200"
          >
            Submit Another
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-6 sm:px-12 bg-[var(--obsidian-bg)]">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[9px] tracking-[3px] uppercase text-[var(--obsidian-gold)] mb-4">
            <div className="w-6 h-px bg-[var(--obsidian-gold)]" />
            Custom Order
          </div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[clamp(32px,4vw,48px)] font-light leading-tight mb-3">
            Tell Us Your Vision
          </h2>
          <p className="text-sm text-[var(--obsidian-text-muted)] leading-relaxed">
            Fill in the details below and upload a reference image. We&apos;ll get back to you with a quote within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
                Full Name <span className="text-[var(--obsidian-red)]">*</span>
              </label>
              <input
                {...register('customer_name')}
                placeholder="Your name"
                className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 placeholder:text-[var(--obsidian-text-dim)]"
              />
              {errors.customer_name && (
                <p className="mt-1 text-[10px] text-[var(--obsidian-red)]">{errors.customer_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
                Email <span className="text-[var(--obsidian-red)]">*</span>
              </label>
              <input
                {...register('customer_email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 placeholder:text-[var(--obsidian-text-dim)]"
              />
              {errors.customer_email && (
                <p className="mt-1 text-[10px] text-[var(--obsidian-red)]">{errors.customer_email.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
              Phone <span className="text-[var(--obsidian-text-dim)]">(optional)</span>
            </label>
            <input
              {...register('customer_phone')}
              type="tel"
              placeholder="+92 300 0000000"
              className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 placeholder:text-[var(--obsidian-text-dim)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
              Description <span className="text-[var(--obsidian-text-dim)]">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your idea — theme, style, any specific details..."
              className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 placeholder:text-[var(--obsidian-text-dim)] resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-[10px] text-[var(--obsidian-red)]">{errors.description.message}</p>
            )}
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
                Material
              </label>
              <select
                {...register('preferred_material')}
                className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 cursor-pointer"
              >
                <option value="">Any</option>
                <option value="steel">Steel</option>
                <option value="wood">Wood</option>
                <option value="acrylic">Acrylic</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
                Size
              </label>
              <select
                {...register('preferred_size')}
                className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 cursor-pointer"
              >
                <option value="">Any</option>
                <option value="1x1">1ft × 1ft</option>
                <option value="1x2">1ft × 2ft</option>
                <option value="2x2">2ft × 2ft</option>
                <option value="3x3">3ft × 3ft</option>
                <option value="4x4">4ft × 4ft</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
                Thickness
              </label>
              <select
                {...register('preferred_thickness')}
                className="w-full bg-[var(--obsidian-surface)] border border-[var(--obsidian-border)] text-[var(--obsidian-text)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--obsidian-gold)] transition-colors duration-200 cursor-pointer"
              >
                <option value="">Any</option>
                <option value="1">1mm</option>
                <option value="1.2">1.2mm</option>
                <option value="2">2mm</option>
                <option value="3">3mm</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[9px] tracking-[2px] uppercase text-[var(--obsidian-text-dim)] mb-2">
              Reference Image <span className="text-[var(--obsidian-red)]">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[var(--obsidian-border)] hover:border-[var(--obsidian-gold)] transition-colors duration-200 cursor-pointer p-8 flex flex-col items-center justify-center gap-3 bg-[var(--obsidian-surface)]"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 object-contain"
                />
              ) : (
                <>
                  <div className="text-3xl text-[var(--obsidian-text-dim)]">↑</div>
                  <p className="text-[11px] text-[var(--obsidian-text-muted)] tracking-wide text-center">
                    Click to upload your design or reference image
                    <br />
                    <span className="text-[var(--obsidian-text-dim)]">PNG, JPG, SVG up to 10MB</span>
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {!imageFile && submitResult === 'error' && errorMessage.includes('image') && (
              <p className="mt-1 text-[10px] text-[var(--obsidian-red)]">{errorMessage}</p>
            )}
          </div>

          {/* Error */}
          {submitResult === 'error' && !errorMessage.includes('image') && (
            <p className="text-sm text-[var(--obsidian-red)]">{errorMessage}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--obsidian-gold)] text-[var(--obsidian-bg)] border-none px-8 py-4 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[3px] uppercase font-medium transition-all duration-250 hover:bg-[var(--obsidian-gold-light)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </section>
  )
}
