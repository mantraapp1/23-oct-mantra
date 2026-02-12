import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function AcceptableUsePage() {
    const { goBack } = useAppNavigation();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => goBack()} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Acceptable Use Policy</h1>
                    <p className="text-foreground-secondary text-sm">Platform Usage Rules</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        This policy outlines acceptable and prohibited uses of Mantra Novels.
                        Violations may result in account suspension or termination.
                    </p>
                </section>

                {/* 1. Permitted Uses */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Permitted Uses</h2>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Reading novels and engaging with content</li>
                            <li>Writing and publishing original fiction</li>
                            <li>Commenting, reviewing, and community participation</li>
                            <li>Sharing content via Platform features</li>
                            <li>Participating in the monetization program (18+)</li>
                        </ul>
                    </div>
                </section>

                {/* 2. Prohibited Activities */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Prohibited Activities</h2>
                    <div className="space-y-4">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-3">Account Abuse</h3>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Creating multiple accounts</li>
                                <li>Sharing account credentials</li>
                                <li>Using another person's account</li>
                                <li>Providing false registration information</li>
                            </ul>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-3">View Manipulation</h3>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Using bots or scripts to inflate views</li>
                                <li>Self-clicking or refresh abuse</li>
                                <li>Coordinated fake engagement</li>
                                <li>Any manipulation of the monetization system</li>
                            </ul>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-3">Security Violations</h3>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Attempting to access others' accounts</li>
                                <li>Probing for security vulnerabilities</li>
                                <li>Circumventing access controls</li>
                                <li>Reverse engineering the Platform</li>
                            </ul>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-3">Spam & Abuse</h3>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Posting repetitive or low-quality content</li>
                                <li>Unsolicited promotion or advertising</li>
                                <li>Mass commenting or review bombing</li>
                                <li>Harassment or targeted abuse</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Enforcement */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Enforcement</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Violations may result in:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Warning or content removal</li>
                            <li>Temporary suspension (7-30 days)</li>
                            <li>Permanent account ban</li>
                            <li>Forfeiture of earnings (for monetization abuse)</li>
                            <li>Legal action (for serious violations)</li>
                        </ul>
                    </div>
                </section>

                {/* 4. Reporting */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Reporting Violations</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Report policy violations:</p>
                        <p className="mt-2">Email: <a href="mailto:report@mantra.run.place" className="text-sky-500">report@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/content-policy" className="text-sky-500 hover:underline">Content Guidelines</Link>
                        <Link to="/moderation-policy" className="text-sky-500 hover:underline">Moderation Policy</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
