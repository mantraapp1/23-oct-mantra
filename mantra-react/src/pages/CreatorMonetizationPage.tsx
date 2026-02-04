import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function CreatorMonetizationPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Creator Monetization Policy</h1>
                    <p className="text-foreground-secondary text-sm">How Authors Earn on Mantra Novels</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        Mantra Novels shares ad revenue with authors based on reader engagement.
                        This policy explains how earnings are calculated and paid.
                    </p>
                </section>

                {/* 1. Eligibility */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Eligibility</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">To participate in the monetization program:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Must be at least <strong className="text-foreground">18 years old</strong></li>
                            <li>Must have a verified account with valid email</li>
                            <li>Must agree to these monetization terms</li>
                            <li>Must comply with all content policies</li>
                        </ul>
                    </div>
                </section>

                {/* 2. How Earnings Work */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. How Earnings Work</h2>
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">View-Based Revenue</h3>
                            <p className="text-sm">Authors earn based on the total views their chapters receive. Revenue is generated from ads shown to readers.</p>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Chapter Access Tiers</h3>
                            <ul className="list-disc ml-6 space-y-2 text-sm">
                                <li><strong className="text-foreground">Chapters 1-7:</strong> Free access (0 wait)</li>
                                <li><strong className="text-foreground">Chapters 8-30:</strong> 3-hour wait OR unlock</li>
                                <li><strong className="text-foreground">Chapters 31+:</strong> 24-hour wait OR unlock</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Unlock Duration</h3>
                            <p className="text-sm">Unlocked chapters remain accessible for <strong className="text-foreground">72 hours</strong>.</p>
                        </div>
                    </div>
                </section>

                {/* 3. Payouts */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Payouts</h2>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <h3 className="font-semibold text-foreground mb-3">Stellar Lumens (XLM)</h3>
                        <p className="mb-3">All payouts are made in XLM cryptocurrency:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Minimum Withdrawal:</strong> 10 XLM</li>
                            <li><strong className="text-foreground">Processing Time:</strong> Usually instant (blockchain dependent)</li>
                            <li><strong className="text-foreground">Fees:</strong> No platform fees (network fees apply)</li>
                        </ul>
                        <p className="mt-3 text-sm">You need a Stellar wallet (Lobstr, Solar, etc.) to receive payments.</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mt-4">
                        <p className="text-sm"><strong className="text-red-500">Warning:</strong> XLM is a cryptocurrency subject to price volatility.
                            We do not guarantee any minimum fiat value. See <Link to="/risk-disclosure" className="text-sky-500">Risk Disclosure</Link>.</p>
                    </div>
                </section>

                {/* 4. Tax Obligations */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Tax Obligations</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p className="mb-3">You are responsible for tax compliance in your jurisdiction.</p>
                        <div className="mt-3">
                            <h4 className="font-semibold text-foreground">India (VDA Tax):</h4>
                            <ul className="list-disc ml-6 space-y-1 text-sm mt-2">
                                <li><strong>30% flat tax</strong> on crypto gains</li>
                                <li><strong>1% TDS</strong> on transfers above ₹10,000</li>
                                <li>Report as income from Virtual Digital Assets</li>
                            </ul>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">Consult a tax professional for advice.</p>
                    </div>
                </section>

                {/* 5. Fraud Prevention */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Fraud Prevention</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="mb-3 font-semibold text-foreground">Prohibited Activities:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Artificially inflating views (bots, self-clicking)</li>
                            <li>Creating multiple accounts for fake engagement</li>
                            <li>Any manipulation of the earnings system</li>
                        </ul>
                        <p className="mt-3 text-sm"><strong className="text-red-500">Penalty:</strong> Immediate ban and forfeiture of all earnings.</p>
                    </div>
                </section>

                {/* 6. Account Termination */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Account Termination</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Withdraw pending earnings before voluntary account deletion</li>
                        <li>Fraudulent activity results in earnings forfeiture</li>
                        <li>Suspended accounts: case-by-case review</li>
                    </ul>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">7. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Earnings questions: <a href="mailto:earnings@mantra.run.place" className="text-sky-500">earnings@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/risk-disclosure" className="text-sky-500 hover:underline">Risk Disclosure</Link>
                        <Link to="/refund-policy" className="text-sky-500 hover:underline">Refund Policy</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
