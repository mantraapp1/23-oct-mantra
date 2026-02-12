import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    type CarouselApi,
} from '@/components/ui/Carousel';

interface HeroNovel {
    id: string;
    title: string;
    description?: string | null;
    cover_image_url?: string | null;
    author?: { display_name?: string | null; username?: string | null } | null;
    genres?: string[] | null;
    total_views?: number | null;
    average_rating?: number | null;
}

interface HeroSectionProps {
    novels: HeroNovel[];
}

export default function HeroSection({ novels }: HeroSectionProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    // Auto-play logic
    useEffect(() => {
        if (!api) return;

        const interval = setInterval(() => {
            if (api.canScrollNext()) {
                api.scrollNext();
            } else {
                api.scrollTo(0);
            }
        }, 6000);

        return () => clearInterval(interval);
    }, [api]);

    useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    if (!novels || novels.length === 0) return null;

    // Take top 5
    const featuredNovels = novels.slice(0, 5);

    return (
        <div className="w-full bg-background relative group">
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {featuredNovels.map((novel) => (
                        <CarouselItem key={novel.id}>
                            <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
                                {/* Background Image with Theme-Aware Gradient Overlay */}
                                <div className="absolute inset-0">
                                    <img
                                        src={novel.cover_image_url || '/placeholder.png'}
                                        alt={novel.title}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    />
                                    {/* 
                                      CRITICAL: Use 'from-background' to seamlessly blend with the page theme.
                                      In Light Mode: bg-background = white. Text reads clearly on white.
                                      In Dark Mode: bg-background = dark. Text reads clearly on dark.
                                    */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="relative h-full container mx-auto px-4 md:px-8 flex items-center">
                                    <div className="flex flex-col justify-center h-full max-w-3xl py-12 md:py-16 space-y-6">

                                        {/* Genre Badges */}
                                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                                            <Badge
                                                variant="secondary"
                                                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 text-xs uppercase tracking-wider font-bold"
                                            >
                                                Featured
                                            </Badge>
                                            {novel.genres?.slice(0, 3).map((genre) => (
                                                <Badge
                                                    key={genre}
                                                    variant="outline"
                                                    className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 text-muted-foreground"
                                                >
                                                    {genre}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Title */}
                                        <Link to={`/novel/${novel.id}`} className="block group/title">
                                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.1] drop-shadow-sm group-hover/title:text-primary transition-colors duration-300 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
                                                {novel.title}
                                            </h1>
                                        </Link>

                                        {/* Author & Stats */}
                                        <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base text-muted-foreground animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                                            <span className="font-semibold text-foreground">
                                                {novel.author?.display_name || novel.author?.username || 'Unknown Author'}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="font-bold text-foreground">
                                                    {novel.average_rating?.toFixed(1) || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span>
                                                {(novel.total_views || 0).toLocaleString()} views
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="hidden md:block text-lg text-muted-foreground leading-relaxed line-clamp-3 max-w-2xl animate-in fade-in slide-in-from-left-10 duration-700 delay-300">
                                            {novel.description || 'No description available for this novel.'}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                                            <Link to={`/novel/${novel.id}`}>
                                                <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                                                    Read Now
                                                </Button>
                                            </Link>
                                            <Link to={`/novel/${novel.id}`}>
                                                <Button size="lg" variant="outline" className="rounded-full w-12 h-12 p-0 border-muted-foreground/20 hover:bg-muted/50">
                                                    <Info className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Floating Card (Desktop Only) */}
                                    <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-1000 delay-300">
                                        <Link to={`/novel/${novel.id}`}>
                                            <div className="relative w-[280px] h-[420px] rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/10 rotate-3 hover:rotate-0 transition-transform duration-500 hover:scale-105 group/card">
                                                <img
                                                    src={novel.cover_image_url || '/placeholder.png'}
                                                    alt={novel.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navigation Controls */}
                <div className="hidden md:block">
                    <CarouselPrevious className="left-4 bg-background/50 border-border" />
                    <CarouselNext className="right-4 bg-background/50 border-border" />
                </div>

                {/* Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {featuredNovels.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                current === index
                                    ? "w-8 bg-primary"
                                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </div>
    );
}
