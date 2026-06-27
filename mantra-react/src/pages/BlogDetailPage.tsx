import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag, ChevronRight, BookOpen } from 'lucide-react';
import blogsData from '@/data/blogsData.json';
import type { BlogPost } from '@/types/blog';
import SEO from '@/components/seo/SEO';

const blogs = blogsData.blogs;

const getBlogImage = (id: string) => {
    const imagesPool = [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80", // Fountain pen
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80", // Magical book
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80", // Celestial book
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop&q=80", // Library
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80", // Typewriter
        "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&auto=format&fit=crop&q=80", // Vintage journal
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80", // Cozy library
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80", // Book close up
        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&auto=format&fit=crop&q=80", // Reading outside
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80", // Starlit mountain
        "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=800&auto=format&fit=crop&q=80", // Sky clouds
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80", // Gold gradient
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80", // Blockchain
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&auto=format&fit=crop&q=80", // Stellar coins
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80", // Cyber/tech
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop&q=80", // Ethereal temple
        "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&auto=format&fit=crop&q=80", // Cultivation valley
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80", // Forest
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80", // Cosmic vortex
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80", // Trees light rays
        "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&auto=format&fit=crop&q=80", // Mountain peak
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=80", // Abstract art
        "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&auto=format&fit=crop&q=80", // Crypto waves
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80", // Charts dashboard
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80", // Digital net grid
        "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=80", // Team work
        "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80", // Cafe friends
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80", // Coworkers
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80", // Celebration
        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80", // Hearts shape hands
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80", // Blogging laptop
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop&q=80", // Keyboard coding
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80", // Reading students
        "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=80", // Sit outdoor reading
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80", // Books piles
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80"  // Opened book glow
    ];
    const charSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imagesPool[charSum % imagesPool.length];
};

export default function BlogDetailPage() {
    const { id } = useParams<{ id: string }>();
    const post = blogs.find((b: BlogPost) => b.id === id);

    if (!post) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
                <BookOpen className="w-16 h-16 text-foreground-secondary opacity-30 mb-4 animate-bounce" />
                <h1 className="text-2xl font-black mb-2">Article Not Found</h1>
                <p className="text-sm text-foreground-secondary mb-6">The blog post you are looking for does not exist or has been moved.</p>
                <Link to="/blogs" className="py-2.5 px-5 bg-[var(--primary)] text-white font-bold rounded-xl text-xs hover:bg-[var(--primary)]/90 transition-colors">
                    Back to Blog List
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <SEO
                title={`${post.title} | Mantra Blog`}
                description={post.description}
                keywords={post.tags.join(', ')}
                url={`/blog/${post.id}`}
            />

            {/* Breadcrumbs Navigation */}
            <div className="border-b border-border bg-card/20 py-3 px-4">
                <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-xs text-foreground-secondary font-semibold">
                    <Link to="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <Link to="/blogs" className="hover:text-[var(--primary)] transition-colors">Blog</Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="truncate text-foreground max-w-[200px] sm:max-w-[400px]">{post.title}</span>
                </div>
            </div>

            {/* Main Article Container */}
            <article className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6">
                
                {/* Back Button */}
                <Link 
                    to="/blogs" 
                    className="inline-flex items-center text-sm font-bold text-foreground-secondary hover:text-[var(--primary)] gap-2 transition-colors mb-2"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Blog List
                </Link>

                {/* Article Header info */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-extrabold uppercase tracking-wide">
                            {post.category}
                        </span>
                        <span className="text-[10px] text-foreground-secondary flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {post.readTime}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight text-foreground">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-secondary border-y border-border py-3 mt-4">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-foreground-secondary" />
                            <span>By <strong className="text-foreground">{post.author}</strong></span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-border rounded-full hidden sm:block"></div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-foreground-secondary" />
                            <span>Published: <strong className="text-foreground">{post.publishDate}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Cover Banner Image */}
                <div className="w-full h-48 sm:h-80 rounded-2xl overflow-hidden border border-border bg-[var(--background-secondary)] shadow-sm">
                    <img 
                        src={getBlogImage(post.id)} 
                        alt="" 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Blog content section styled with rich typography */}
                <div 
                    className="prose prose-invert max-w-none text-foreground-secondary text-sm sm:text-base leading-relaxed space-y-6 pt-4"
                    style={{
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    {/* Render raw content blocks */}
                    <div 
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                        className="space-y-6 [&>h2]:text-lg [&>h2]:sm:text-xl [&>h2]:font-extrabold [&>h2]:text-foreground [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>strong]:text-foreground"
                    />
                </div>

                {/* Article tags */}
                <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-foreground-secondary font-bold flex items-center gap-1 mr-1">
                        <Tag className="w-3.5 h-3.5" /> Tags:
                    </span>
                    {post.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold bg-background-secondary border border-border px-2.5 py-0.5 rounded-full text-foreground-secondary">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Bottom Call-to-action */}
                <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3.5 mt-12">
                    <h3 className="font-extrabold text-base text-foreground">Are you a Writer?</h3>
                    <p className="text-xs text-foreground-secondary max-w-lg mx-auto leading-relaxed">
                        Publish your original stories, light novels, or web fictions on Mantra. Connect with thousands of readers, participate in contests, and withdraw instant earnings in XLM!
                    </p>
                    <div className="pt-2">
                        <Link 
                            to="/dashboard" 
                            className="inline-block py-2.5 px-6 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-md shadow-[var(--primary)]/20 hover:bg-[var(--primary)]/90 transition-all hover:translate-y-[-1px]"
                        >
                            Publish on Mantra
                        </Link>
                    </div>
                </div>

            </article>
        </div>
    );
}
