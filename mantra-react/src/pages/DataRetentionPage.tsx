import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function DataRetentionPage() {
    const navigate = useNavigate();

    return (
        <div className="w-full mx-auto px-4 py-8 font-inter min-h-screen bg-background">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Data Retention & Deletion</h1>
                    <p className="text-foreground-secondary text-sm">How Long We Keep Your Data</p>
                </div>
            </div>

            <div className="space-y-8 text-foreground-secondary">

                {/* Introduction */}
                <section>
                    <p className="text-base leading-relaxed">
                        This policy explains how long we retain your data and how to request deletion.
                        This supplements our <Link to="/privacy" className="text-sky-500">Privacy Policy</Link>.
                    </p>
                </section>

                {/* 1. Retention Periods */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">1. Data Retention Periods</h2>
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-background-secondary">
                                <tr>
                                    <th className="p-3 text-left text-foreground">Data Type</th>
                                    <th className="p-3 text-left text-foreground">Retention</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="p-3">Account Data</td>
                                    <td className="p-3 text-muted-foreground">Until deletion + 30 days</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Novels & Chapters</td>
                                    <td className="p-3 text-muted-foreground">Until deleted by author</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Transaction Records</td>
                                    <td className="p-3 text-yellow-500">7 years (legal)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Reading History</td>
                                    <td className="p-3 text-muted-foreground">Until cleared or account deleted</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Chapter Unlocks</td>
                                    <td className="p-3 text-muted-foreground">90 days after expiration</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Moderation Records</td>
                                    <td className="p-3 text-muted-foreground">2 years after resolution</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Activity Logs</td>
                                    <td className="p-3 text-muted-foreground">90 days</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. Account Deletion */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">2. Account Deletion</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">To delete your account:</p>
                        <ol className="list-decimal ml-6 space-y-2">
                            <li>Go to Settings → Account</li>
                            <li>Click "Delete Account"</li>
                            <li>Confirm your password</li>
                            <li>Account deleted within 30 days</li>
                        </ol>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mt-4">
                        <p className="text-sm"><strong className="text-foreground">Note:</strong> Withdraw any pending earnings before deleting your account.</p>
                    </div>
                </section>

                {/* 3. What Gets Deleted */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">3. What Happens Upon Deletion</h2>
                    <div className="space-y-4">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-2">Immediately Deleted</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Profile information</li>
                                <li>Reading library & preferences</li>
                                <li>Saved wallet addresses</li>
                            </ul>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-2">Anonymized</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Published novels (become "Anonymous Author")</li>
                                <li>Comments & reviews (become "[Deleted User]")</li>
                            </ul>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <h3 className="font-semibold text-foreground mb-2">Retained (Legal)</h3>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li>Transaction records (7 years)</li>
                                <li>Moderation records (2 years)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 4. Right to Erasure */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">4. Right to Erasure (DPDP)</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">Under the DPDP Act 2023, you can request erasure when:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Data is no longer necessary</li>
                            <li>You withdraw consent</li>
                            <li>Data was processed unlawfully</li>
                        </ul>
                        <p className="mt-3 text-sm">Contact: <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></p>
                    </div>
                </section>

                {/* 5. Data Export */}
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4">5. Data Export</h2>
                    <div className="bg-card rounded-2xl p-5 border border-border">
                        <p className="mb-3">To request a copy of your data:</p>
                        <ol className="list-decimal ml-6 space-y-2">
                            <li>Email <a href="mailto:privacy@mantra.run.place" className="text-sky-500">privacy@mantra.run.place</a></li>
                            <li>Subject: "Data Export Request"</li>
                            <li>We'll respond within 15 days</li>
                        </ol>
                    </div>
                </section>

                {/* Related Policies */}
                <section className="border-t border-border pt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Related Policies</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>
                        <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
                        <Link to="/grievance-redressal" className="text-sky-500 hover:underline">Grievance Redressal</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
