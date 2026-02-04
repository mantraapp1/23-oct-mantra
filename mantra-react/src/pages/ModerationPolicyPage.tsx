import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ModerationPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Moderation Policy</h1>
                    <p className="text-foreground-secondary text-sm">Platform Enforcement & Appeals</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        This policy explains how we moderate content and enforce our community guidelines.
                        Our goal is to maintain a safe, respectful environment for all users.
                    </p>
                </section>

                {/* 1. Reporting */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Reporting Content</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">You can report:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Novels, chapters, reviews, or comments</li>
                            <li>User profiles</li>
                            <li>Copyright violations</li>
                        </ul>
                        <p className="mt-3 text-sm">Use the Report button on any content or email <a href="mailto:report@mantra.run.place" className="text-sky-500">report@mantra.run.place</a>.</p>
                    </div>
                </section>

                {/* 2. Automated Moderation */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Automated Moderation</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Reviews and comments receiving <strong className="text-foreground">25+ reports</strong> are automatically removed pending review.</p>
                        <p className="text-sm text-muted-foreground">This helps quickly address problematic content while we investigate.</p>
                    </div>
                </section>

                {/* 3. Human Review */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Human Review</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>All reports are reviewed by our moderation team</li>
                        <li>Novels and major content require human review before action</li>
                        <li>Review timeline: 24-72 hours for most cases</li>
                        <li>CSAM and serious violations: immediate action within 24 hours</li>
                    </ul>
                </section>

                {/* 4. Enforcement Actions */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Enforcement Actions</h2>
                    <div className="space-y-3">
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3 text-yellow-500 font-bold shrink-0">1</div>
                            <div>
                                <strong className="text-foreground">Warning</strong>
                                <p className="text-sm text-muted-foreground">First minor violation - notification sent</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-3 text-orange-500 font-bold shrink-0">2</div>
                            <div>
                                <strong className="text-foreground">Content Removal</strong>
                                <p className="text-sm text-muted-foreground">Violating content removed</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3 text-red-500 font-bold shrink-0">3</div>
                            <div>
                                <strong className="text-foreground">Temporary Suspension</strong>
                                <p className="text-sm text-muted-foreground">7-30 days for repeated violations</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-red-500/10 rounded-2xl border border-red-500/30">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3 text-red-500 font-bold shrink-0">4</div>
                            <div>
                                <strong className="text-foreground">Permanent Ban</strong>
                                <p className="text-sm text-muted-foreground">Severe or continued violations</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Appeals */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Appeals Process</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">You may appeal moderation decisions:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Submit appeal within <strong className="text-foreground">30 days</strong> of action</li>
                            <li>Email: <a href="mailto:appeals@mantra.run.place" className="text-sky-500">appeals@mantra.run.place</a></li>
                            <li>Include your account email and explanation</li>
                            <li>Appeals reviewed within 14 days</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">CSAM violations are not appealable.</p>
                    </div>
                </section>

                {/* 6. Legal Cooperation */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Legal Cooperation</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p className="mb-3">We cooperate with law enforcement for:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>CSAM (reported to NCMEC and local authorities)</li>
                            <li>Threats of violence</li>
                            <li>Court orders and legal requests</li>
                        </ul>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/content-policy" className="text-sky-500 hover:underline">Content Guidelines</Link>
                        <Link to="/acceptable-use" className="text-sky-500 hover:underline">Acceptable Use</Link>
                        <Link to="/child-safety" className="text-sky-500 hover:underline">Child Safety</Link>
                        <Link to="/grievance-redressal" className="text-sky-500 hover:underline">Grievance Redressal</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
