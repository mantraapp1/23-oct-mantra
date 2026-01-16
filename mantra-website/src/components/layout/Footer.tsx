import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[var(--background-secondary)] border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <span className="text-xl font-bold text-[var(--foreground)]">
                                Mantra
                            </span>
                        </Link>
                        <p className="text-[var(--foreground-secondary)] text-sm">
                            Your destination for captivating stories from talented authors around the world.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="font-semibold text-[var(--foreground)] mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/ranking" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Rankings
                                </Link>
                            </li>
                            <li>
                                <Link href="/genre" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Genres
                                </Link>
                            </li>
                            <li>
                                <Link href="/editors-choice" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Editor's Choice
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Authors */}
                    <div>
                        <h3 className="font-semibold text-[var(--foreground)] mb-4">For Authors</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/author/dashboard" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/wallet" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Earnings
                                </Link>
                            </li>
                            <li>
                                <Link href="/content-policy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Content Guidelines
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-[var(--foreground)] mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/faq" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/report" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Report Issue
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[var(--foreground-secondary)] text-sm">
                        © {new Date().getFullYear()} Mantra Novel. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href="/terms" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Privacy
                        </Link>
                        <Link href="/cookies" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Cookies
                        </Link>
                        <Link href="/dmca" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            DMCA
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
