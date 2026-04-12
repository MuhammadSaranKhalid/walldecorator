'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Camera, SunMedium, RotateCcw } from 'lucide-react'

type WallViewerModalProps = {
  productImageUrl: string
  productName: string
  onClose: () => void
}

type CameraError =
  | 'NotAllowedError'
  | 'NotFoundError'
  | 'NotReadableError'
  | 'OverconstrainedError'
  | 'generic'

const ERROR_MESSAGES: Record<CameraError, string> = {
  NotAllowedError: 'Camera access was denied. Please allow camera permission and try again.',
  NotFoundError: 'No camera was found on this device.',
  NotReadableError: 'Camera is in use by another app. Please close it and try again.',
  OverconstrainedError: 'Camera constraints could not be satisfied.',
  generic: 'Could not access camera. Please try again.',
}

type Position = { x: number; y: number }

export function WallViewerModal({ productImageUrl, productName, onClose }: WallViewerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [scale, setScale] = useState(0.5)
  const [opacity, setOpacity] = useState(0.85)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)

  // ── Drag state ─────────────────────────────────────────────────────────────
  // Position = center of the image in container-local pixels
  const [position, setPosition] = useState<Position | null>(null)
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)

  // Centre the image when streaming first starts (or on reset)
  const centerPosition = useCallback(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    setPosition({ x: width / 2, y: height / 2 })
  }, [])

  useEffect(() => {
    if (isStreaming) centerPosition()
  }, [isStreaming, centerPosition])

  // ── Pointer-event drag handlers ────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      hasDraggedRef.current = false

      const rect = containerRef.current!.getBoundingClientRect()
      const cx = position?.x ?? rect.width / 2
      const cy = position?.y ?? rect.height / 2

      // Offset = pointer position relative to container minus image center
      dragOffsetRef.current = {
        x: e.clientX - rect.left - cx,
        y: e.clientY - rect.top - cy,
      }
    },
    [position]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only act when the primary button (or a finger) is pressed
      if (!(e.buttons & 1) && e.pointerType !== 'touch') return

      hasDraggedRef.current = true
      const rect = containerRef.current!.getBoundingClientRect()

      setPosition({
        x: e.clientX - rect.left - dragOffsetRef.current.x,
        y: e.clientY - rect.top - dragOffsetRef.current.y,
      })
    },
    []
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId)

      // If the user only tapped (didn't drag), toggle controls just like
      // tapping the camera background does.
      if (!hasDraggedRef.current) {
        setShowControls((v) => !v)
      }
      hasDraggedRef.current = false
    },
    []
  )

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null)
    setIsStreaming(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsStreaming(true)
        }
      }
    } catch (err) {
      const name = (err as DOMException).name as CameraError
      setCameraError(name in ERROR_MESSAGES ? name : 'generic')
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [startCamera])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Screenshot ─────────────────────────────────────────────────────────────
  const handleScreenshot = useCallback(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !isStreaming || !container) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const containerRect = container.getBoundingClientRect()

      // Map container-pixel position → canvas-pixel position
      const scaleX = canvas.width / containerRect.width
      const scaleY = canvas.height / containerRect.height

      const cx = (position?.x ?? containerRect.width / 2) * scaleX
      const cy = (position?.y ?? containerRect.height / 2) * scaleY

      const scaledW = canvas.width * scale
      const scaledH = (img.naturalHeight / img.naturalWidth) * scaledW

      ctx.globalAlpha = opacity
      ctx.drawImage(img, cx - scaledW / 2, cy - scaledH / 2, scaledW, scaledH)
      ctx.globalAlpha = 1

      canvas.toBlob((blob) => {
        if (!blob) return
        setScreenshotUrl(URL.createObjectURL(blob))
      }, 'image/jpeg', 0.92)
    }
    img.src = productImageUrl
  }, [isStreaming, scale, opacity, productImageUrl, position])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScale(0.5)
    setOpacity(0.85)
    setScreenshotUrl(null)
    centerPosition()
  }

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!screenshotUrl) return
    const a = document.createElement('a')
    a.href = screenshotUrl
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-on-wall.jpg`
    a.click()
    URL.revokeObjectURL(screenshotUrl)
    setScreenshotUrl(null)
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`View ${productName} on your wall`}
    >
      {/* ── Camera feed + overlay canvas ────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onClick={() => setShowControls((v) => !v)}
      >
        {/* Live video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Loading */}
        {!isStreaming && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/70 text-sm tracking-widest uppercase">Starting camera…</p>
          </div>
        )}

        {/* Error */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white/60" />
            </div>
            <p className="text-white text-sm leading-relaxed max-w-xs">
              {ERROR_MESSAGES[cameraError]}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); startCamera() }}
              className="px-6 py-2.5 bg-white text-black text-xs tracking-widest uppercase font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Draggable product image ────────────────────────────────────────── */}
        {isStreaming && position && (
          <div
            className="absolute select-none touch-none"
            style={{
              left: position.x,
              top: position.y,
              width: `${scale * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: hasDraggedRef.current ? 'grabbing' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl}
              alt={productName}
              className="w-full h-auto object-contain drop-shadow-2xl"
              style={{ opacity }}
              draggable={false}
            />
            {/* Drag hint ring — fades after first drag */}
            {showControls && (
              <div className="absolute inset-0 rounded border border-white/20 pointer-events-none" />
            )}
          </div>
        )}

        {/* Tap hint */}
        {isStreaming && showControls && (
          <p className="absolute bottom-36 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase whitespace-nowrap pointer-events-none">
            Drag image · Tap to hide controls
          </p>
        )}
      </div>

      {/* ── Sliding controls bar ─────────────────────────────────────────────── */}
      <div
        className={`absolute left-0 right-0 bottom-0 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/70 backdrop-blur-md px-5 pt-4 pb-8 space-y-4 border-t border-white/10">

          {/* Size slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-white/50 shrink-0" />
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
              aria-label="Product size"
            />
            <ZoomIn className="w-4 h-4 text-white/50 shrink-0" />
            <span className="text-white/50 text-xs w-8 text-right tabular-nums">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-3">
            <SunMedium className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="range"
              min={0.3}
              max={1.0}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
              aria-label="Product opacity"
            />
            <SunMedium className="w-4 h-4 text-white/70 shrink-0" />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Reset position and size"
            >
              <RotateCcw className="w-4 h-4 text-white/70" />
            </button>

            <button
              onClick={handleScreenshot}
              disabled={!isStreaming}
              className="flex-1 flex items-center justify-center gap-2 h-10 bg-white text-black text-xs tracking-widest uppercase font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <Camera className="w-4 h-4" />
              Capture
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/50 backdrop-blur-sm border border-white/10 max-w-[60vw]">
        <p className="text-white/80 text-xs tracking-widest uppercase truncate">{productName}</p>
      </div>

      {/* ── Screenshot preview ────────────────────────────────────────────────── */}
      {screenshotUrl && (
        <div
          className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center gap-5 p-6"
          onClick={() => setScreenshotUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Captured preview"
            className="max-w-full max-h-[65vh] object-contain rounded"
          />
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-white text-black text-xs tracking-widest uppercase font-medium"
            >
              Save Photo
            </button>
            <button
              onClick={() => setScreenshotUrl(null)}
              className="px-6 py-2.5 border border-white/30 text-white text-xs tracking-widest uppercase"
            >
              Back
            </button>
          </div>
          <p className="text-white/30 text-xs">Tap outside to dismiss</p>
        </div>
      )}
    </div>
  )
}
