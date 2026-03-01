type ProductDescriptionProps = {
  description: string | null
  specs?: any | null
}

export function ProductDescription({ description, specs }: ProductDescriptionProps) {
  return (
    <div className="space-y-8">
      {/* Description */}
      {description && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            {description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Specifications</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(specs).map(([key, value]) => (
              <div
                key={key}
                className="border-b border-gray-200 pb-3 flex justify-between"
              >
                <dt className="font-medium text-gray-900">{key}</dt>
                <dd className="text-gray-600">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
