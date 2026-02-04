import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function RiskDisclosurePage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Risk Disclosure</h1>
                    <p className="text-foreground-secondary text-sm">Cryptocurrency & Earnings Risks</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Warning Notice */}
                <section>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="font-bold text-red-500 mb-2">⚠️ IMPORTANT RISK WARNING</p>
                        <p className="text-sm">Cryptocurrency investments carry significant risk. You may lose some or all of the value of your earnings.
                            Read this disclosure carefully before participating in the monetization program.</p>
                    </div>
                </section>

                {/* 1. Cryptocurrency Volatility */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Cryptocurrency Price Volatility</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Stellar Lumens (XLM) is subject to extreme price volatility:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Value can change significantly within hours or days</li>
                            <li>No guaranteed minimum fiat (INR/USD) value</li>
                            <li>Historical performance is not indicative of future results</li>
                            <li>Once withdrawn, we have no control over XLM value</li>
                        </ul>
                    </div>
                </section>

                {/* 2. Blockchain Risks */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Blockchain & Technical Risks</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Irreversibility:</strong> Blockchain transactions cannot be reversed</li>
                            <li><strong className="text-foreground">Wrong Address:</strong> Funds sent to incorrect addresses are lost permanently</li>
                            <li><strong className="text-foreground">Network Issues:</strong> Stellar network outages may delay transactions</li>
                            <li><strong className="text-foreground">Wallet Security:</strong> You are responsible for securing your wallet</li>
                        </ul>
                    </div>
                </section>

                {/* 3. Tax Obligations */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Tax Obligations (India)</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p className="mb-3">Virtual Digital Asset (VDA) taxation in India:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">30% flat tax</strong> on gains from crypto transactions</li>
                            <li><strong className="text-foreground">1% TDS</strong> on transfers above ₹10,000</li>
                            <li>No deduction for losses against other income</li>
                            <li>You must report crypto earnings as taxable income</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">Consult a tax professional for personalized advice.</p>
                    </div>
                </section>

                {/* 4. Regulatory Risks */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Regulatory Risks</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Cryptocurrency regulations may change without notice</li>
                            <li>Future laws may restrict or ban crypto transactions</li>
                            <li>Platform may need to modify payout methods due to regulations</li>
                            <li>Access may be restricted in certain jurisdictions</li>
                        </ul>
                    </div>
                </section>

                {/* 5. Earnings Not Guaranteed */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Earnings Not Guaranteed</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <ul className="list-disc ml-6 space-y-2">
                            <li>No minimum earnings are guaranteed</li>
                            <li>Ad revenue depends on reader engagement</li>
                            <li>Revenue rates may change based on ad market conditions</li>
                            <li>Past earnings do not guarantee future results</li>
                        </ul>
                    </div>
                </section>

                {/* 6. Limitation of Liability */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Limitation of Liability</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border text-sm">
                        <p className="uppercase mb-3">MANTRA NOVELS IS NOT LIABLE FOR:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Loss of earnings value due to crypto price changes</li>
                            <li>Tax consequences of your earnings</li>
                            <li>Funds lost due to user error (wrong wallet address)</li>
                            <li>Regulatory actions affecting cryptocurrency</li>
                            <li>Third-party wallet or exchange failures</li>
                        </ul>
                    </div>
                </section>

                {/* Acknowledgment */}
                <section>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="text-sm">By participating in the monetization program and withdrawing earnings,
                            you acknowledge that you have read, understood, and accept all risks described in this disclosure.</p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/creator-monetization" className="text-sky-500 hover:underline">Monetization Policy</Link>
                        <Link to="/refund-policy" className="text-sky-500 hover:underline">Refund Policy</Link>
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
