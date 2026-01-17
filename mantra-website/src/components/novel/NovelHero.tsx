import Link from 'next/link';
import { ArrowLeft, MoreVertical, Share2 } from 'lucide-react';

interface NovelHeroProps {
    novel: {
        id: string;
        title: string;
        cover_image_url: string | null;
        author?: {
            id: string;
            username: string;
        };
        status: string;
        genres?: string[];
    };
}

export default function NovelHero({ novel }: NovelHeroProps) {
    return (
        <div className="relative pb-6 md:pb-12">
            {/* 1. Top Bar Backdrop Image */}
            <div className="relative h-64 md:h-80">
                <img
                    src={novel.cover_image_url || '/placeholder.png'}
                    className="h-full w-full object-cover"
                    alt="Cover Backdrop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent"></div>

                {/* Navigation Buttons */}
                <div className="absolute top-4 left-4 md:left-[calc(50%-40rem)] md:translate-x-4 max-w-7xl mx-auto w-full z-20 pointer-events-none">
                    <div className="flex justify-between w-full pr-8 pointer-events-auto">
                        <Link href="/" className="p-2 rounded-xl bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </Link>
                        <button className="p-2 rounded-xl bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                            <Share2 className="w-5 h-5 text-slate-700" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Floating Content Card */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    {/* Cover Image */}
                    <img
                        src={novel.cover_image_url || '/placeholder.png'}
                        className="h-36 w-28 md:h-64 md:w-48 rounded-xl object-cover border-4 border-white shadow-xl flex-shrink-0"
                        alt={novel.title}
                    />

                    {/* Title & Meta */}
                    <div className="flex-1 min-w-0 pt-2 md:pt-32">
                        <div className="md:hidden">
                            {/* Mobile Header (Shown aside cover in mobile view, but here we stack differently if needed, 
                                but the original design had them side-by-side. Let's keep side-by-side for mobile 
                                but slightly adjusted structure to match the desktop shift) */}
                        </div>

                        <div className="hidden md:block">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-2">{novel.title}</h1>
                            <div className="flex items-center gap-2 text-slate-600 text-lg mb-4">
                                <span>by</span>
                                <span className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-sky-600 cursor-pointer">{novel.author?.username || 'Unknown'}</span>
                            </div>
                        </div>

                        {/* Mobile visible title is handled by the parent flex alignment usually, 
                            but let's revert to a cleaner structure that works for both: 
                            Image Left, Content Right. On mobile, Image and Content are side-by-side.
                         */}
                    </div>
                </div>

                {/* Mobile-Specific layout override to match original "Hero Card" look exactly, 
                    but constrained. The above structure is a bit broken for the specific "floating card" look 
                    if we want to keep the mobile EXACTLY as is. 
                    Let's use a simpler conditional approach for the layout internal.
                */}
                <div className="md:hidden absolute top-0 left-4 right-4 flex gap-4">
                    <img
                        src={novel.cover_image_url || '/placeholder.png'}
                        className="h-28 w-20 rounded-xl object-cover border-4 border-white shadow-lg flex-shrink-0"
                        alt={novel.title}
                    />
                    <div className="flex-1 min-w-0 pt-8">
                        <div className="text-xl font-bold tracking-tight leading-tight line-clamp-2 text-slate-900">{novel.title}</div>
                        <div className="text-xs text-slate-500 mt-1">by <span className="font-medium text-slate-800">{novel.author?.username || 'Unknown'}</span></div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${novel.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {novel.status}
                            </span>
                            {novel.genres?.slice(0, 2).map((genre, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop Only Tags (Below title) */}
                <div className="hidden md:flex flex-wrap gap-2 mt-4 ml-[14rem]">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${novel.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {novel.status}
                    </span>
                    {novel.genres?.map((genre, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide hover:bg-slate-200 transition-colors cursor-pointer">
                            {genre}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
