import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-[var(--background-secondary)] border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3 group mb-4">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <img
                                    src="/logo.jpeg"
                                    alt="Mantra Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xl md:text-2xl font-serif font-bold text-sky-500 leading-none tracking-tight italic">
                                    Mantra
                                </span>
                                <span className="text-[0.6rem] md:text-[0.65rem] font-semibold text-sky-600/80 uppercase tracking-widest leading-none mt-0.5 ml-1">
                                    Novel
                                </span>
                            </div>
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
                                <Link to="/" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/ranking" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Rankings
                                </Link>
                            </li>
                            <li>
                                <Link to="/genre" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Genres
                                </Link>
                            </li>
                            <li>
                                <Link to="/editors-choice" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
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
                                <Link to="/author/dashboard" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/wallet" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Earnings
                                </Link>
                            </li>
                            <li>
                                <Link to="/creator-monetization" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Monetization
                                </Link>
                            </li>
                            <li>
                                <Link to="/content-policy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
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
                                <Link to="/faq" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/report" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Report Issue
                                </Link>
                            </li>
                            <li>
                                <Link to="/grievance-redressal" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Grievance Redressal
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-[var(--foreground)] mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/terms" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/cookies" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/dmca" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    DMCA
                                </Link>
                            </li>
                            <li>
                                <Link to="/child-safety" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Child Safety
                                </Link>
                            </li>
                            <li>
                                <Link to="/data-retention" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                                    Data Retention
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
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                        <Link to="/acceptable-use" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Acceptable Use
                        </Link>
                        <Link to="/moderation-policy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Moderation
                        </Link>
                        <Link to="/refund-policy" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Refund Policy
                        </Link>
                        <Link to="/risk-disclosure" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                            Risk Disclosure
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
