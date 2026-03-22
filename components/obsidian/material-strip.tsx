export function MaterialStrip() {
  const materials = [
    { icon: '⚙️', text: 'Precision Laser-Cut' },
    { icon: '🔩', text: 'Powder-Coated Steel' },
    { icon: '🪵', text: 'Solid Hardwood' },
    { icon: '💎', text: 'Acrylic & Resin' },
    { icon: '📦', text: 'Free Gift Packaging' },
    { icon: '✈️', text: 'Worldwide Shipping' },
  ]

  return (
    <div className="border-t border-b border-[var(--obsidian-border)] py-5 px-6 sm:px-12 flex items-center gap-0 overflow-x-auto obsidian-scrollbar relative z-[1]">
      {materials.map((item, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 px-8 whitespace-nowrap text-[11px] text-[var(--obsidian-text-muted)] tracking-wide ${
            index === 0 ? '!pl-0' : ''
          } ${index !== materials.length - 1 ? 'border-r border-[var(--obsidian-border)]' : ''}`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  )
}
