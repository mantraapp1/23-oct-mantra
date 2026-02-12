import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function ChildSafetyPage() {
    const { goBack } = useAppNavigation();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Child Safety & Age Restrictions</h1>
                    <p className="text-foreground-secondary text-sm">POCSO Act Compliant</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Zero Tolerance Notice */}
                <section>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="font-bold text-red-500 mb-2">ZERO TOLERANCE FOR CSAM</p>
                        <p className="text-sm">We have zero tolerance for Child Sexual Abuse Material (CSAM) or any sexual content involving minors.
                            Violations are immediately reported to NCMEC, law enforcement, and Indian authorities under the POCSO Act, 2012.</p>
                    </div>
                </section>

                {/* 1. Age Requirements */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Age Requirements</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <span className="w-20 shrink-0 font-semibold text-foreground">13+</span>
                                <span>Minimum age for platform access</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-20 shrink-0 font-semibold text-foreground">18+</span>
                                <span>Required for Mature (M) content</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-20 shrink-0 font-semibold text-foreground">18+</span>
                                <span>Required for monetization program</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 2. Age Verification */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Age Verification</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Date of birth required during registration</li>
                        <li>Age confirmation required for mature content access</li>
                        <li>Accounts falsely claiming adult age may be terminated</li>
                    </ul>
                </section>

                {/* 3. Parental Consent */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Parental Consent (DPDP Act)</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Under the DPDP Act 2023:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Processing children's data requires verifiable parental consent</li>
                            <li>Parents may request deletion of their child's data</li>
                            <li>Parents may review data collected about their child</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">Contact <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a> for parental requests.</p>
                    </div>
                </section>

                {/* 4. Content Restrictions */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Content Restrictions for Minors</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Users under 18 cannot access:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Novels rated Mature (M) / 18+</li>
                            <li>Explicit sexual content</li>
                            <li>Extreme violence or gore</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">Mature content is hidden behind age gates.</p>
                    </div>
                </section>

                {/* 5. POCSO Compliance */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. POCSO Act 2012 Compliance</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p className="mb-3">We comply with India's POCSO Act:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Immediate reporting to authorities upon CSAM detection</li>
                            <li>Preservation of evidence for law enforcement</li>
                            <li>Cooperation with investigations</li>
                            <li>No bail for CSAM offenses under POCSO</li>
                        </ul>
                    </div>
                </section>

                {/* 6. Reporting */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Reporting Child Safety Concerns</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Report child safety concerns immediately:</p>
                        <p>Email: <a href="mailto:safety@mantra.run.place" className="text-sky-500">safety@mantra.run.place</a></p>
                        <p className="mt-2">Use the Report button for content involving minors.</p>
                        <p className="text-sm text-muted-foreground mt-3">All child safety reports are prioritized and reviewed within 24 hours.</p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/content-policy" className="text-sky-500 hover:underline">Content Guidelines</Link>
                        <Link to="/moderation-policy" className="text-sky-500 hover:underline">Moderation Policy</Link>
                        <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
