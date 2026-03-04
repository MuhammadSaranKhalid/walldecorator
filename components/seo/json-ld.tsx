type JsonLdProps = {
    data: Record<string, unknown>
}

/**
 * XSS-safe JSON-LD component per the nextjs-seo skill.
 * Escapes `<` characters to prevent HTML injection inside script tags.
 */
export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data).replace(/</g, '\\u003c'),
            }}
        />
    )
}
