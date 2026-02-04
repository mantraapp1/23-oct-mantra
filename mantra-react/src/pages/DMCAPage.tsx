import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function DMCAPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">DMCA & Copyright Policy</h1>
                    <p className="text-foreground-secondary text-sm">Copyright Infringement Claims</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        Mantra Novels respects intellectual property rights and responds to valid copyright infringement claims
                        under the Digital Millennium Copyright Act (DMCA) and the Indian Copyright Act, 1957.
                    </p>
                </section>

                {/* 1. Filing a Takedown Notice */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Filing a Takedown Notice</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">To report copyright infringement, send a notice including:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Your signature (physical or electronic)</li>
                            <li>Identification of the copyrighted work</li>
                            <li>URL of the infringing content on our Platform</li>
                            <li>Your contact information (name, address, email, phone)</li>
                            <li>A statement that you believe the use is unauthorized</li>
                            <li>A statement under penalty of perjury that the information is accurate</li>
                        </ul>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border mt-4">
                        <h3 className="font-semibold text-foreground mb-2">Send Notices To:</h3>
                        <p>Email: <a href="mailto:dmca@mantra.run.place" className="text-sky-500">dmca@mantra.run.place</a></p>
                        <p className="text-sm text-muted-foreground mt-2">Subject line: "DMCA Takedown Notice"</p>
                    </div>
                </section>

                {/* 2. Counter-Notification */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Counter-Notification</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">If you believe content was removed in error, you may file a counter-notification including:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Your signature</li>
                            <li>Identification of the removed content and its location</li>
                            <li>A statement under penalty of perjury that removal was a mistake</li>
                            <li>Your contact information</li>
                            <li>Consent to jurisdiction in New Delhi, India</li>
                        </ul>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Content may be restored 10-14 business days after receiving a valid counter-notification.
                        </p>
                    </div>
                </section>

                {/* 3. Repeat Infringer Policy */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Repeat Infringer Policy</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p className="mb-3">We terminate accounts of repeat infringers:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">First Strike:</strong> Warning and content removal</li>
                            <li><strong className="text-foreground">Second Strike:</strong> 14-day suspension</li>
                            <li><strong className="text-foreground">Third Strike:</strong> Permanent account termination</li>
                        </ul>
                        <p className="mt-3 text-sm">Strikes expire after 12 months of good standing.</p>
                    </div>
                </section>

                {/* 4. Indian Copyright Act */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Indian Copyright Act, 1957</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">For users in India, we also comply with the Indian Copyright Act:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>We act as an intermediary under the IT Act, 2000</li>
                            <li>We respond to takedown notices within 36 hours</li>
                            <li>We cooperate with law enforcement as required</li>
                        </ul>
                    </div>
                </section>

                {/* 5. False Claims */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. False Claims Warning</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <p><strong className="text-foreground">Warning:</strong> Filing false DMCA claims is illegal and may result in:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-3">
                            <li>Liability for damages and attorney fees</li>
                            <li>Criminal penalties for perjury</li>
                            <li>Termination of your account on our Platform</li>
                        </ul>
                    </div>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p><strong className="text-foreground">DMCA Agent:</strong></p>
                        <p className="mt-2">Email: <a href="mailto:dmca@mantra.run.place" className="text-sky-500">dmca@mantra.run.place</a></p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/content-policy" className="text-sky-500 hover:underline">Content Guidelines</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
