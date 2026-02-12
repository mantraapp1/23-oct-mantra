import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function RefundPolicyPage() {
    const { goBack } = useAppNavigation();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Refund & Dispute Resolution Policy</h1>
                    <p className="text-foreground-secondary text-sm">Understanding Our No-Refund Policy</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        This policy explains how refunds and disputes are handled on the Mantra Novels platform.
                        Please read this carefully before participating in our monetization program or making
                        any withdrawals.
                    </p>
                </section>

                {/* 1. Nature of Platform */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Nature of the Platform</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Mantra Novels is a <strong className="text-foreground">free-to-use platform</strong>. Important points:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Users do not pay to read novels or access content</li>
                            <li>There are no paid subscriptions, coins, or virtual currency purchases</li>
                            <li>Authors earn revenue through view-based ad revenue sharing</li>
                            <li>Earnings are paid out in Stellar Lumens (XLM) cryptocurrency</li>
                        </ul>
                    </div>
                </section>

                {/* 2. No-Refund Policy */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. No-Refund Policy for Withdrawals</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="mb-4 text-foreground">
                            <strong>Once a withdrawal has been processed and confirmed on the Stellar blockchain,
                                it is FINAL and IRREVERSIBLE.</strong>
                        </p>
                        <p className="mb-3">We cannot process refunds or reversals for:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Withdrawals sent to incorrect wallet addresses</li>
                            <li>Loss of earnings due to XLM price fluctuations</li>
                            <li>Unauthorized withdrawals (secure your account)</li>
                            <li>Failed transactions due to unfunded destination wallets</li>
                        </ul>
                        <p className="mt-4 text-sm text-muted-foreground">
                            This is due to the fundamental nature of blockchain transactions, which cannot be
                            reversed once confirmed on the network.
                        </p>
                    </div>
                </section>

                {/* 3. What We CAN Assist With */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. What We CAN Assist With</h2>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="mb-3">We will investigate and address the following issues:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Pending Withdrawals:</strong> If your withdrawal is stuck in "pending" status
                                for more than 3 business days, contact us</li>
                            <li><strong className="text-foreground">Earnings Discrepancies:</strong> If you believe your view count or earnings
                                calculation is incorrect</li>
                            <li><strong className="text-foreground">Technical Errors:</strong> System bugs that prevented proper crediting of earnings</li>
                            <li><strong className="text-foreground">Unauthorized Account Access:</strong> If someone gained access to your account
                                and initiated withdrawals</li>
                        </ul>
                    </div>
                </section>

                {/* 4. Dispute Resolution */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Dispute Resolution Process</h2>
                    <div className="space-y-4">
                        <p>If you have a dispute regarding earnings, withdrawals, or platform decisions:</p>

                        <div className="grid gap-3">
                            <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center mr-3 text-foreground-secondary font-bold shrink-0">1</div>
                                <div>
                                    <strong className="text-foreground">Contact Support</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Email <a href="mailto:support@mantra.run.place" className="text-sky-500">support@mantra.run.place</a>
                                        {' '}or use the <Link to="/contact" className="text-sky-500">Contact Form</Link>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center mr-3 text-foreground-secondary font-bold shrink-0">2</div>
                                <div>
                                    <strong className="text-foreground">Investigation</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        We will investigate within <strong>7-14 business days</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center mr-3 text-foreground-secondary font-bold shrink-0">3</div>
                                <div>
                                    <strong className="text-foreground">Grievance Escalation</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Escalate to our <Link to="/grievance-redressal" className="text-sky-500">Grievance Officer</Link>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center mr-3 text-foreground-secondary font-bold shrink-0">4</div>
                                <div>
                                    <strong className="text-foreground">Arbitration</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Binding arbitration in New Delhi, India per <Link to="/terms" className="text-sky-500">Terms of Service</Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Account Termination */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Account Termination & Earnings</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p className="mb-3">If your account is terminated:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Voluntary Deletion:</strong> Withdraw earnings before deleting</li>
                            <li><strong className="text-foreground">Policy Violation:</strong> Earnings may be forfeited for fraud</li>
                            <li><strong className="text-foreground">Minor Violations:</strong> Case-by-case withdrawal allowed</li>
                        </ul>
                    </div>
                </section>

                {/* 6. Consumer Protection Notice */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Consumer Protection Notice</h2>
                    <p className="mb-3">For users in India:</p>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>This platform operates under Indian law</li>
                        <li>Consumer complaints may be filed with Consumer Disputes Redressal Commission</li>
                        <li>Our Grievance Officer is available per IT Rules 2021</li>
                    </ul>
                </section>

                {/* 7. Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">7. Contact Us</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">For disputes, complaints, or questions:</p>
                        <p>Support: <a href="mailto:support@mantra.run.place" className="text-sky-500">support@mantra.run.place</a></p>
                        <p>Grievance: <a href="mailto:grievance@mantra.run.place" className="text-sky-500">grievance@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/creator-monetization" className="text-sky-500 hover:underline">Monetization Policy</Link>
                        <Link to="/risk-disclosure" className="text-sky-500 hover:underline">Risk Disclosure</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
