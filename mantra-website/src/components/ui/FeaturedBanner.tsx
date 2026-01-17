"use client";

import Link from 'next/link';

interface FeaturedBannerProps {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    linkHref?: string;
}

export default function FeaturedBanner({
    title = "Weekly Featured",
    subtitle = "Handpicked stories loved by editors",
    imageUrl = "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1200&auto=format&fit=crop",
    linkHref = "/ranking"
}: FeaturedBannerProps) {
    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-6 mb-10">
            <Link href={linkHref} className="block group relative h-[420px] w-full overflow-hidden rounded-[2rem] shadow-premium">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                >
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
                </div>

                {/* Cinematic Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                {/* Content Box */}
                <div className="absolute bottom-10 left-8 right-8 max-w-3xl">
                    <div className="inline-flex items-center px-3 py-1 mb-4 text-xs font-bold text-white uppercase tracking-wider bg-white/20 backdrop-blur-md rounded-full border border-white/10">
                        Featured Story
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight shadow-sm leading-tight text-balance">
                        {title}
                    </h2>
                    <p className="text-lg text-white/90 font-medium max-w-xl leading-relaxed text-balance">
                        {subtitle}
                    </p>
                </div>
            </Link>
        </div>
    );
}
