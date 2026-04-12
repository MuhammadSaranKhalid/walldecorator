import Link from 'next/link'

const WHATSAPP_NUMBER = '923001234567' // Update with actual number
const WHATSAPP_MESSAGE = 'Hi! I have a question about your wall art.'

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-[150] flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ backgroundColor: '#25D366' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-white"
        aria-hidden="true"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.472 2.027 7.772L0 32l8.468-2.001A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.03 22.187c-.334.94-1.95 1.8-2.687 1.914-.688.107-1.557.152-2.51-.158-.579-.188-1.32-.44-2.268-.863-3.988-1.724-6.593-5.754-6.793-6.02-.2-.267-1.63-2.168-1.63-4.135 0-1.966 1.032-2.934 1.398-3.333.366-.4.8-.5 1.066-.5l.767.014c.245.01.574-.094.9.685.334.8 1.132 2.766 1.232 2.966.1.2.167.434.033.7-.133.267-.2.434-.4.667-.2.234-.42.523-.6.7-.2.2-.408.418-.175.818.233.4 1.032 1.7 2.215 2.754 1.52 1.355 2.8 1.776 3.2 1.976.4.2.633.167.866-.1.234-.267 1-1.167 1.267-1.567.267-.4.534-.333.9-.2.367.133 2.333 1.1 2.733 1.3.4.2.667.3.767.466.1.167.1.967-.233 1.906z" />
      </svg>
    </Link>
  )
}
