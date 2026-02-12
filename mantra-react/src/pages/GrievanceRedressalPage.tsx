import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function GrievanceRedressalPage() {
    const { goBack } = useAppNavigation();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Grievance Redressal</h1>
                    <p className="text-foreground-secondary text-sm">IT Rules 2021 Compliant</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Compliance Notice */}
                <section>
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <p className="text-sm">This policy is compliant with the <strong className="text-foreground">Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>.</p>
                    </div>
                </section>

                {/* 1. Grievance Officer */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Grievance Officer</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-2"><strong className="text-foreground">Designated Grievance Officer:</strong></p>
                        <p className="text-muted-foreground text-sm">[To be appointed before launch]</p>
                        <p className="mt-4">Email: <a href="mailto:grievance@mantra.run.place" className="text-sky-500">grievance@mantra.run.place</a></p>
                        <p className="text-sm text-muted-foreground mt-2">Response within 24 hours. Resolution within 15 days.</p>
                    </div>
                </section>

                {/* 2. Response Timeline */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Response Timeline</h2>
                    <div className="space-y-3">
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-16 shrink-0 text-sky-500 font-bold">24 hrs</div>
                            <div>
                                <strong className="text-foreground">Acknowledgment</strong>
                                <p className="text-sm text-muted-foreground">Initial response confirming receipt</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-16 shrink-0 text-sky-500 font-bold">15 days</div>
                            <div>
                                <strong className="text-foreground">Resolution</strong>
                                <p className="text-sm text-muted-foreground">Final resolution or explanation of delay</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/30">
                            <div className="w-16 shrink-0 text-yellow-500 font-bold">72 hrs</div>
                            <div>
                                <strong className="text-foreground">Urgent Cases</strong>
                                <p className="text-sm text-muted-foreground">CSAM, sexual content, nudity - action within 72 hours</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. How to File */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. How to File a Grievance</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Include the following in your grievance:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Your registered email address</li>
                            <li>Clear description of the issue</li>
                            <li>Relevant URLs or content identifiers</li>
                            <li>Supporting documentation (if any)</li>
                            <li>Your contact information</li>
                        </ul>
                    </div>
                </section>

                {/* 4. Types of Grievances */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Types of Grievances</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Content-related complaints</li>
                        <li>Account access issues</li>
                        <li>Privacy concerns</li>
                        <li>Monetization disputes</li>
                        <li>Copyright/IP claims</li>
                        <li>Moderation appeals</li>
                    </ul>
                </section>

                {/* 5. Escalation */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Escalation</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">If unsatisfied with the resolution:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>File appeal within 30 days of resolution</li>
                            <li>Approach consumer forums or courts as applicable</li>
                            <li>File complaint with IT Ministry if intermediary obligations not met</li>
                        </ul>
                    </div>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p><strong className="text-foreground">Grievance Officer Email:</strong></p>
                        <p><a href="mailto:grievance@mantra.run.place" className="text-sky-500">grievance@mantra.run.place</a></p>
                        <p className="mt-3"><strong className="text-foreground">General Support:</strong></p>
                        <p><a href="mailto:support@mantra.run.place" className="text-sky-500">support@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                        <Link to="/refund-policy" className="text-sky-500 hover:underline">Refund Policy</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
