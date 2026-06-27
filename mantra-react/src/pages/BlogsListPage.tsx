import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, User, Clock, ArrowRight } from 'lucide-react';
import blogsData from '@/data/blogsData.json';
import type { BlogPost } from '@/types/blog';
import SEO from '@/components/seo/SEO';

const { blogs, categories } = blogsData;

const getBlogImage = (id: string) => {
    const imagesPool = [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80", // Fountain pen
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80", // Magical book
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80", // Celestial book
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=80", // Library
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80", // Typewriter
        "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=600&auto=format&fit=crop&q=80", // Vintage journal
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80", // Cozy library
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80", // Book close up
        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80", // Reading outside
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80", // Starlit mountain
        "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&auto=format&fit=crop&q=80", // Sky clouds
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", // Gold gradient
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80", // Blockchain
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop&q=80", // Stellar coins
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80", // Cyber/tech
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&auto=format&fit=crop&q=80", // Ethereal temple
        "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&auto=format&fit=crop&q=80", // Cultivation valley
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80", // Forest
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", // Cosmic vortex
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80", // Trees light rays
        "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&auto=format&fit=crop&q=80", // Mountain peak
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=80", // Abstract art
        "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=600&auto=format&fit=crop&q=80", // Crypto waves
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80", // Charts dashboard
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80", // Digital net grid
        "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&auto=format&fit=crop&q=80", // Team work
        "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80", // Cafe friends
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80", // Coworkers
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80", // Celebration
        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", // Hearts shape hands
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80", // Blogging laptop
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&auto=format&fit=crop&q=80", // Keyboard coding
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80", // Reading students
        "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80", // Sit outdoor reading
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80", // Books piles
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80"  // Opened book glow
    ];
    const charSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imagesPool[charSum % imagesPool.length];
};

export default function BlogsListPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredBlogs = blogs.filter((post: BlogPost) => {
        const matchesSearch = 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background text-foreground pb-16">
            <SEO
                title="Mantra Blogs - Web Novel Writing Guides & Recommendations"
                description="Explore writing tutorials, wuxia cultivation rank guides, litrpg progression tips, novel recommendations, and creator updates on Mantra Novels."
                keywords="webnovel writing tips, wuxia guides, litrpg tutorials, light novel recommendations, creator monetization"
                url="/blogs"
            />
            
            {/* Header Area */}
            <div className="border-b border-border bg-card/30 py-12 px-4">
                <div className="max-w-[1400px] mx-auto space-y-4 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
                        Official Publications & Resource Hub
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                        Mantra Novels Blog
                    </h1>
                    <p className="text-sm md:text-base text-foreground-secondary max-w-2xl mx-auto">
                        In-depth articles, cultivation realm guides, progression tips, genre studies, and platform updates for writers and readers.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1400px] mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Sidebar Column */}
                <div className="lg:col-span-1 lg:self-start">
                    {/* Inner Sticky Container */}
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {/* Search Panel */}
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
                                Search Articles
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-background-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                />
                                <Search className="absolute left-3.5 top-3 w-4 h-4 text-foreground-secondary" />
                            </div>
                        </div>

                        {/* Category Filter Panel */}
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
                                Categories
                            </h3>
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`text-left text-xs py-2 px-3 rounded-lg font-bold transition-all ${
                                        selectedCategory === null 
                                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
                                            : 'text-foreground-secondary hover:bg-background-secondary'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categories.map((cat: string) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`text-left text-xs py-2 px-3 rounded-lg font-bold transition-all ${
                                            selectedCategory === cat 
                                                ? 'bg-[var(--primary)]/10 text-[var(--primary)]' 
                                                : 'text-foreground-secondary hover:bg-background-secondary'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Writer Call-To-Action Banner Card to fill space */}
                        <div className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/30 rounded-2xl p-6 text-center space-y-3.5 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto font-black text-lg">M</div>
                            <h4 className="font-extrabold text-sm text-foreground">Write & Earn XLM</h4>
                            <p className="text-[11px] text-foreground-secondary leading-relaxed">
                                Publish your own stories, build your reader fanbase, and earn direct monetization payouts in Stellar Lumens (XLM) on Mantra!
                            </p>
                            <div className="pt-1">
                                <Link 
                                    to="/dashboard" 
                                    className="w-full py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-bold shadow-md shadow-[var(--primary)]/20 text-center transition-all block"
                                >
                                    Start Writing
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side (Articles Grid) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground-secondary">
                            Showing {filteredBlogs.length} articles
                        </span>
                    </div>

                    {filteredBlogs.length === 0 ? (
                        <div className="border border-border rounded-2xl p-12 text-center bg-card/20">
                            <BookOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-45" />
                            <h3 className="font-bold text-base text-foreground mb-1">No articles found</h3>
                            <p className="text-xs text-foreground-secondary">Try searching other keywords or clearing the category filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredBlogs.map((post: BlogPost) => (
                                <article 
                                    key={post.id} 
                                    className="bg-card border border-border rounded-2xl hover:border-[var(--primary)]/30 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                                >
                                    <div className="space-y-3.5">
                                        {/* Dynamic Cover Image */}
                                        <div className="w-full h-40 bg-[var(--background-secondary)] overflow-hidden border-b border-border relative">
                                            <img 
                                                src={getBlogImage(post.id)} 
                                                alt="" 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full bg-black/60 text-white font-extrabold backdrop-blur-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                        
                                        <div className="px-5 pb-2 pt-1 space-y-2">
                                            <span className="text-[10px] text-foreground-secondary flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" /> {post.readTime}
                                            </span>
                                            
                                            <h2 className="font-extrabold text-base text-foreground leading-snug line-clamp-2 hover:text-[var(--primary)] transition-colors">
                                                <Link to={`/blog/${post.id}`}>{post.title}</Link>
                                            </h2>
                                            
                                            <p className="text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                                                {post.description}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="px-5 pb-5 pt-3 mt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-secondary">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <User className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{post.author}</span>
                                        </div>
                                        <Link 
                                            to={`/blog/${post.id}`} 
                                            className="text-[var(--primary)] font-bold flex items-center gap-1 hover:gap-1.5 transition-all shrink-0"
                                        >
                                            Read More <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
