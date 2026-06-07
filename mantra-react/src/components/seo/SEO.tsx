import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'book' | 'article';
    schema?: object;
    lang?: string;
    author?: string;
    publishDate?: string;
    modifiedDate?: string;
}

export default function SEO({
    title = 'Mantra - Read & Discover Stories',
    description = 'Read the best web novels, light novels, and web fictions online for free on Mantra. Discover fantasy, romance, adventure, action, and more.',
    keywords = 'webnovels, web novels, read novels, light novels, free webnovels, stories, fantasy novels, romance novels',
    image = '/logo-circle.png',
    url = '',
    type = 'website',
    schema,
    lang = 'en',
    author,
    publishDate,
    modifiedDate
}: SEOProps) {
    // Dynamic domain fallback if custom domain isn't defined
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mantra-webnovels.vercel.app';
    const canonicalUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;
    const ogImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* HTML Language Tag for Geotargeting and LLM Processing */}
            <html lang={lang} />

            {/* Standard HTML Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {author && <meta name="author" content={author} />}
            {publishDate && <meta name="publish-date" content={publishDate} />}
            {publishDate && <meta name="pubdate" content={publishDate} />}
            {modifiedDate && <meta name="last-modified" content={modifiedDate} />}

            {/* Canonical Link */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook Meta Tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:locale" content={lang === 'en' ? 'en_US' : lang === 'hi' ? 'hi_IN' : `${lang}_US`} />
            <meta property="og:site_name" content="Mantra" />

            {/* Twitter Card Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Structured Schema Data */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
