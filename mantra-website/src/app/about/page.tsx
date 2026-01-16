export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">About Mantra Novel</h1>

            <div className="prose prose-lg max-w-none">
                <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-8 text-white mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                    <p className="text-white/90">
                        Mantra Novel is a platform where stories come alive. We connect passionate authors with eager readers, creating a vibrant community around web fiction.
                    </p>
                </div>

                <h2 className="text-xl font-bold text-[var(--foreground)] mt-8 mb-4">For Readers</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed mb-4">
                    Discover thousands of original web novels across every genre imaginable. From fantasy epics to contemporary romance, from sci-fi adventures to slice-of-life stories — there's something for everyone. Best of all, it's completely free to read.
                </p>

                <h2 className="text-xl font-bold text-[var(--foreground)] mt-8 mb-4">For Authors</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed mb-4">
                    Share your stories with the world and earn from your creativity. Our ad-based revenue sharing model means you get paid for every reader who engages with your content. No subscriptions, no paywalls — just great stories reaching audiences worldwide.
                </p>

                <h2 className="text-xl font-bold text-[var(--foreground)] mt-8 mb-4">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
                        <span className="text-4xl mb-3 block">✍️</span>
                        <h3 className="font-semibold text-[var(--foreground)] mb-2">Write</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Create and publish your stories with our easy-to-use editor</p>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
                        <span className="text-4xl mb-3 block">📖</span>
                        <h3 className="font-semibold text-[var(--foreground)] mb-2">Read</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Readers enjoy your stories for free, supported by ads</p>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
                        <span className="text-4xl mb-3 block">💰</span>
                        <h3 className="font-semibold text-[var(--foreground)] mb-2">Earn</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Get paid daily based on your readers' engagement</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-[var(--foreground)] mt-8 mb-4">Join Our Community</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Whether you're a voracious reader looking for your next obsession or a writer with stories to tell, Mantra Novel is the place for you. Join thousands of creators and readers building the future of web fiction together.
                </p>
            </div>
        </div>
    );
}
