import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ContentPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Content Guidelines</h1>
                    <p className="text-foreground-secondary text-sm">Community Rules & Content Policy</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        These guidelines help maintain a safe and welcoming environment for all readers and writers.
                        Violations may result in content removal or account suspension.
                    </p>
                </section>

                {/* Content Ratings */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Content Ratings</h2>
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <h3 className="font-semibold text-emerald-500 mb-2">Everyone (E)</h3>
                            <p className="text-sm">Suitable for all ages. No explicit content, mild conflict only.</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-yellow-500 mb-2">Teen (T)</h3>
                            <p className="text-sm">For ages 13+. May contain mild violence, romance, mature themes.</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-red-500 mb-2">Mature (M)</h3>
                            <p className="text-sm">For ages 18+ only. May contain explicit content, violence, adult themes.</p>
                        </div>
                    </div>
                </section>

                {/* Allowed Content */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Allowed Content</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Original fiction in any genre</li>
                            <li>Fan fiction (with appropriate disclaimers)</li>
                            <li>Poetry and short stories</li>
                            <li>Mature content with proper rating (18+ only)</li>
                            <li>AI-assisted content (must be disclosed)</li>
                        </ul>
                    </div>
                </section>

                {/* Prohibited Content */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Prohibited Content</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="font-semibold text-red-500 mb-3">The following is strictly prohibited:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">CSAM:</strong> Any sexual content involving minors (zero tolerance)</li>
                            <li><strong className="text-foreground">Real Persons:</strong> Sexual/violent content about real people</li>
                            <li><strong className="text-foreground">Incitement:</strong> Content promoting violence, terrorism, hate</li>
                            <li><strong className="text-foreground">Illegal Activities:</strong> Instructions for illegal acts</li>
                            <li><strong className="text-foreground">Plagiarism:</strong> Copied content without permission</li>
                            <li><strong className="text-foreground">Spam:</strong> Low-quality, auto-generated, or duplicate content</li>
                            <li><strong className="text-foreground">Doxxing:</strong> Sharing private information</li>
                        </ul>
                    </div>
                </section>

                {/* AI Content */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">AI-Generated Content</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">AI-assisted writing is allowed with requirements:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Must be disclosed in synopsis or author notes</li>
                            <li>Must be reviewed and edited by the author</li>
                            <li>Author remains responsible for content compliance</li>
                            <li>Fully AI-generated content without human review is not allowed</li>
                        </ul>
                    </div>
                </section>

                {/* Enforcement */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Enforcement</h2>
                    <div className="space-y-3">
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3 text-yellow-500 font-bold shrink-0">1</div>
                            <div>
                                <strong className="text-foreground">Warning</strong>
                                <p className="text-sm text-muted-foreground">First minor violation</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-3 text-orange-500 font-bold shrink-0">2</div>
                            <div>
                                <strong className="text-foreground">Content Removal</strong>
                                <p className="text-sm text-muted-foreground">Repeated or moderate violations</p>
                            </div>
                        </div>
                        <div className="flex items-start p-4 bg-card rounded-2xl border border-border">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3 text-red-500 font-bold shrink-0">3</div>
                            <div>
                                <strong className="text-foreground">Suspension/Ban</strong>
                                <p className="text-sm text-muted-foreground">Severe or repeated violations</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm">CSAM and serious violations result in immediate permanent ban and legal reporting.</p>
                </section>

                {/* Reporting */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">Reporting Violations</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Use the Report button on any content or contact:</p>
                        <p className="mt-2">Email: <a href="mailto:report@mantra.run.place" className="text-sky-500">report@mantra.run.place</a></p>
                        <p className="mt-2 text-sm text-muted-foreground">We review all reports within 24-48 hours.</p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/moderation-policy" className="text-sky-500 hover:underline">Moderation Policy</Link>
                        <Link to="/acceptable-use" className="text-sky-500 hover:underline">Acceptable Use</Link>
                        <Link to="/child-safety" className="text-sky-500 hover:underline">Child Safety</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
