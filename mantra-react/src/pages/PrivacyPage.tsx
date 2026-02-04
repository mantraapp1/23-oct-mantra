import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
                    <p className="text-foreground-secondary text-sm">DPDP Act 2023 Compliant • Last Updated: January 30, 2026</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* DPDP Notice */}
                <section>
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <p className="text-sm">This Privacy Policy complies with the <strong className="text-foreground">Digital Personal Data Protection Act, 2023</strong> (DPDP Act) of India.</p>
                    </div>
                </section>

                {/* 1. Data Fiduciary */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Data Fiduciary Information</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p><strong className="text-foreground">Mantra Novels</strong> is the Data Fiduciary for your personal data.</p>
                        <p className="mt-2">Email: <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></p>
                        <p className="text-sm text-muted-foreground mt-2">Our Grievance Officer details are available at <Link to="/grievance-redressal" className="text-sky-500">Grievance Redressal</Link>.</p>
                    </div>
                </section>

                {/* 2. Data We Collect */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Personal Data We Collect</h2>
                    <div className="space-y-4">
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-3">Account Information</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Username, email address, password (hashed)</li>
                                <li>Date of birth (for age verification)</li>
                                <li>Profile picture (optional)</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-3">Usage Data</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Reading history and preferences</li>
                                <li>Content you create (novels, chapters, comments)</li>
                                <li>Device information and IP address</li>
                            </ul>
                        </div>
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <h3 className="font-semibold text-foreground mb-3">Payment Data (Authors)</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Stellar wallet addresses</li>
                                <li>Transaction history</li>
                                <li>Earnings records</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Purpose of Processing */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. Purpose of Processing</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li><strong className="text-foreground">Service Provision:</strong> To provide and improve our Platform</li>
                        <li><strong className="text-foreground">Account Management:</strong> To create and manage your account</li>
                        <li><strong className="text-foreground">Payments:</strong> To process creator payouts</li>
                        <li><strong className="text-foreground">Safety:</strong> To maintain platform safety and security</li>
                        <li><strong className="text-foreground">Legal Compliance:</strong> To comply with applicable laws</li>
                    </ul>
                </section>

                {/* 4. Data Principal Rights */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Your Rights (Data Principal Rights)</h2>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="mb-3">Under the DPDP Act 2023, you have the right to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong className="text-foreground">Access:</strong> Request a summary of your personal data</li>
                            <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate data</li>
                            <li><strong className="text-foreground">Erasure:</strong> Request deletion of your personal data</li>
                            <li><strong className="text-foreground">Grievance Redressal:</strong> File complaints with our Grievance Officer</li>
                            <li><strong className="text-foreground">Nominate:</strong> Nominate another person to exercise rights on your behalf</li>
                        </ul>
                        <p className="mt-4 text-sm">Exercise these rights via <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></p>
                    </div>
                </section>

                {/* 5. Consent */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Consent</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>By using our Platform, you consent to data processing as described</li>
                        <li>You may withdraw consent at any time (may affect service access)</li>
                        <li>Consent withdrawal does not affect lawfulness of prior processing</li>
                    </ul>
                </section>

                {/* 6. Children's Privacy */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">6. Children's Privacy</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Minimum age for platform use: <strong className="text-foreground">13 years</strong></li>
                            <li>Mature content requires age <strong className="text-foreground">18+</strong></li>
                            <li>We do not knowingly collect data from children under 13</li>
                            <li>Parents may request deletion of minor's data</li>
                        </ul>
                    </div>
                </section>

                {/* 7. Data Sharing */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">7. Data Sharing</h2>
                    <p className="mb-3">We may share data with:</p>
                    <ul className="list-disc ml-6 space-y-2">
                        <li><strong className="text-foreground">Service Providers:</strong> Hosting, analytics, payment processing</li>
                        <li><strong className="text-foreground">Legal Authorities:</strong> When required by law</li>
                        <li><strong className="text-foreground">Business Transfers:</strong> In case of merger or acquisition</li>
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground">We do not sell your personal data.</p>
                </section>

                {/* 8. Cross-Border Transfer */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">8. Cross-Border Data Transfer</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Your data may be transferred to and processed in countries outside India. We ensure adequate safeguards are in place as required by the DPDP Act.</p>
                    </div>
                </section>

                {/* 9. Data Retention */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">9. Data Retention</h2>
                    <p>We retain data only as long as necessary for the purposes described. See <Link to="/data-retention" className="text-sky-500">Data Retention Policy</Link> for details.</p>
                </section>

                {/* 10. Security */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">10. Data Security</h2>
                    <ul className="list-disc ml-6 space-y-2">
                        <li>Encryption in transit and at rest</li>
                        <li>Access controls and authentication</li>
                        <li>Regular security assessments</li>
                        <li>Incident response procedures</li>
                    </ul>
                </section>

                {/* 11. Data Breach */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">11. Data Breach Notification</h2>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                        <p>In case of a personal data breach likely to cause harm, we will:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-3">
                            <li>Notify the Data Protection Board of India</li>
                            <li>Notify affected users promptly</li>
                            <li>Take remedial measures</li>
                        </ul>
                    </div>
                </section>

                {/* 12. Contact */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">12. Contact</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p>Privacy inquiries: <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></p>
                        <p className="mt-2">
                            <Link to="/grievance-redressal" className="text-sky-500">Grievance Officer</Link> |
                            <Link to="/contact" className="text-sky-500 ml-2">Contact Form</Link>
                        </p>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/cookies" className="text-sky-500 hover:underline">Cookie Policy</Link>
                        <Link to="/data-retention" className="text-sky-500 hover:underline">Data Retention</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
