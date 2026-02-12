import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function CookiePolicyPage() {
    const { goBack } = useAppNavigation();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Cookie Policy</h1>
                    <p className="text-foreground-secondary text-sm">Last Updated: January 30, 2026</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        This Cookie Policy explains how Mantra Novels uses cookies and similar technologies
                        when you use our website and mobile application.
                    </p>
                </section>

                {/* 1. What Are Cookies */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. What Are Cookies?</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Cookies are small text files stored on your device when you visit a website. They help:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-3">
                            <li>Remember your preferences and settings</li>
                            <li>Keep you signed in</li>
                            <li>Understand how you use our Platform</li>
                            <li>Improve your experience</li>
                        </ul>
                    </div>
                </section>

                {/* 2. Types of Cookies */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                            <p className="text-sm">Required for the Platform to function. Cannot be disabled.</p>
                            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                                <li>Authentication and session management</li>
                                <li>Security features</li>
                                <li>Load balancing</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Functional Cookies</h3>
                            <p className="text-sm">Remember your preferences.</p>
                            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                                <li>Reading theme (dark/light/sepia)</li>
                                <li>Font size preferences</li>
                                <li>Language settings</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                            <p className="text-sm">Help us understand usage patterns.</p>
                            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                                <li>Page views and navigation</li>
                                <li>Feature usage</li>
                                <li>Error tracking</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Advertising Cookies</h3>
                            <p className="text-sm">Used to show relevant ads and measure ad performance.</p>
                            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                                <li>Ad personalization</li>
                                <li>Conversion tracking</li>
                                <li>Ad frequency capping</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Third-Party Cookies */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Third-Party Cookies</h2>
                    <p className="mb-3">We use services that may set their own cookies:</p>
                    <ul className="list-disc ml-6 space-y-2">
                        <li><strong className="text-foreground">Supabase:</strong> Authentication</li>
                        <li><strong className="text-foreground">Google Analytics:</strong> Usage analytics</li>
                        <li><strong className="text-foreground">Ad Networks:</strong> Advertising</li>
                    </ul>
                </section>

                {/* 4. Managing Cookies */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Managing Cookies</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">You can control cookies through:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
                            <li><strong className="text-foreground">Platform Settings:</strong> Some preferences can be managed in Settings</li>
                            <li><strong className="text-foreground">Ad Settings:</strong> Opt-out of personalized ads through ad network settings</li>
                        </ul>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
                            <p className="text-sm"><strong className="text-foreground">Note:</strong> Disabling essential cookies may prevent the Platform from functioning properly.</p>
                        </div>
                    </div>
                </section>

                {/* 5. Cookie Retention */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Cookie Retention</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li><strong className="text-foreground">Session Cookies:</strong> Deleted when you close your browser</li>
                        <li><strong className="text-foreground">Persistent Cookies:</strong> Remain until expiry or deletion (typically 1-12 months)</li>
                    </ul>
                </section>

                {/* 6. Updates */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Updates to This Policy</h2>
                    <p>We may update this Cookie Policy from time to time. Check the "Last Updated" date at the top of this page.</p>
                </section>

                {/* 7. Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">7. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Questions about cookies: <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
