import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
                    <p className="text-foreground-secondary text-sm">Last Updated: January 30, 2026</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        Welcome to Mantra Novels ("Platform", "we", "us", or "our"). These Terms of Service ("Terms")
                        govern your access to and use of our website, mobile application, and related services.
                        By accessing or using Mantra Novels, you agree to be bound by these Terms.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mt-4">
                        <p className="text-sm"><strong className="text-foreground">Important:</strong> If you do not agree to these Terms,
                            please do not use our Platform. These Terms constitute a legally binding agreement.</p>
                    </div>
                </section>

                {/* 1. Eligibility */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Eligibility</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
                        <p>To use Mantra Novels, you must:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Be at least <strong className="text-foreground">13 years of age</strong> for general access</li>
                            <li>Be at least <strong className="text-foreground">18 years of age</strong> to access Mature (18+) content</li>
                            <li>Be at least <strong className="text-foreground">18 years of age</strong> to participate in the monetization program</li>
                            <li>Have the legal capacity to enter into a binding agreement</li>
                            <li>Not be prohibited from using the service under applicable laws</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            For users aged 13-17, parental consent may be required as per applicable laws.
                        </p>
                    </div>
                </section>

                {/* 2. Account Registration */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Account Registration & Security</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>You must provide accurate, complete, and current information during registration</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                        <li>You agree to notify us immediately of any unauthorized access to your account</li>
                        <li>One account per person; multiple accounts are prohibited</li>
                        <li>We reserve the right to suspend or terminate accounts for violations</li>
                    </ul>
                </section>

                {/* 3. User Content */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. User Content</h2>
                    <div className="space-y-4">
                        <p>You retain ownership of content you create. By publishing on our Platform, you grant us:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>A worldwide, non-exclusive, royalty-free license to host, display, and distribute your content</li>
                            <li>The right to use your content for Platform promotion</li>
                            <li>The ability to modify content for technical purposes (formatting, display optimization)</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            See our <Link to="/content-policy" className="text-sky-500">Content Guidelines</Link> for what is allowed.
                        </p>
                    </div>
                </section>

                {/* 4. Monetization */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Creator Monetization</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
                        <p>Authors may earn revenue through our view-based monetization program:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Earnings are based on chapter views and ad revenue</li>
                            <li>Payouts are made in <strong className="text-foreground">Stellar Lumens (XLM)</strong> cryptocurrency</li>
                            <li>Minimum withdrawal: <strong className="text-foreground">10 XLM</strong></li>
                            <li>You are responsible for tax compliance in your jurisdiction</li>
                        </ul>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-3">
                            <p className="text-sm"><strong className="text-red-500">Warning:</strong> XLM is a cryptocurrency subject to
                                price volatility. We are not responsible for value changes after payout.
                                See <Link to="/risk-disclosure" className="text-sky-500">Risk Disclosure</Link>.</p>
                        </div>
                    </div>
                </section>

                {/* 5. Prohibited Activities */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Prohibited Activities</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="mb-3">You agree NOT to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Violate any laws or third-party rights</li>
                            <li>Post plagiarized or infringing content</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Manipulate views, ratings, or the monetization system</li>
                            <li>Use bots, scripts, or automated tools without authorization</li>
                            <li>Attempt to bypass security measures</li>
                            <li>Post sexually explicit content involving minors</li>
                            <li>Engage in fraud or deceptive practices</li>
                        </ul>
                    </div>
                </section>

                {/* 6. Intellectual Property */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Intellectual Property</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>The Platform, its design, features, and functionality are owned by Mantra Novels</li>
                        <li>Our trademarks, logos, and branding may not be used without permission</li>
                        <li>We respect intellectual property rights and respond to DMCA notices</li>
                    </ul>
                    <p className="mt-3 text-sm">See our <Link to="/dmca" className="text-sky-500">DMCA Policy</Link> for copyright claims.</p>
                </section>

                {/* 7. Termination */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">7. Termination</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>You may terminate your account at any time via Settings</li>
                        <li>We may suspend or terminate accounts for Terms violations</li>
                        <li>Upon termination, your right to use the Platform ceases immediately</li>
                        <li>Certain provisions survive termination (liability, disputes, IP rights)</li>
                    </ul>
                </section>

                {/* 8. Disclaimers */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">8. Disclaimers</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border text-sm">
                        <p className="uppercase mb-3">THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
                        <p>We do not guarantee:</p>
                        <ul className="list-disc ml-6 space-y-1 mt-2">
                            <li>Uninterrupted or error-free service</li>
                            <li>Accuracy of user-generated content</li>
                            <li>Any minimum earnings for authors</li>
                            <li>Cryptocurrency value stability</li>
                        </ul>
                    </div>
                </section>

                {/* 9. Limitation of Liability */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">9. Limitation of Liability</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border text-sm">
                        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, MANTRA NOVELS SHALL NOT BE LIABLE FOR:</p>
                        <ul className="list-disc ml-6 space-y-1 mt-2">
                            <li>Indirect, incidental, special, or consequential damages</li>
                            <li>Loss of profits, data, or goodwill</li>
                            <li>Cryptocurrency value fluctuations</li>
                            <li>Third-party actions or content</li>
                        </ul>
                        <p className="mt-3">Our total liability shall not exceed ₹10,000 or the amount you paid us in the past 12 months, whichever is greater.</p>
                    </div>
                </section>

                {/* 10. Dispute Resolution */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">10. Dispute Resolution & Governing Law</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
                        <p><strong className="text-foreground">Governing Law:</strong> These Terms are governed by the laws of India.</p>
                        <p><strong className="text-foreground">Jurisdiction:</strong> Courts of New Delhi, India have exclusive jurisdiction.</p>
                        <p><strong className="text-foreground">Arbitration:</strong> Disputes shall be resolved through binding arbitration
                            in New Delhi under the Arbitration and Conciliation Act, 1996.</p>
                        <p className="text-sm text-muted-foreground">
                            Before initiating arbitration, you agree to attempt resolution through our
                            <Link to="/grievance-redressal" className="text-sky-500 ml-1">Grievance Officer</Link>.
                        </p>
                    </div>
                </section>

                {/* 11. Changes */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">11. Changes to Terms</h2>
                    <p>We may update these Terms from time to time. Material changes will be notified via email or
                        Platform notification. Continued use after changes constitutes acceptance.</p>
                </section>

                {/* 12. Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">12. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Questions about these Terms:</p>
                        <p className="mt-2">Email: <a href="mailto:legal@mantra.run.place" className="text-sky-500">legal@mantra.run.place</a></p>
                        <p className="mt-2">
                            <Link to="/contact" className="text-sky-500">Contact Form</Link> |
                            <Link to="/grievance-redressal" className="text-sky-500 ml-2">Grievance Redressal</Link>
                        </p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                        <Link to="/content-policy" className="text-sky-500 hover:underline">Content Guidelines</Link>
                        <Link to="/acceptable-use" className="text-sky-500 hover:underline">Acceptable Use</Link>
                        <Link to="/creator-monetization" className="text-sky-500 hover:underline">Monetization</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
